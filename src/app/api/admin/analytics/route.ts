import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID не найден' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d
    const type = searchParams.get('type') || 'all' // all, views, plays, interactions

    // Вычисляем дату начала периода
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Получаем общую статистику
    const [
      totalViews,
      totalPlays,
      totalInteractions,
      uniqueUsers
    ] = await Promise.all([
      prisma.analyticsEvent.count({
        where: { 
          tenantId,
          type: { in: ['view_category', 'open_item'] },
          timestamp: { gte: startDate }
        }
      }),
      prisma.analyticsEvent.count({
        where: { 
          tenantId,
          type: { in: ['play_preview', 'play_full'] },
          timestamp: { gte: startDate }
        }
      }),
      prisma.analyticsEvent.count({
        where: { 
          tenantId,
          type: { in: ['unmute', 'share', 'favorite'] },
          timestamp: { gte: startDate }
        }
      }),
      prisma.analyticsEvent.findMany({
        where: { 
          tenantId,
          timestamp: { gte: startDate }
        },
        select: { sessionId: true },
        distinct: ['sessionId']
      })
    ])

    // Получаем данные по дням для графика
    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE(timestamp) as date,
        type,
        COUNT(*) as count
      FROM AnalyticsEvent 
      WHERE tenantId = ${tenantId} 
        AND timestamp >= ${startDate}
      GROUP BY DATE(timestamp), type
      ORDER BY date ASC
    ` as Array<{
      date: string
      type: string
      count: number
    }>

    // Получаем топ категории
    const topCategories = await prisma.analyticsEvent.groupBy({
      by: ['categoryId'],
      where: {
        tenantId,
        type: { in: ['view_category', 'open_item'] },
        timestamp: { gte: startDate },
        categoryId: { not: null }
      },
      _count: {
        categoryId: true
      },
      orderBy: {
        _count: {
          categoryId: 'desc'
        }
      },
      take: 5
    })

    // Получаем топ блюда
    const topItems = await prisma.analyticsEvent.groupBy({
      by: ['itemId'],
      where: {
        tenantId,
        type: { in: ['open_item', 'play_preview', 'play_full'] },
        timestamp: { gte: startDate },
        itemId: { not: null }
      },
      _count: {
        itemId: true
      },
      orderBy: {
        _count: {
          itemId: 'desc'
        }
      },
      take: 5
    })

    // Получаем детали для топ категорий и блюд
    const categoryDetails = await Promise.all(
      topCategories.map(async (cat) => {
        const category = await prisma.category.findUnique({
          where: { id: cat.categoryId! },
          select: { name: true }
        })
        return {
          id: cat.categoryId,
          name: category?.name || 'Неизвестная категория',
          views: cat._count.categoryId
        }
      })
    )

    const itemDetails = await Promise.all(
      topItems.map(async (item) => {
        const itemData = await prisma.item.findUnique({
          where: { id: item.itemId! },
          select: { name: true, category: { select: { name: true } } }
        })
        return {
          id: item.itemId,
          name: itemData?.name || 'Неизвестное блюдо',
          category: itemData?.category?.name || 'Без категории',
          interactions: item._count.itemId
        }
      })
    )

    // Получаем статистику по типам событий
    const eventTypeStats = await prisma.analyticsEvent.groupBy({
      by: ['type'],
      where: {
        tenantId,
        timestamp: { gte: startDate }
      },
      _count: {
        type: true
      },
      orderBy: {
        _count: {
          type: 'desc'
        }
      }
    })

    // Формируем данные для графика
    const chartData = dailyStats.reduce((acc: any, stat) => {
      const date = stat.date
      if (!acc[date]) {
        acc[date] = { date, views: 0, plays: 0, interactions: 0 }
      }
      
      if (['view_category', 'open_item'].includes(stat.type)) {
        acc[date].views += Number(stat.count)
      } else if (['play_preview', 'play_full'].includes(stat.type)) {
        acc[date].plays += Number(stat.count)
      } else if (['unmute', 'share', 'favorite'].includes(stat.type)) {
        acc[date].interactions += Number(stat.count)
      }
      
      return acc
    }, {})

    const chartDataArray = Object.values(chartData).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalViews,
          totalPlays,
          totalInteractions,
          uniqueUsers: uniqueUsers.length
        },
        chartData: chartDataArray,
        topCategories: categoryDetails,
        topItems: itemDetails,
        eventTypeStats: eventTypeStats.map(stat => ({
          type: stat.type,
          count: stat._count.type
        }))
      }
    })

  } catch (error) {
    console.error('Get analytics error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
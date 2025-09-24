import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const tenantId = authResult.user.tenantId

    // Получаем статистику
    const [
      totalMenus,
      totalCategories,
      totalItems,
      totalViews,
      totalPlays,
      recentActivity
    ] = await Promise.all([
      prisma.menu.count({
        where: { tenantId }
      }),
      prisma.category.count({
        where: { tenantId }
      }),
      prisma.item.count({
        where: { tenantId }
      }),
      prisma.analyticsEvent.count({
        where: { 
          tenantId,
          type: { in: ['view_category', 'open_item'] }
        }
      }),
      prisma.analyticsEvent.count({
        where: { 
          tenantId,
          type: { in: ['play_preview', 'play_full'] }
        }
      }),
      prisma.analyticsEvent.findMany({
        where: { tenantId },
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: {
          // Добавим информацию о связанных сущностях если нужно
        }
      })
    ])

    // Получаем топ блюда
    const topItems = await prisma.item.findMany({
      where: { tenantId },
      include: {
        category: true,
        itemMedia: {
          include: {
            media: true
          }
        }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: {
        totalMenus,
        totalCategories,
        totalItems,
        totalViews,
        totalPlays,
        recentActivity,
        topItems
      }
    })

  } catch (error) {
    console.error('Get admin stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

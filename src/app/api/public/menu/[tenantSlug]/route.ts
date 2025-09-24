import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const { tenantSlug } = params

    // Находим тенант по slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: {
        theme: true,
        locations: {
          include: {
            menus: {
              where: { active: true },
              include: {
                categories: {
                  include: {
                    items: {
                      include: {
                        prices: {
                          where: {
                            OR: [
                              { startAt: null },
                              { startAt: { lte: new Date() } }
                            ],
                            AND: [
                              { endAt: null },
                              { endAt: { gte: new Date() } }
                            ]
                          }
                        },
                        itemMedia: {
                          include: {
                            media: true
                          },
                          orderBy: { sort: 'asc' }
                        }
                      },
                      orderBy: { sort: 'asc' }
                    }
                  },
                  orderBy: { sort: 'asc' }
                }
              }
            }
          }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Ресторан не найден' },
        { status: 404 }
      )
    }

    if (tenant.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Ресторан недоступен' },
        { status: 403 }
      )
    }

    // Фильтруем только активные меню с категориями и блюдами
    const activeMenus = tenant.locations.flatMap(location =>
      location.menus.filter(menu => 
        menu.categories.length > 0 && 
        menu.categories.some(category => category.items.length > 0)
      )
    )

    if (activeMenus.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Меню пустое' },
        { status: 404 }
      )
    }

    // Фильтруем категории и блюда по видимости
    const filteredMenus = activeMenus.map(menu => ({
      ...menu,
      categories: menu.categories
        .filter(category => category.items.length > 0)
        .map(category => ({
          ...category,
          items: category.items.filter(item => {
            // Проверяем правила видимости
            if (item.visibilityRuleJson) {
              try {
                const rules = JSON.parse(item.visibilityRuleJson)
                const now = new Date()
                
                // Проверяем временные ограничения
                if (rules.startTime && new Date(rules.startTime) > now) return false
                if (rules.endTime && new Date(rules.endTime) < now) return false
                
                // Проверяем дни недели
                if (rules.daysOfWeek && !rules.daysOfWeek.includes(now.getDay())) return false
              } catch (e) {
                console.error('Error parsing visibility rules:', e)
              }
            }
            
            // Проверяем наличие цены
            return item.prices.length > 0
          })
        }))
        .filter(category => category.items.length > 0)
    })).filter(menu => menu.categories.length > 0)

    if (filteredMenus.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Нет доступных блюд' },
        { status: 404 }
      )
    }

    // Логируем просмотр меню для аналитики
    try {
      await prisma.analyticsEvent.create({
        data: {
          tenantId: tenant.id,
          type: 'view_category',
          sessionId: 'public-menu-view',
          payloadJson: JSON.stringify({
            menuId: filteredMenus[0].id,
            userAgent: request.headers.get('user-agent'),
            timestamp: new Date().toISOString()
          })
        }
      })
    } catch (e) {
      console.error('Error logging analytics:', e)
    }

    return NextResponse.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          theme: tenant.theme
        },
        menus: filteredMenus
      }
    })

  } catch (error) {
    console.error('Get public menu error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

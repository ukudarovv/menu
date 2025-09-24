import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const analyticsEventSchema = z.object({
  type: z.enum(['view_category', 'open_item', 'play_preview', 'unmute', 'play_full', 'complete', 'qr_scan']),
  itemId: z.string().optional(),
  categoryId: z.string().optional(),
  menuId: z.string().optional(),
  sessionId: z.string().default('anonymous'),
  payload: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = analyticsEventSchema.parse(body)

    // Получаем tenant ID из заголовка или из параметров запроса
    const tenantId = request.headers.get('x-tenant-id')
    
    if (!tenantId) {
      // Для публичных событий пытаемся найти tenant по itemId или categoryId
      let foundTenantId = null
      
      if (validatedData.itemId) {
        const item = await prisma.item.findUnique({
          where: { id: validatedData.itemId },
          select: { tenantId: true }
        })
        foundTenantId = item?.tenantId
      } else if (validatedData.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: validatedData.categoryId },
          select: { tenantId: true }
        })
        foundTenantId = category?.tenantId
      } else if (validatedData.menuId) {
        const menu = await prisma.menu.findUnique({
          where: { id: validatedData.menuId },
          select: { tenantId: true }
        })
        foundTenantId = menu?.tenantId
      }

      if (!foundTenantId) {
        return NextResponse.json(
          { success: false, error: 'Tenant ID не найден' },
          { status: 400 }
        )
      }

      // Создаем событие аналитики
      await prisma.analyticsEvent.create({
        data: {
          tenantId: foundTenantId,
          type: validatedData.type,
          sessionId: validatedData.sessionId,
          payloadJson: JSON.stringify({
            itemId: validatedData.itemId,
            categoryId: validatedData.categoryId,
            menuId: validatedData.menuId,
            userAgent: request.headers.get('user-agent'),
            timestamp: new Date().toISOString(),
            ...validatedData.payload
          })
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Событие записано'
      })
    }

    // Создаем событие аналитики для аутентифицированного пользователя
    await prisma.analyticsEvent.create({
      data: {
        tenantId,
        type: validatedData.type,
        sessionId: validatedData.sessionId,
        payloadJson: JSON.stringify({
          itemId: validatedData.itemId,
          categoryId: validatedData.categoryId,
          menuId: validatedData.menuId,
          userAgent: request.headers.get('user-agent'),
          timestamp: new Date().toISOString(),
          ...validatedData.payload
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Событие записано'
    })

  } catch (error) {
    console.error('Analytics event error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const createMenuSchema = z.object({
  name: z.string().min(1, 'Название меню обязательно'),
  locationId: z.string().min(1, 'ID локации обязателен'),
  active: z.boolean().default(true),
  scheduleJson: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID не найден' },
        { status: 400 }
      )
    }

    const menus = await prisma.menu.findMany({
      where: { tenantId },
      include: {
        location: true,
        categories: {
          include: {
            items: {
              include: {
                prices: true,
                itemMedia: {
                  include: {
                    media: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: menus
    })

  } catch (error) {
    console.error('Get menus error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID не найден' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = createMenuSchema.parse(body)

    // Проверяем, что локация принадлежит тенанту
    const location = await prisma.location.findFirst({
      where: {
        id: validatedData.locationId,
        tenantId
      }
    })

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Локация не найдена' },
        { status: 404 }
      )
    }

    const menu = await prisma.menu.create({
      data: {
        tenantId,
        locationId: validatedData.locationId,
        name: validatedData.name,
        active: validatedData.active,
        scheduleJson: validatedData.scheduleJson,
      },
      include: {
        location: true,
        categories: true
      }
    })

    return NextResponse.json({
      success: true,
      data: menu,
      message: 'Меню создано успешно'
    })

  } catch (error) {
    console.error('Create menu error:', error)
    
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

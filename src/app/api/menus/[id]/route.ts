import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const updateMenuSchema = z.object({
  name: z.string().min(1, 'Название меню обязательно').optional(),
  active: z.boolean().optional(),
  scheduleJson: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID не найден' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateMenuSchema.parse(body)

    // Проверяем, что меню принадлежит тенанту
    const existingMenu = await prisma.menu.findFirst({
      where: {
        id: params.id,
        tenantId
      }
    })

    if (!existingMenu) {
      return NextResponse.json(
        { success: false, error: 'Меню не найдено' },
        { status: 404 }
      )
    }

    const updatedMenu = await prisma.menu.update({
      where: { id: params.id },
      data: validatedData,
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
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedMenu,
      message: 'Меню обновлено успешно'
    })

  } catch (error) {
    console.error('Update menu error:', error)
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID не найден' },
        { status: 400 }
      )
    }

    // Проверяем, что меню принадлежит тенанту
    const existingMenu = await prisma.menu.findFirst({
      where: {
        id: params.id,
        tenantId
      }
    })

    if (!existingMenu) {
      return NextResponse.json(
        { success: false, error: 'Меню не найдено' },
        { status: 404 }
      )
    }

    await prisma.menu.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Меню удалено успешно'
    })

  } catch (error) {
    console.error('Delete menu error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

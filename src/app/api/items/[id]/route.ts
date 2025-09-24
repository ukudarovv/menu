import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const updateItemSchema = z.object({
  name: z.string().min(1, 'Название блюда обязательно').optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'ID категории обязателен').optional(),
  sku: z.string().optional(),
  tags: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  nutritionValuesJson: z.string().optional(),
  weightG: z.number().optional(),
  kcal: z.number().optional(),
  sort: z.number().optional(),
  visibilityRuleJson: z.string().optional(),
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
    const validatedData = updateItemSchema.parse(body)

    // Проверяем, что блюдо принадлежит тенанту
    const existingItem = await prisma.item.findFirst({
      where: {
        id: params.id,
        tenantId
      }
    })

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Блюдо не найдено' },
        { status: 404 }
      )
    }

    // Подготавливаем данные для обновления
    const updateData: any = { ...validatedData }
    if (validatedData.tags) {
      updateData.tags = JSON.stringify(validatedData.tags)
    }
    if (validatedData.allergens) {
      updateData.allergens = JSON.stringify(validatedData.allergens)
    }

    const updatedItem = await prisma.item.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: {
          include: {
            menu: true
          }
        },
        prices: true,
        itemMedia: {
          include: {
            media: true
          },
          orderBy: { sort: 'asc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedItem,
      message: 'Блюдо обновлено успешно'
    })

  } catch (error) {
    console.error('Update item error:', error)
    
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

    // Проверяем, что блюдо принадлежит тенанту
    const existingItem = await prisma.item.findFirst({
      where: {
        id: params.id,
        tenantId
      }
    })

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Блюдо не найдено' },
        { status: 404 }
      )
    }

    await prisma.item.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Блюдо удалено успешно'
    })

  } catch (error) {
    console.error('Delete item error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

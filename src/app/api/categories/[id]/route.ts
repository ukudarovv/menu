import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Название категории обязательно').optional(),
  sort: z.number().optional(),
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
    const validatedData = updateCategorySchema.parse(body)

    // Проверяем, что категория принадлежит тенанту
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: params.id,
        tenantId
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Категория не найдена' },
        { status: 404 }
      )
    }

    const updatedCategory = await prisma.category.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        menu: true,
        items: {
          include: {
            prices: true,
            itemMedia: {
              include: {
                media: true
              }
            }
          },
          orderBy: { sort: 'asc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: 'Категория обновлена успешно'
    })

  } catch (error) {
    console.error('Update category error:', error)
    
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

    // Проверяем, что категория принадлежит тенанту
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: params.id,
        tenantId
      },
      include: {
        items: true
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Категория не найдена' },
        { status: 404 }
      )
    }

    // Проверяем, есть ли блюда в категории
    if (existingCategory.items.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Нельзя удалить категорию с блюдами. Сначала удалите или переместите все блюда.' },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Категория удалена успешно'
    })

  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

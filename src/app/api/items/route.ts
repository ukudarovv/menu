import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const createItemSchema = z.object({
  name: z.string().min(1, 'Название блюда обязательно'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'ID категории обязателен'),
  sku: z.string().optional(),
  tags: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  nutritionValuesJson: z.string().optional(),
  weightG: z.number().optional(),
  kcal: z.number().optional(),
  sort: z.number().default(0),
  visibilityRuleJson: z.string().optional(),
  price: z.number().min(0, 'Цена не может быть отрицательной'),
  currency: z.string().default('USD'),
})

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id')
    const categoryId = request.nextUrl.searchParams.get('categoryId')
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID не найден' },
        { status: 400 }
      )
    }

    const whereClause: any = { tenantId }
    if (categoryId) {
      whereClause.categoryId = categoryId
    }

    const items = await prisma.item.findMany({
      where: whereClause,
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
      },
      orderBy: { sort: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: items
    })

  } catch (error) {
    console.error('Get items error:', error)
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
    const validatedData = createItemSchema.parse(body)

    // Проверяем, что категория принадлежит тенанту
    const category = await prisma.category.findFirst({
      where: {
        id: validatedData.categoryId,
        tenantId
      }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Категория не найдена' },
        { status: 404 }
      )
    }

    // Создаем блюдо
    const item = await prisma.item.create({
      data: {
        tenantId,
        categoryId: validatedData.categoryId,
        name: validatedData.name,
        description: validatedData.description,
        sku: validatedData.sku,
        tags: JSON.stringify(validatedData.tags),
        allergens: JSON.stringify(validatedData.allergens),
        nutritionValuesJson: validatedData.nutritionValuesJson,
        weightG: validatedData.weightG,
        kcal: validatedData.kcal,
        sort: validatedData.sort,
        visibilityRuleJson: validatedData.visibilityRuleJson,
      },
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
          }
        }
      }
    })

    // Создаем цену
    await prisma.price.create({
      data: {
        itemId: item.id,
        currency: validatedData.currency,
        amountMinor: Math.round(validatedData.price * 100), // Конвертируем в копейки/центы
      }
    })

    // Получаем обновленное блюдо с ценой
    const itemWithPrice = await prisma.item.findUnique({
      where: { id: item.id },
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
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: itemWithPrice,
      message: 'Блюдо создано успешно'
    })

  } catch (error) {
    console.error('Create item error:', error)
    
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

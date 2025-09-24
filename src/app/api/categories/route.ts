import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const createCategorySchema = z.object({
  name: z.string().min(1, 'Название категории обязательно'),
  menuId: z.string().min(1, 'ID меню обязателен'),
  sort: z.number().default(0),
})

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id')
    const menuId = request.nextUrl.searchParams.get('menuId')
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID не найден' },
        { status: 400 }
      )
    }

    const whereClause: any = { tenantId }
    if (menuId) {
      whereClause.menuId = menuId
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
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
      },
      orderBy: { sort: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: categories
    })

  } catch (error) {
    console.error('Get categories error:', error)
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
    const validatedData = createCategorySchema.parse(body)

    // Проверяем, что меню принадлежит тенанту
    const menu = await prisma.menu.findFirst({
      where: {
        id: validatedData.menuId,
        tenantId
      }
    })

    if (!menu) {
      return NextResponse.json(
        { success: false, error: 'Меню не найдено' },
        { status: 404 }
      )
    }

    const category = await prisma.category.create({
      data: {
        tenantId,
        menuId: validatedData.menuId,
        name: validatedData.name,
        sort: validatedData.sort,
      },
      include: {
        menu: true,
        items: true
      }
    })

    return NextResponse.json({
      success: true,
      data: category,
      message: 'Категория создана успешно'
    })

  } catch (error) {
    console.error('Create category error:', error)
    
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

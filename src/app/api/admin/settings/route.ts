import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const updateSettingsSchema = z.object({
  name: z.string().min(1, 'Название ресторана обязательно').optional(),
  description: z.string().optional(),
  website: z.string().url('Некорректный URL').optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email('Некорректный email').optional(),
  address: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
  theme: z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    logoUrl: z.string().optional(),
  }).optional(),
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

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        phone: true,
        email: true,
        address: true,
        timezone: true,
        currency: true,
        language: true,
        themeJson: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Ресторан не найден' },
        { status: 404 }
      )
    }

    // Парсим JSON поля
    const theme = tenant.themeJson ? JSON.parse(tenant.themeJson) : {}

    return NextResponse.json({
      success: true,
      data: {
        ...tenant,
        theme
      }
    })

  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID не найден' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateSettingsSchema.parse(body)

    // Проверяем, что тенант существует
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!existingTenant) {
      return NextResponse.json(
        { success: false, error: 'Ресторан не найден' },
        { status: 404 }
      )
    }

    // Подготавливаем данные для обновления
    const updateData: any = { ...validatedData }
    
    // Обрабатываем theme объект
    if (validatedData.theme) {
      updateData.themeJson = JSON.stringify(validatedData.theme)
      delete updateData.theme
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        phone: true,
        email: true,
        address: true,
        timezone: true,
        currency: true,
        language: true,
        themeJson: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    // Парсим theme обратно
    const theme = updatedTenant.themeJson ? JSON.parse(updatedTenant.themeJson) : {}

    return NextResponse.json({
      success: true,
      data: {
        ...updatedTenant,
        theme
      },
      message: 'Настройки сохранены успешно'
    })

  } catch (error) {
    console.error('Update settings error:', error)
    
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

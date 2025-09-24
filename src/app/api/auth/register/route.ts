import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { hashPassword, generateAccessToken, generateRefreshToken } from '@/lib/auth'

const registerSchema = z.object({
  tenantName: z.string().min(2, 'Название ресторана должно содержать минимум 2 символа'),
  tenantSlug: z.string()
    .min(2, 'URL должен содержать минимум 2 символа')
    .max(50, 'URL не должен превышать 50 символов')
    .regex(/^[a-z0-9-]+$/, 'URL может содержать только строчные буквы, цифры и дефисы'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Проверяем, не существует ли уже тенант с таким slug
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: validatedData.tenantSlug }
    })

    if (existingTenant) {
      return NextResponse.json(
        { success: false, error: 'Ресторан с таким URL уже существует' },
        { status: 400 }
      )
    }

    // Проверяем, не существует ли уже пользователь с таким email
    const existingUser = await prisma.user.findFirst({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      )
    }

    // Создаем тенант
    const tenant = await prisma.tenant.create({
      data: {
        name: validatedData.tenantName,
        slug: validatedData.tenantSlug,
        plan: 'free',
        status: 'active',
      }
    })

    // Создаем пользователя-владельца
    const hashedPassword = await hashPassword(validatedData.password)
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: validatedData.email,
        passwordHash: hashedPassword,
        role: 'owner',
        status: 'active',
      }
    })

    // Создаем дефолтную локацию
    const location = await prisma.location.create({
      data: {
        tenantId: tenant.id,
        name: 'Основная локация',
        timezone: 'UTC',
        currency: 'USD',
        locale: 'ru',
      }
    })

    // Создаем дефолтное меню
    const menu = await prisma.menu.create({
      data: {
        tenantId: tenant.id,
        locationId: location.id,
        name: 'Основное меню',
        active: true,
      }
    })

    // Создаем дефолтную тему
    await prisma.theme.create({
      data: {
        tenantId: tenant.id,
        paletteJson: JSON.stringify({
          primary: '#0ea5e9',
          secondary: '#d946ef',
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#1e293b',
        }),
      }
    })

    // Генерируем токены
    const accessToken = generateAccessToken({
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
      role: user.role,
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tenantId: tenant.id,
    })

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            plan: tenant.plan,
          }
        },
        accessToken,
        refreshToken,
      },
      message: 'Регистрация прошла успешно'
    })

  } catch (error) {
    console.error('Registration error:', error)
    
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

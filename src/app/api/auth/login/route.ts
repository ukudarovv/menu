import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyPassword, generateAccessToken, generateRefreshToken } from '@/lib/auth'

const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Login attempt:', body)
    const validatedData = loginSchema.parse(body)

    // Находим пользователя по email
    const user = await prisma.user.findFirst({
      where: { email: validatedData.email },
      include: { tenant: true }
    })

    console.log('User found:', user ? 'Yes' : 'No')

    if (!user) {
      console.log('User not found for email:', validatedData.email)
      return NextResponse.json(
        { success: false, error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    // Проверяем статус пользователя
    if (user.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Аккаунт заблокирован' },
        { status: 401 }
      )
    }

    // Проверяем статус тенанта
    if (user.tenant.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Ресторан заблокирован' },
        { status: 401 }
      )
    }

    // Проверяем пароль
    const isPasswordValid = await verifyPassword(validatedData.password, user.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    // Генерируем токены
    const accessToken = generateAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tenantId: user.tenantId,
    })

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          tenant: {
            id: user.tenant.id,
            name: user.tenant.name,
            slug: user.tenant.slug,
            plan: user.tenant.plan,
          }
        },
        accessToken,
        refreshToken,
      },
      message: 'Вход выполнен успешно'
    })

  } catch (error) {
    console.error('Login error:', error)
    
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

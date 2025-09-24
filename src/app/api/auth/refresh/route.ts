import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyRefreshToken, generateAccessToken } from '@/lib/auth'

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token обязателен'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = refreshSchema.parse(body)

    // Проверяем refresh token
    const payload = verifyRefreshToken(validatedData.refreshToken)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Недействительный refresh token' },
        { status: 401 }
      )
    }

    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { tenant: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не найден' },
        { status: 401 }
      )
    }

    // Проверяем статус пользователя и тенанта
    if (user.status !== 'active' || user.tenant.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Аккаунт заблокирован' },
        { status: 401 }
      )
    }

    // Генерируем новый access token
    const accessToken = generateAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    })

    return NextResponse.json({
      success: true,
      data: {
        accessToken,
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
        }
      },
      message: 'Токен обновлен успешно'
    })

  } catch (error) {
    console.error('Refresh token error:', error)
    
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

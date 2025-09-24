import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

const updateUserSchema = z.object({
  email: z.string().email('Некорректный email').optional(),
  name: z.string().min(1, 'Имя обязательно').optional(),
  role: z.enum(['owner', 'manager', 'staff']).optional(),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов').optional(),
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
    const validatedData = updateUserSchema.parse(body)

    // Проверяем, что пользователь принадлежит тенанту
    const existingUser = await prisma.user.findFirst({
      where: {
        id: params.id,
        tenantId
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Если меняется email, проверяем уникальность
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          tenantId,
          id: { not: params.id }
        }
      })

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Пользователь с таким email уже существует' },
          { status: 400 }
        )
      }
    }

    // Подготавливаем данные для обновления
    const updateData: any = { ...validatedData }
    
    // Если указан новый пароль, хешируем его
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Пользователь обновлен успешно'
    })

  } catch (error) {
    console.error('Update user error:', error)
    
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

    // Проверяем, что пользователь принадлежит тенанту
    const existingUser = await prisma.user.findFirst({
      where: {
        id: params.id,
        tenantId
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Нельзя удалить владельца
    if (existingUser.role === 'owner') {
      return NextResponse.json(
        { success: false, error: 'Нельзя удалить владельца ресторана' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Пользователь удален успешно'
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

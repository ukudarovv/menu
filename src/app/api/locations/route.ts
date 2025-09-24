import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

const createLocationSchema = z.object({
  name: z.string().min(1, 'Название локации обязательно'),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  capacity: z.number().optional(),
  isActive: z.boolean().optional(),
})

const updateLocationSchema = z.object({
  name: z.string().min(1, 'Название локации обязательно').optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  capacity: z.number().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const tenantId = authResult.user.tenantId

    const locations = await prisma.location.findMany({
      where: { tenantId },
      include: {
        menus: {
          select: {
            id: true,
            name: true,
            active: true
          }
        },
        _count: {
          select: {
            menus: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: locations
    })

  } catch (error) {
    console.error('Get locations error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const tenantId = authResult.user.tenantId

    const body = await request.json()
    const validatedData = createLocationSchema.parse(body)

    const location = await prisma.location.create({
      data: {
        ...validatedData,
        tenantId
      },
      include: {
        menus: {
          select: {
            id: true,
            name: true,
            active: true
          }
        },
        _count: {
          select: {
            menus: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: location,
      message: 'Локация создана успешно'
    })

  } catch (error) {
    console.error('Create location error:', error)
    
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
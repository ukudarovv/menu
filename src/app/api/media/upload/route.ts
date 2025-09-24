import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const uploadSchema = z.object({
  type: z.enum(['video', 'audio', 'image']),
  itemId: z.string().optional(),
  kind: z.enum(['preview', 'full', 'sound']).default('preview'),
})

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID не найден' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const itemId = formData.get('itemId') as string
    const kind = formData.get('kind') as string

    // Валидация
    const validatedData = uploadSchema.parse({
      type,
      itemId,
      kind
    })

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Файл не найден' },
        { status: 400 }
      )
    }

    // Проверяем размер файла (максимум 50MB для MVP)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Файл слишком большой (максимум 50MB)' },
        { status: 400 }
      )
    }

    // Проверяем тип файла
    const allowedTypes = {
      video: ['video/mp4', 'video/webm', 'video/quicktime'],
      audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac'],
      image: ['image/jpeg', 'image/png', 'image/webp']
    }

    if (!allowedTypes[validatedData.type as keyof typeof allowedTypes]?.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Неподдерживаемый тип файла' },
        { status: 400 }
      )
    }

    // Создаем директорию для загрузок
    const uploadDir = join(process.cwd(), 'uploads', tenantId)
    await mkdir(uploadDir, { recursive: true })

    // Генерируем уникальное имя файла
    const fileExtension = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`
    const filePath = join(uploadDir, fileName)

    // Сохраняем файл
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Создаем запись в базе данных
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        tenantId,
        type: validatedData.type,
        status: 'ready', // Для MVP пропускаем обработку
        originalUrl: `/uploads/${tenantId}/${fileName}`,
        // Для MVP используем оригинальный файл как HLS
        hlsUrl: validatedData.type === 'video' ? `/uploads/${tenantId}/${fileName}` : undefined,
        // Генерируем постер для видео (в реальном проекте это делал бы FFmpeg)
        posterUrl: validatedData.type === 'video' ? `/uploads/${tenantId}/${fileName}` : undefined,
      }
    })

    // Если указан itemId, связываем медиа с блюдом
    if (validatedData.itemId && itemId) {
      await prisma.itemMedia.create({
        data: {
          itemId: validatedData.itemId,
          mediaId: mediaAsset.id,
          kind: validatedData.kind,
          sort: 0
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: mediaAsset.id,
        url: mediaAsset.originalUrl,
        type: mediaAsset.type,
        status: mediaAsset.status
      },
      message: 'Файл загружен успешно'
    })

  } catch (error) {
    console.error('Upload error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Ошибка загрузки файла' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = join(process.cwd(), 'uploads', ...params.path)
    
    // Проверяем существование файла
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'Файл не найден' },
        { status: 404 }
      )
    }

    // Читаем файл
    const fileBuffer = await readFile(filePath)
    
    // Определяем MIME тип
    const extension = params.path[params.path.length - 1].split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mov': 'video/quicktime',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'aac': 'audio/aac',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
    }
    
    const mimeType = mimeTypes[extension || ''] || 'application/octet-stream'

    // Возвращаем файл
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })

  } catch (error) {
    console.error('Media serve error:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка получения файла' },
      { status: 500 }
    )
  }
}

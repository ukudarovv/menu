import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Публичные маршруты, которые не требуют аутентификации
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/menu',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/public',
    '/api/media',
  ]

  // Проверяем, является ли маршрут публичным
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Для всех остальных маршрутов просто пропускаем
  // Проверка аутентификации будет происходить в API routes
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

import { NextRequest } from 'next/server'
import { verifyAccessToken, JWTPayload } from './auth'

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload
}

export function authenticateRequest(request: NextRequest): { user: JWTPayload } | { error: string; status: number } {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return { error: 'Токен доступа не предоставлен', status: 401 }
  }

  const payload = verifyAccessToken(token)
  if (!payload) {
    return { error: 'Недействительный токен доступа', status: 401 }
  }

  return { user: payload }
}

export function getTenantId(request: NextRequest): string | null {
  // Сначала проверяем заголовок x-tenant-id (устанавливается middleware)
  const tenantHeader = request.headers.get('x-tenant-id')
  if (tenantHeader) return tenantHeader

  // Если нет заголовка, извлекаем из токена
  const authResult = authenticateRequest(request)
  if ('user' in authResult) {
    return authResult.user.tenantId
  }

  return null
}

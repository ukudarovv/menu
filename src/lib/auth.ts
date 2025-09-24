import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret'

export interface JWTPayload {
  userId: string
  tenantId: string
  email: string
  role: string
}

export interface RefreshTokenPayload {
  userId: string
  tenantId: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' })
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload
  } catch {
    return null
  }
}

export async function getUserFromToken(token: string) {
  const payload = verifyAccessToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { tenant: true }
  })

  return user
}

export function extractTenantFromRequest(request: Request): string | null {
  // Проверяем заголовок X-Tenant
  const tenantHeader = request.headers.get('X-Tenant')
  if (tenantHeader) return tenantHeader

  // Проверяем поддомен
  const host = request.headers.get('host')
  if (host) {
    const parts = host.split('.')
    if (parts.length > 2) {
      return parts[0]
    }
  }

  return null
}

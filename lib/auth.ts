import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { getUserByTelegramId } from '@/lib/models/user'

export interface JWTPayload {
  userId: number
  telegramId: string
  isAdmin: boolean
  iat?: number
  exp?: number
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-change-in-production'
const JWT_EXPIRES_IN = '7d' // Токен действует 7 дней

// Создание JWT токена
export function createJWTToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'ai-knowledge-base',
    audience: 'telegram-mini-app'
  })
}

// Верификация JWT токена
export function verifyJWTToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'ai-knowledge-base',
      audience: 'telegram-mini-app'
    }) as JWTPayload
    return decoded
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

// Получение текущего пользователя из cookies (server-side)
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    
    if (!token) {
      return null
    }

    const payload = verifyJWTToken(token)
    if (!payload) {
      return null
    }

    // Получаем актуальные данные пользователя из БД
    const user = await getUserByTelegramId(payload.telegramId)
    
    // Проверяем, что пользователь не заблокирован
    if (!user || user.is_blocked) {
      return null
    }

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Проверка, является ли пользователь администратором
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    const isAdmin = user?.is_admin || false
    
    // В development режиме дополнительно проверяем переменную окружения
    if (process.env.NODE_ENV === 'development') {
      const devAdminId = process.env.NEXT_PUBLIC_DEV_ADMIN_ID || "579218344"
      const isDev = user?.telegram_id === devAdminId
      return isAdmin || isDev
    }
    
    return isAdmin
  } catch (error) {
    console.error('Error checking admin status:', error)
    // В development режиме разрешаем доступ при ошибке
    return process.env.NODE_ENV === 'development'
  }
}

// Установка безопасных cookies
export async function setSecureCookies(telegramId: string, initData: string, token: string) {
  const cookieStore = await cookies()
  
  const cookieOptions = {
    httpOnly: true,
    secure: true, // ВСЕГДА true для Telegram Mini App (cross-origin iframe)
    sameSite: 'none' as const, // КРИТИЧНО для Telegram Mini App (iframe/cross-origin)
    maxAge: 7 * 24 * 60 * 60, // 7 дней
    path: '/'
  }

  console.log('Setting cookies with options:', cookieOptions)

  cookieStore.set('telegram_id', telegramId, cookieOptions)
  cookieStore.set('telegram_init_data', initData, cookieOptions)
  cookieStore.set('auth_token', token, cookieOptions)
}

// Очистка cookies при выходе
export async function clearAuthCookies() {
  const cookieStore = await cookies()
  
  cookieStore.delete('telegram_id')
  cookieStore.delete('telegram_init_data')
  cookieStore.delete('auth_token')
}

// Middleware helper для API routes
export async function requireAuth(request: Request): Promise<{user: any, error?: string}> {
  try {
    // В Telegram Mini App используем headers, так как cookies могут блокироваться
    const telegramId = request.headers.get('x-telegram-id')
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') || 
                     request.headers.get('x-auth-token')
    
    if (!telegramId) {
      return { user: null, error: 'Missing telegram ID' }
    }

    // Получаем пользователя из базы данных
    const user = await getUserByTelegramId(telegramId)
    
    if (!user) {
      return { user: null, error: 'User not found' }
    }
    
    if (user.is_blocked) {
      return { user: null, error: 'User is blocked' }
    }

    // В режиме production дополнительно проверяем JWT токен если он передан
    if (process.env.NODE_ENV === 'production' && authToken) {
      const tokenPayload = verifyJWTToken(authToken)
      if (!tokenPayload || tokenPayload.telegramId !== telegramId) {
        return { user: null, error: 'Invalid auth token' }
      }
    }

    return { user }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return { user: null, error: 'Authentication failed' }
  }
}

// Middleware helper для админских API routes
export async function requireAdmin(request: Request): Promise<{user: any, error?: string}> {
  const { user, error } = await requireAuth(request)
  
  if (error || !user) {
    return { user: null, error: error || 'Authentication required' }
  }
  
  if (!user.is_admin) {
    return { user: null, error: 'Admin access required' }
  }
  
  return { user }
} 
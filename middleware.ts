import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'


// Функция для получения пользователя из базы данных
async function getUserByTelegramId(telegramId: string) {
  try {
    // Импортируем функцию внутри middleware для избежания проблем с Edge Runtime
    const { getUserByTelegramId: getUser } = await import('@/lib/models/user')
    return await getUser(telegramId)
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

export async function middleware(request: NextRequest) {
  // Проверяем админские роуты
  if (request.nextUrl.pathname.startsWith('/admin')) {
    try {
      const telegramIdFromHeader = request.headers.get('x-telegram-id')
      const telegramIdFromCookie = request.cookies.get('telegram_id')?.value
      const telegramId = telegramIdFromHeader || telegramIdFromCookie
      
      const isDevelopment = process.env.NODE_ENV === 'development'
      
      if (!telegramId && !isDevelopment) {
        return NextResponse.redirect(new URL('/', request.url))
      }

      // Если есть telegram_id, проверяем права админа
      if (telegramId) {
        const user = await getUserByTelegramId(telegramId)
        
        if (!user) {
          return NextResponse.redirect(new URL('/', request.url))
        }
        
        if (!user.is_admin) {
          return NextResponse.redirect(new URL('/', request.url))
        }

        if (user.is_blocked) {
          return NextResponse.redirect(new URL('/', request.url))
        }

        // Добавляем заголовки для подтверждения авторизации
        const response = NextResponse.next()
        response.headers.set('x-user-id', user.id.toString())
        response.headers.set('x-user-admin', 'true')
        
        return response
      }

      // В development без telegram_id разрешаем доступ
      if (isDevelopment) {
        return NextResponse.next()
      }

    } catch (error) {
      console.error('❌ Middleware error:', error)
      // В случае ошибки в development - разрешаем, в production - блокируем
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.next()
      }
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
  runtime: 'nodejs'
} 
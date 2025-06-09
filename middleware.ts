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
  // В development режиме пропускаем все админские роуты без проверки
  // так как проверка теперь происходит на клиенте
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  // В production проверяем админские роуты
  if (request.nextUrl.pathname.startsWith('/admin')) {
    try {
      const telegramIdFromHeader = request.headers.get('x-telegram-id')
      const telegramIdFromCookie = request.cookies.get('telegram_id')?.value
      const telegramId = telegramIdFromHeader || telegramIdFromCookie
      
      if (!telegramId) {
        return NextResponse.redirect(new URL('/', request.url))
      }

      // Если есть telegram_id, проверяем права админа
      const user = await getUserByTelegramId(telegramId)
      
      if (!user || !user.is_admin || user.is_blocked) {
        return NextResponse.redirect(new URL('/', request.url))
      }

      // Добавляем заголовки для подтверждения авторизации
      const response = NextResponse.next()
      response.headers.set('x-user-id', user.id.toString())
      response.headers.set('x-user-admin', 'true')
      
      return response

    } catch (error) {
      console.error('❌ Middleware error:', error)
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
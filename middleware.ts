import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createHash, createHmac } from 'crypto'

// Функция для проверки данных авторизации Telegram WebApp
function verifyTelegramWebAppData(initData: string): boolean {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN is not defined")
      return false
    }

    // Парсим initData
    const params = new URLSearchParams(initData)
    const hash = params.get("hash")
    if (!hash) {
      console.error("No hash found in initData")
      return false
    }

    // Удаляем hash из проверяемых данных
    params.delete("hash")

    // Сортируем параметры
    const keys = Array.from(params.keys()).sort()
    const dataCheckString = keys.map((key) => `${key}=${params.get(key)}`).join("\n")

    // Создаем секретный ключ из токена бота
    const secretKey = createHash("sha256").update(botToken).digest()

    // Вычисляем HMAC
    const calculatedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex")

    return calculatedHash === hash
  } catch (error) {
    console.error("Error verifying Telegram WebApp data:", error)
    return false
  }
}

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
      console.log("=== ADMIN MIDDLEWARE DEBUG ===")
      console.log("Request URL:", request.nextUrl.pathname)
      
      // В Telegram Mini App в основном используем localStorage -> headers
      // Cookies могут не работать в iframe
      const telegramIdFromHeader = request.headers.get('x-telegram-id')
      const telegramIdFromCookie = request.cookies.get('telegram_id')?.value
      const telegramId = telegramIdFromHeader || telegramIdFromCookie

      console.log("Auth check:", {
        header: telegramIdFromHeader,
        cookie: telegramIdFromCookie,
        final: telegramId,
        hasHeader: !!telegramIdFromHeader,
        hasCookie: !!telegramIdFromCookie
      })

      // В development режиме разрешаем доступ для тестирования
      const isDevelopment = process.env.NODE_ENV === 'development'
      console.log("Environment:", process.env.NODE_ENV)
      console.log("Is development:", isDevelopment)
      
      if (!telegramId && !isDevelopment) {
        console.log('❌ No telegram_id found in production, redirecting to home')
        return NextResponse.redirect(new URL('/', request.url))
      }

      // Если есть telegram_id, проверяем права админа
      if (telegramId) {
        console.log("Checking user permissions for telegram_id:", telegramId)
        const user = await getUserByTelegramId(telegramId)
        
        if (!user) {
          console.log('❌ User not found in database, redirecting to home')
          return NextResponse.redirect(new URL('/', request.url))
        }

        console.log("User found:", {
          id: user.id,
          telegram_id: user.telegram_id,
          is_admin: user.is_admin,
          is_blocked: user.is_blocked
        })
        
        if (!user.is_admin) {
          console.log('❌ User is not admin, redirecting to home')
          return NextResponse.redirect(new URL('/', request.url))
        }

        if (user.is_blocked) {
          console.log('❌ User is blocked, redirecting to home')
          return NextResponse.redirect(new URL('/', request.url))
        }

        // Добавляем заголовки для подтверждения авторизации
        const response = NextResponse.next()
        response.headers.set('x-user-id', user.id.toString())
        response.headers.set('x-user-admin', 'true')
        
        console.log("✅ Admin access granted for user:", user.id)
        console.log("=== END ADMIN MIDDLEWARE DEBUG ===")
        return response
      }

      // В development без telegram_id тоже разрешаем
      if (isDevelopment) {
        console.log('⚠️ Development mode: allowing admin access without telegram_id')
        console.log("=== END ADMIN MIDDLEWARE DEBUG ===")
        return NextResponse.next()
      }

    } catch (error) {
      console.error('❌ Middleware error:', error)
      // В случае ошибки в development - разрешаем, в production - блокируем
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Development mode: allowing access despite error')
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
  ]
} 
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
      // Получаем telegram_id из cookies или headers
      const telegramId = request.cookies.get('telegram_id')?.value || 
                        request.headers.get('x-telegram-id')

      if (!telegramId) {
        console.log('No telegram_id found, redirecting to home')
        return NextResponse.redirect(new URL('/', request.url))
      }

      // Проверяем initData из cookies для дополнительной безопасности
      const initData = request.cookies.get('telegram_init_data')?.value
      const isDevelopment = process.env.NODE_ENV === 'development'

      // В продакшене проверяем подпись Telegram
      if (!isDevelopment && initData && !verifyTelegramWebAppData(initData)) {
        console.log('Invalid Telegram signature, redirecting to home')
        return NextResponse.redirect(new URL('/', request.url))
      }

      // Проверяем, является ли пользователь администратором
      const user = await getUserByTelegramId(telegramId)
      
      if (!user || !user.is_admin) {
        console.log('User is not admin, redirecting to home')
        return NextResponse.redirect(new URL('/', request.url))
      }

      // Добавляем заголовки для подтверждения авторизации
      const response = NextResponse.next()
      response.headers.set('x-user-id', user.id.toString())
      response.headers.set('x-user-admin', 'true')
      
      return response
    } catch (error) {
      console.error('Middleware error:', error)
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
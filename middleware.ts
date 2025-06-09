import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createHash, createHmac } from 'crypto'

// Функция для проверки данных авторизации Telegram WebApp
function verifyTelegramWebAppData(initData: string): boolean {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      console.error("❌ TELEGRAM_BOT_TOKEN is not defined")
      return false
    }

    // Extract hash
    const hashMatch = initData.match(/hash=([^&]*)/);
    if (!hashMatch) {
      console.error("❌ No hash found in initData");
      return false;
    }
    const hash = hashMatch[1];

    // Parse parameters: remove only hash, keep signature
    const params = initData.split('&')
      .filter(p => !p.startsWith('hash='))
      .map(p => {
        const eqIndex = p.indexOf('=');
        return {
          key: p.substring(0, eqIndex),
          value: decodeURIComponent(p.substring(eqIndex + 1) || '')
        };
      });

    // Sort by key
    params.sort((a, b) => a.key.localeCompare(b.key));

    // Build data check string
    const dataCheckString = params.map(p => `${p.key}=${p.value}`).join('\n');

    // Create secret key
    const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest()

    // Calculate hash
    const calculatedHash = createHmac("sha256", secretKey)
      .update(dataCheckString, "utf8")
      .digest("hex")

    return calculatedHash === hash;
  } catch (error) {
    console.error("❌ Error verifying Telegram WebApp data:", error)
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
  ]
} 
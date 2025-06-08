import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createHash, createHmac } from 'crypto'

// Функция для проверки данных авторизации Telegram WebApp
function verifyTelegramWebAppData(initData: string): boolean {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      console.error("❌ MIDDLEWARE: TELEGRAM_BOT_TOKEN is not defined")
      return false
    }

    console.log("🔍 MIDDLEWARE: Starting Telegram signature verification...")
    console.log("🔑 MIDDLEWARE: Bot token:", botToken) // Для отладки выводим токен
    console.log("🔑 MIDDLEWARE: Bot token length:", botToken.length)
    console.log("🔍 MIDDLEWARE: RAW initData:", initData)

    // Извлекаем hash до обработки (чтобы избежать декодирования)
    const hashMatch = initData.match(/hash=([^&]*)/);
    if (!hashMatch) {
      console.error("❌ MIDDLEWARE: No hash found in initData");
      return false;
    }
    const hash = hashMatch[1];
    console.log("📝 MIDDLEWARE: Extracted hash:", hash);

    // Разбиваем на параметры, сохраняя исходное кодирование (БЕЗ URLSearchParams!)
    const params = initData.split('&')
      .filter(p => !p.startsWith('hash=') && !p.startsWith('signature='))
      .map(p => {
        const eqIndex = p.indexOf('=');
        return {
          key: p.substring(0, eqIndex),
          value: p.substring(eqIndex + 1) || ''
        };
      });

    console.log("🔤 MIDDLEWARE: Found parameters:", params.map(p => p.key));

    // Сортируем по ключу
    params.sort((a, b) => a.key.localeCompare(b.key));

    // Формируем строку с исходными значениями (БЕЗ декодирования!)
    const dataCheckString = params.map(p => `${p.key}=${p.value}`).join('\n');
    console.log("📋 MIDDLEWARE: Data check string (with URL encoding preserved):");
    console.log(dataCheckString);

    // Создаем секретный ключ из токена бота
    const secretKey = createHash("sha256").update(botToken).digest()
    console.log("🔐 MIDDLEWARE: Secret key created, length:", secretKey.length)

    // Вычисляем HMAC
    const calculatedHash = createHmac("sha256", secretKey)
      .update(dataCheckString, "utf8")
      .digest("hex")

    console.log("🧮 MIDDLEWARE: Calculated hash:", calculatedHash)
    console.log("📨 MIDDLEWARE: Expected hash:  ", hash)
    console.log("✅ MIDDLEWARE: Hashes match:", calculatedHash === hash)

    const isValid = calculatedHash === hash;
    if (!isValid) {
      console.log("❌ MIDDLEWARE: SIGNATURE VERIFICATION FAILED!")
      console.log("🔍 MIDDLEWARE: Debug info for failed verification:")
      console.log("- Bot token exists:", !!botToken)
      console.log("- Bot token (FULL):", botToken) // Полный токен без маскирования
      console.log("- InitData length:", initData.length)
      console.log("- InitData (FULL):", initData) // Полные данные
      console.log("- Hash extracted successfully:", !!hash)
      console.log("- Hash (FULL):", hash) // Полный хеш
      console.log("- Parameters count:", params.length)
      console.log("- DataCheckString (FULL):", dataCheckString) // Полная строка для проверки
      console.log("- Calculated hash (FULL):", calculatedHash) // Полный вычисленный хеш
    }

    return isValid;
  } catch (error) {
    console.error("❌ MIDDLEWARE: Error verifying Telegram WebApp data:", error)
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
      const authTokenFromHeader = request.headers.get('x-auth-token')
      const authTokenFromCookie = request.cookies.get('auth_token')?.value
      
      console.log("🔍 Detailed auth check:", {
        "x-telegram-id header": telegramIdFromHeader,
        "telegram_id cookie": telegramIdFromCookie,
        "x-auth-token header": authTokenFromHeader ? authTokenFromHeader.substring(0, 20) + "..." : null,
        "auth_token cookie": authTokenFromCookie ? authTokenFromCookie.substring(0, 20) + "..." : null,
        "all headers": Object.fromEntries(request.headers.entries()),
        "all cookies": Object.fromEntries(
          Array.from(request.cookies.getAll()).map(cookie => [cookie.name, cookie.value])
        )
      })

      const telegramId = telegramIdFromHeader || telegramIdFromCookie
      
      console.log("Final telegram_id:", telegramId)

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
        console.log("✅ Found telegram_id, checking user permissions:", telegramId)
        const user = await getUserByTelegramId(telegramId)
        
        if (!user) {
          console.log('❌ User not found in database, redirecting to home')
          return NextResponse.redirect(new URL('/', request.url))
        }

        console.log("✅ User found in database:", {
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

      // В development без telegram_id разрешаем доступ
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
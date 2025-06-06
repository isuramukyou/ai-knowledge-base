import { type NextRequest, NextResponse } from "next/server"
import { createUser, getUserByTelegramId, updateUser } from "@/lib/models/user"
import { createHash, createHmac } from "crypto"
import { createJWTToken, setSecureCookies } from "@/lib/auth"

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

    const isValid = calculatedHash === hash
    console.log("Telegram WebApp data verification:", isValid)

    return isValid
  } catch (error) {
    console.error("Error verifying Telegram WebApp data:", error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { initData, user } = data

    console.log("Received authentication request for user:", user?.id)

    // В режиме разработки можем пропустить проверку initData
    const isDevelopment = process.env.NODE_ENV === "development"

    if (!isDevelopment && initData && !verifyTelegramWebAppData(initData)) {
      return NextResponse.json({ error: "Invalid authentication data" }, { status: 401 })
    }

    // Проверка срока действия авторизации (не более 24 часов)
    if (!isDevelopment && initData) {
      const authDate = Number.parseInt(new URLSearchParams(initData).get("auth_date") || "0") * 1000
      const now = Date.now()
      if (now - authDate > 86400000) {
        return NextResponse.json({ error: "Authentication data expired" }, { status: 401 })
      }
    }

    if (!user || !user.id) {
      return NextResponse.json({ error: "User data is missing" }, { status: 400 })
    }

    // Поиск пользователя или создание нового
    let dbUser = await getUserByTelegramId(user.id.toString())

    if (!dbUser) {
      console.log("Creating new user:", user.id)

      // Проверка, является ли пользователь администратором
      const isAdmin = user.id.toString() === process.env.ADMIN_TELEGRAM_ID

      dbUser = await createUser({
        telegram_id: user.id.toString(),
        username: user.username || null,
        first_name: user.first_name,
        last_name: user.last_name || null,
        avatar_url: user.photo_url || null,
        is_admin: isAdmin,
      })

      console.log("User created successfully:", dbUser.id)
    } else {
      console.log("User found, updating data:", dbUser.id)

      // Обновляем данные пользователя при каждом входе
      dbUser =
        (await updateUser(dbUser.id, {
          username: user.username || null,
          first_name: user.first_name,
          last_name: user.last_name || null,
          avatar_url: user.photo_url || null,
        })) || dbUser
    }

    if (dbUser.is_blocked) {
      return NextResponse.json({ error: "Your account has been blocked" }, { status: 403 })
    }

    // Генерируем JWT токен
    const token = createJWTToken({
      userId: dbUser.id,
      telegramId: dbUser.telegram_id,
      isAdmin: dbUser.is_admin
    })

    // Устанавливаем безопасные cookies
    await setSecureCookies(dbUser.telegram_id, initData || '', token)

    console.log("Authentication successful for user:", dbUser.id)
    console.log("Cookies set:", {
      telegram_id: dbUser.telegram_id,
      has_initData: !!initData,
      environment: process.env.NODE_ENV
    })

    return NextResponse.json({
      user: {
        id: dbUser.id,
        telegram_id: dbUser.telegram_id,
        username: dbUser.username,
        first_name: dbUser.first_name,
        last_name: dbUser.last_name,
        avatar_url: dbUser.avatar_url,
        is_admin: dbUser.is_admin,
        is_blocked: dbUser.is_blocked,
      },
      token,
    })
  } catch (error) {
    console.error("Error during Telegram authentication:", error)
    return NextResponse.json(
      {
        error: "Authentication failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

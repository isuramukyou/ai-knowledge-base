import { type NextRequest, NextResponse } from "next/server"
import { createUser, getUserByTelegramId } from "@/lib/models/user"
import { createHash, createHmac } from "crypto"

// Функция для проверки данных авторизации Telegram WebApp
function verifyTelegramWebAppData(initData: string): boolean {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      throw new Error("TELEGRAM_BOT_TOKEN is not defined")
    }

    // Парсим initData
    const params = new URLSearchParams(initData)
    const hash = params.get("hash")
    if (!hash) return false

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

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { initData, user } = data

    // Проверка данных авторизации
    if (!verifyTelegramWebAppData(initData)) {
      return NextResponse.json({ error: "Invalid authentication data" }, { status: 401 })
    }

    // Проверка срока действия авторизации (не более 24 часов)
    const authDate = Number.parseInt(new URLSearchParams(initData).get("auth_date") || "0") * 1000
    const now = Date.now()
    if (now - authDate > 86400000) {
      // 24 часа в миллисекундах
      return NextResponse.json({ error: "Authentication data expired" }, { status: 401 })
    }

    if (!user || !user.id) {
      return NextResponse.json({ error: "User data is missing" }, { status: 400 })
    }

    // Поиск пользователя или создание нового
    let dbUser = await getUserByTelegramId(user.id.toString())

    if (!dbUser) {
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
    }

    if (dbUser.is_blocked) {
      return NextResponse.json({ error: "Your account has been blocked" }, { status: 403 })
    }

    // Создаем JWT токен для клиента
    // В реальном приложении здесь должна быть генерация JWT
    // Для простоты примера возвращаем данные пользователя

    return NextResponse.json({
      user: {
        id: dbUser.id,
        telegram_id: dbUser.telegram_id,
        username: dbUser.username,
        first_name: dbUser.first_name,
        last_name: dbUser.last_name,
        avatar_url: dbUser.avatar_url,
        is_admin: dbUser.is_admin,
      },
      token: "sample-jwt-token", // В реальном приложении здесь должен быть JWT
    })
  } catch (error) {
    console.error("Error during Telegram authentication:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}

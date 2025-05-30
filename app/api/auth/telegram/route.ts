import { type NextRequest, NextResponse } from "next/server"
import { createUser, getUserByTelegramId } from "@/lib/models/user"
import { createHash, createHmac } from "crypto"

// Функция для проверки данных авторизации Telegram
function verifyTelegramAuth(data: any): boolean {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not defined")
  }

  const secretKey = createHash("sha256").update(botToken).digest()

  const dataCheckString = Object.keys(data)
    .filter((key) => key !== "hash")
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join("\n")

  const hmac = createHmac("sha256", secretKey).update(dataCheckString).digest("hex")

  return hmac === data.hash
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Проверка данных авторизации
    if (!verifyTelegramAuth(data)) {
      return NextResponse.json({ error: "Invalid authentication data" }, { status: 401 })
    }

    // Проверка срока действия авторизации (не более 24 часов)
    const authDate = Number.parseInt(data.auth_date) * 1000
    const now = Date.now()
    if (now - authDate > 86400000) {
      // 24 часа в миллисекундах
      return NextResponse.json({ error: "Authentication data expired" }, { status: 401 })
    }

    // Поиск пользователя или создание нового
    let user = await getUserByTelegramId(data.id.toString())

    if (!user) {
      // Проверка, является ли пользователь администратором
      const isAdmin = data.id.toString() === process.env.ADMIN_TELEGRAM_ID

      user = await createUser({
        telegram_id: data.id.toString(),
        username: data.username || null,
        first_name: data.first_name,
        last_name: data.last_name || null,
        avatar_url: data.photo_url || null,
        is_admin: isAdmin,
      })
    }

    if (user.is_blocked) {
      return NextResponse.json({ error: "Your account has been blocked" }, { status: 403 })
    }

    // Создаем JWT токен для клиента
    // В реальном приложении здесь должна быть генерация JWT
    // Для простоты примера возвращаем данные пользователя

    return NextResponse.json({
      user: {
        id: user.id,
        telegram_id: user.telegram_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        is_admin: user.is_admin,
      },
      token: "sample-jwt-token", // В реальном приложении здесь должен быть JWT
    })
  } catch (error) {
    console.error("Error during Telegram authentication:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { blockUser } from "@/lib/models/user"
import { getUserByTelegramId } from "@/lib/models/user"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const { isBlocked } = await request.json()

    // Проверка авторизации
    const telegramId = request.headers.get("x-telegram-id")
    if (!telegramId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserByTelegramId(telegramId)
    if (!user || !user.is_admin) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 })
    }

    const updatedUser = await blockUser(id, isBlocked)

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error blocking/unblocking user:", error)
    return NextResponse.json({ error: "Failed to block/unblock user" }, { status: 500 })
  }
}

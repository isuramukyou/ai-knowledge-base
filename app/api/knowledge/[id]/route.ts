import { type NextRequest, NextResponse } from "next/server"
import { getKnowledgeItemById, updateKnowledgeItem, deleteKnowledgeItem } from "@/lib/models/knowledge-item"
import { getUserByTelegramId } from "@/lib/models/user"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const item = await getKnowledgeItemById(id)

    if (!item) {
      return NextResponse.json({ error: "Knowledge item not found" }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error("Error fetching knowledge item:", error)
    return NextResponse.json({ error: "Failed to fetch knowledge item" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()

    // Проверка авторизации
    const telegramId = request.headers.get("x-telegram-id")
    if (!telegramId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserByTelegramId(telegramId)
    if (!user || user.is_blocked) {
      return NextResponse.json({ error: "Unauthorized or account blocked" }, { status: 401 })
    }

    try {
      const updatedItem = await updateKnowledgeItem(id, body, user.id)

      if (!updatedItem) {
        return NextResponse.json({ error: "Knowledge item not found or no changes made" }, { status: 404 })
      }

      return NextResponse.json(updatedItem)
    } catch (error: any) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      throw error
    }
  } catch (error) {
    console.error("Error updating knowledge item:", error)
    return NextResponse.json({ error: "Failed to update knowledge item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    // Проверка авторизации
    const telegramId = request.headers.get("x-telegram-id")
    if (!telegramId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserByTelegramId(telegramId)
    if (!user || user.is_blocked) {
      return NextResponse.json({ error: "Unauthorized or account blocked" }, { status: 401 })
    }

    try {
      const success = await deleteKnowledgeItem(id, user.id)

      if (!success) {
        return NextResponse.json({ error: "Knowledge item not found" }, { status: 404 })
      }

      return NextResponse.json({ success: true })
    } catch (error: any) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      throw error
    }
  } catch (error) {
    console.error("Error deleting knowledge item:", error)
    return NextResponse.json({ error: "Failed to delete knowledge item" }, { status: 500 })
  }
}

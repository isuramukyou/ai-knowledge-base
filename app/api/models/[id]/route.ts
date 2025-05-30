import { type NextRequest, NextResponse } from "next/server"
import { getAIModelById, updateAIModel, deleteAIModel } from "@/lib/models/ai-model"
import { getUserByTelegramId } from "@/lib/models/user"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const model = await getAIModelById(id)

    if (!model) {
      return NextResponse.json({ error: "AI model not found" }, { status: 404 })
    }

    return NextResponse.json(model)
  } catch (error) {
    console.error("Error fetching AI model:", error)
    return NextResponse.json({ error: "Failed to fetch AI model" }, { status: 500 })
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
      const updatedModel = await updateAIModel(id, body, user.id)

      if (!updatedModel) {
        return NextResponse.json({ error: "AI model not found or no changes made" }, { status: 404 })
      }

      return NextResponse.json(updatedModel)
    } catch (error: any) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      throw error
    }
  } catch (error) {
    console.error("Error updating AI model:", error)
    return NextResponse.json({ error: "Failed to update AI model" }, { status: 500 })
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
      const success = await deleteAIModel(id, user.id)

      if (!success) {
        return NextResponse.json({ error: "AI model not found" }, { status: 404 })
      }

      return NextResponse.json({ success: true })
    } catch (error: any) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      throw error
    }
  } catch (error) {
    console.error("Error deleting AI model:", error)
    return NextResponse.json({ error: "Failed to delete AI model" }, { status: 500 })
  }
}

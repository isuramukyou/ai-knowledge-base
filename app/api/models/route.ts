import { type NextRequest, NextResponse } from "next/server"
import { getAllAIModels, createAIModel } from "@/lib/models/ai-model"
import { getUserByTelegramId } from "@/lib/models/user"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || undefined
    const categoryId = searchParams.get("category")
      ? Number.parseInt(searchParams.get("category") as string)
      : undefined

    const { models, total } = await getAllAIModels(page, limit, search, categoryId)

    return NextResponse.json({
      models,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching AI models:", error)
    return NextResponse.json({ error: "Failed to fetch AI models" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Валидация данных
    const { name, description, category_id } = body
    if (!name || !description || !category_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Создание модели
    const model = await createAIModel({
      ...body,
      author_id: user.id,
    })

    return NextResponse.json(model, { status: 201 })
  } catch (error) {
    console.error("Error creating AI model:", error)
    return NextResponse.json({ error: "Failed to create AI model" }, { status: 500 })
  }
}

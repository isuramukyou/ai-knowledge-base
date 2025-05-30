import { type NextRequest, NextResponse } from "next/server"
import { getAllKnowledgeItems, createKnowledgeItem } from "@/lib/models/knowledge-item"
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
    const type = searchParams.get("type") || undefined

    const { items, total } = await getAllKnowledgeItems(page, limit, search, categoryId, type)

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching knowledge items:", error)
    return NextResponse.json({ error: "Failed to fetch knowledge items" }, { status: 500 })
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
    const { title, description, type, category_id } = body
    if (!title || !description || !type || !category_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Проверка типа
    if (!["article", "link", "video"].includes(type)) {
      return NextResponse.json({ error: "Invalid type. Must be one of: article, link, video" }, { status: 400 })
    }

    // Проверка URL для типов link и video
    if ((type === "link" || type === "video") && !body.url) {
      return NextResponse.json({ error: "URL is required for link and video types" }, { status: 400 })
    }

    // Создание записи
    const item = await createKnowledgeItem({
      ...body,
      author_id: user.id,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("Error creating knowledge item:", error)
    return NextResponse.json({ error: "Failed to create knowledge item" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { getAllKnowledgeItems, createKnowledgeItem, getKnowledgeItemById } from "@/lib/models/knowledge-item"
import { getUserByTelegramId } from "@/lib/models/user"
import { sendNewKnowledgeItemNotification } from "@/lib/telegram"

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

    console.log("Fetching knowledge items with params:", { page, limit, search, categoryId, type })

    const { items, total } = await getAllKnowledgeItems(page, limit, search, categoryId, type)

    console.log(`Found ${items.length} knowledge items out of ${total} total`)

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
    return NextResponse.json(
      {
        error: "Failed to fetch knowledge items",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Проверка авторизации
    const telegramId = request.headers.get("x-telegram-id") || localStorage?.getItem("telegram_id")
    if (!telegramId) {
      return NextResponse.json({ error: "Unauthorized: Telegram ID required" }, { status: 401 })
    }

    const user = await getUserByTelegramId(telegramId)
    if (!user || user.is_blocked) {
      return NextResponse.json({ error: "Unauthorized or account blocked" }, { status: 401 })
    }

    console.log("Creating knowledge item for user:", user.id)

    // Валидация данных
    const { title, description, type, category_id } = body
    if (!title || !description || !type || !category_id) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, type, category_id" },
        { status: 400 },
      )
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

    console.log("Knowledge item created successfully:", item.id)

    // Получение записи с деталями для уведомления
    const itemWithDetails = await getKnowledgeItemById(item.id)
    if (itemWithDetails) {
      // Отправка уведомления в Telegram
      try {
        await sendNewKnowledgeItemNotification(itemWithDetails)
      } catch (error) {
        console.error("Error sending Telegram notification:", error)
        // Не прерываем выполнение, если не удалось отправить уведомление
      }
    }

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("Error creating knowledge item:", error)
    return NextResponse.json(
      {
        error: "Failed to create knowledge item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

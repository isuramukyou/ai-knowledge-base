import { type NextRequest, NextResponse } from "next/server"
import { getAllAIModels, createAIModel, getAIModelById } from "@/lib/models/ai-model"
import { getUserByTelegramId } from "@/lib/models/user"
import { sendNewAIModelNotification } from "@/lib/telegram"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || undefined
    const categoryId = searchParams.get("category")
      ? Number.parseInt(searchParams.get("category") as string)
      : undefined

    console.log("Fetching AI models with params:", { page, limit, search, categoryId })

    const { models, total } = await getAllAIModels(page, limit, search, categoryId)

    console.log(`Found ${models.length} models out of ${total} total`)

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
    return NextResponse.json(
      {
        error: "Failed to fetch AI models",
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
    const telegramIdFromHeader = request.headers.get("x-telegram-id")
    const telegramIdFromCookie = request.cookies.get("telegram_id")?.value
    const telegramId = telegramIdFromHeader || telegramIdFromCookie
    
    console.log("Auth check:", {
      header: telegramIdFromHeader,
      cookie: telegramIdFromCookie,
      final: telegramId,
      hasHeader: !!telegramIdFromHeader,
      hasCookie: !!telegramIdFromCookie
    })
    
    if (!telegramId) {
      console.log("No telegram_id found in headers or cookies")
      return NextResponse.json({ error: "Unauthorized: Telegram ID required" }, { status: 401 })
    }

    const user = await getUserByTelegramId(telegramId)
    if (!user || user.is_blocked) {
      return NextResponse.json({ error: "Unauthorized or account blocked" }, { status: 401 })
    }

    console.log("Creating AI model for user:", user.id)

    // Валидация данных
    const { name, description, category_id } = body
    if (!name || !description || !category_id) {
      return NextResponse.json({ error: "Missing required fields: name, description, category_id" }, { status: 400 })
    }

    // Создание модели
    const model = await createAIModel({
      ...body,
      author_id: user.id,
    })

    console.log("AI model created successfully:", model.id)

    // Отправка уведомления в Telegram только если publish_to_chat = true
    if (body.publish_to_chat !== false) {
      const modelWithDetails = await getAIModelById(model.id)
      if (modelWithDetails) {
        try {
          await sendNewAIModelNotification(modelWithDetails)
        } catch (error) {
          console.error("Error sending Telegram notification:", error)
          // Не прерываем выполнение, если не удалось отправить уведомление
        }
      }
    }

    return NextResponse.json(model, { status: 201 })
  } catch (error) {
    console.error("Error creating AI model:", error)
    return NextResponse.json(
      {
        error: "Failed to create AI model",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

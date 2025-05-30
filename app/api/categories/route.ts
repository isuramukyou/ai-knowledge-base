import { type NextRequest, NextResponse } from "next/server"
import { getAllCategories, createCategory } from "@/lib/models/category"
import { getUserByTelegramId } from "@/lib/models/user"

export async function GET() {
  try {
    const categories = await getAllCategories()
    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
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
    if (!user || !user.is_admin) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 })
    }

    // Валидация данных
    const { name, color } = body
    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    // Создание категории
    const category = await createCategory(name, color)

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}

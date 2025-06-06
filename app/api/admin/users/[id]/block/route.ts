import { type NextRequest, NextResponse } from "next/server"
import { blockUser } from "@/lib/models/user"
import { requireAdmin } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const { isBlocked } = await request.json()

    // Проверяем админские права
    const { user, error } = await requireAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: error || "Admin access required" }, { status: 403 })
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

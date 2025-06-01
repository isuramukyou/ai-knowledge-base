import { type NextRequest, NextResponse } from "next/server"
import { getKnowledgeItemById, updateKnowledgeItem, deleteKnowledgeItem } from "@/lib/models/knowledge-item"
import { getUserByTelegramId } from "@/lib/models/user"
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"

const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  endpoint: `https://${process.env.S3_ENDPOINT}`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
})

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

    // Ensure category_id is null if it's an empty string
    if (body.category_id === "") {
      body.category_id = null;
    }

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

    // Fetch the item to get the cover_url
    const itemToDelete = await getKnowledgeItemById(id)
    if (!itemToDelete) {
      return NextResponse.json({ error: "Knowledge item not found" }, { status: 404 })
    }

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
      // Delete image from S3 if cover_url exists
      if (itemToDelete.cover_url) {
        try {
          const s3Key = itemToDelete.cover_url.replace(`https://${process.env.S3_PUBLIC_ENDPOINT}/`, '')
          const deleteParams = {
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: s3Key,
          }
          await s3Client.send(new DeleteObjectCommand(deleteParams))
          console.log(`Deleted S3 object: ${s3Key}`)
        } catch (s3Error) {
          console.error('Error deleting S3 object from S3:', s3Error)
          // Continue with database deletion even if S3 deletion fails
        }
      }

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

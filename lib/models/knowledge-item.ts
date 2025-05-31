import { query } from "../db"

export interface KnowledgeItem {
  id: number
  title: string
  description: string
  content: string | null
  type: "article" | "link" | "video"
  url: string | null
  cover_url: string | null
  category_id: number
  author_id: number
  created_at: Date
  updated_at: Date
}

export interface KnowledgeItemWithDetails extends KnowledgeItem {
  category_name: string
  category_color: string
  author_first_name: string
  author_last_name: string | null
  author_username: string | null
  author_avatar_url: string | null
}

export async function getAllKnowledgeItems(
  page = 1,
  limit = 10,
  search?: string,
  categoryId?: number,
  type?: string,
): Promise<{ items: KnowledgeItemWithDetails[]; total: number }> {
  const offset = (page - 1) * limit
  let whereClause = ""
  const params: any[] = [limit, offset]

  if (search || categoryId || type) {
    whereClause = "WHERE "
    const conditions = []

    if (search) {
      conditions.push(`(k.title ILIKE $${params.length + 1} OR k.description ILIKE $${params.length + 1})`)
      params.push(`%${search}%`)
    }

    if (categoryId) {
      conditions.push(`k.category_id = $${params.length + 1}`)
      params.push(categoryId)
    }

    if (type) {
      conditions.push(`k.type = $${params.length + 1}`)
      params.push(type)
    }

    whereClause += conditions.join(" AND ")
  }

  try {
    let countParams: any[] = []
    if (whereClause) {
      countParams = params.slice(2)
    }
    const countResult = await query(`SELECT COUNT(*) FROM knowledge_items k ${whereClause}`, countParams)
    const total = Number.parseInt(countResult.rows[0].count)

    const result = await query(
      `SELECT k.*, 
              c.name as category_name, 
              c.color as category_color,
              u.first_name as author_first_name,
              u.last_name as author_last_name,
              u.username as author_username,
              u.avatar_url as author_avatar_url
       FROM knowledge_items k
       JOIN categories c ON k.category_id = c.id
       JOIN users u ON k.author_id = u.id
       ${whereClause}
       ORDER BY k.created_at DESC
       LIMIT $1 OFFSET $2`,
      params,
    )

    return { items: result.rows, total }
  } catch (error) {
    console.error("Error in getAllKnowledgeItems:", error)
    throw error
  }
}

export async function getKnowledgeItemById(id: number): Promise<KnowledgeItemWithDetails | null> {
  try {
    const result = await query(
      `SELECT k.*, 
              c.name as category_name, 
              c.color as category_color,
              u.first_name as author_first_name,
              u.last_name as author_last_name,
              u.username as author_username,
              u.avatar_url as author_avatar_url
       FROM knowledge_items k
       JOIN categories c ON k.category_id = c.id
       JOIN users u ON k.author_id = u.id
       WHERE k.id = $1`,
      [id],
    )

    return result.rows[0] || null
  } catch (error) {
    console.error("Error in getKnowledgeItemById:", error)
    throw error
  }
}

export async function createKnowledgeItem(
  item: Omit<KnowledgeItem, "id" | "created_at" | "updated_at">,
): Promise<KnowledgeItem> {
  const { title, description, content, type, url, cover_url, category_id, author_id } = item

  try {
    const result = await query(
      `INSERT INTO knowledge_items (
        title, description, content, type, url, cover_url, category_id, author_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description, content, type, url, cover_url, category_id, author_id],
    )

    return result.rows[0]
  } catch (error) {
    console.error("Error in createKnowledgeItem:", error)
    throw error
  }
}

export async function updateKnowledgeItem(
  id: number,
  updates: Partial<KnowledgeItem>,
  userId: number,
): Promise<KnowledgeItem | null> {
  try {
    // Проверяем, является ли пользователь автором или админом
    const authCheck = await query(
      `SELECT 1 FROM knowledge_items k
       JOIN users u ON u.id = $2
       WHERE k.id = $1 AND (k.author_id = $2 OR u.is_admin = true)`,
      [id, userId],
    )

    if (authCheck.rowCount === 0) {
      throw new Error("Unauthorized: You can only edit your own items unless you are an admin")
    }

    const fields = Object.keys(updates).filter((key) => !["id", "created_at", "updated_at", "author_id"].includes(key))

    if (fields.length === 0) return null

    const setClause = fields.map((field, i) => `${field} = $${i + 3}`).join(", ")
    const values = fields.map((field) => updates[field as keyof KnowledgeItem])

    const result = await query(`UPDATE knowledge_items SET ${setClause} WHERE id = $1 RETURNING *`, [
      id,
      userId,
      ...values,
    ])

    return result.rows[0] || null
  } catch (error) {
    console.error("Error in updateKnowledgeItem:", error)
    throw error
  }
}

export async function deleteKnowledgeItem(id: number, userId: number): Promise<boolean> {
  try {
    // Проверяем, является ли пользователь автором или админом
    const authCheck = await query(
      `SELECT 1 FROM knowledge_items k
       JOIN users u ON u.id = $2
       WHERE k.id = $1 AND (k.author_id = $2 OR u.is_admin = true)`,
      [id, userId],
    )

    if (authCheck.rowCount === 0) {
      throw new Error("Unauthorized: You can only delete your own items unless you are an admin")
    }

    const result = await query("DELETE FROM knowledge_items WHERE id = $1 RETURNING id", [id])
    return result.rowCount > 0
  } catch (error) {
    console.error("Error in deleteKnowledgeItem:", error)
    throw error
  }
}

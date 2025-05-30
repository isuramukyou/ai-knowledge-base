import { query } from "../db"

export interface AIModel {
  id: number
  name: string
  description: string
  full_description: string | null
  cover_url: string | null
  website_url: string | null
  pricing: string | null
  category_id: number
  author_id: number
  created_at: Date
  updated_at: Date
}

export interface AIModelWithDetails extends AIModel {
  category_name: string
  category_color: string
  author_first_name: string
  author_last_name: string | null
  author_username: string | null
  author_avatar_url: string | null
}

export async function getAllAIModels(
  page = 1,
  limit = 10,
  search?: string,
  categoryId?: number,
): Promise<{ models: AIModelWithDetails[]; total: number }> {
  const offset = (page - 1) * limit
  let whereClause = ""
  const params: any[] = [limit, offset]

  if (search || categoryId) {
    whereClause = "WHERE "
    const conditions = []

    if (search) {
      conditions.push(`(m.name ILIKE $${params.length + 1} OR m.description ILIKE $${params.length + 1})`)
      params.push(`%${search}%`)
    }

    if (categoryId) {
      conditions.push(`m.category_id = $${params.length + 1}`)
      params.push(categoryId)
    }

    whereClause += conditions.join(" AND ")
  }

  try {
    const countResult = await query(`SELECT COUNT(*) FROM ai_models m ${whereClause}`, params.slice(2))
    const total = Number.parseInt(countResult.rows[0].count)

    const result = await query(
      `SELECT m.*, 
              c.name as category_name, 
              c.color as category_color,
              u.first_name as author_first_name,
              u.last_name as author_last_name,
              u.username as author_username,
              u.avatar_url as author_avatar_url
       FROM ai_models m
       JOIN categories c ON m.category_id = c.id
       JOIN users u ON m.author_id = u.id
       ${whereClause}
       ORDER BY m.created_at DESC
       LIMIT $1 OFFSET $2`,
      params,
    )

    return { models: result.rows, total }
  } catch (error) {
    console.error("Error in getAllAIModels:", error)
    throw error
  }
}

export async function getAIModelById(id: number): Promise<AIModelWithDetails | null> {
  try {
    const result = await query(
      `SELECT m.*, 
              c.name as category_name, 
              c.color as category_color,
              u.first_name as author_first_name,
              u.last_name as author_last_name,
              u.username as author_username,
              u.avatar_url as author_avatar_url
       FROM ai_models m
       JOIN categories c ON m.category_id = c.id
       JOIN users u ON m.author_id = u.id
       WHERE m.id = $1`,
      [id],
    )

    return result.rows[0] || null
  } catch (error) {
    console.error("Error in getAIModelById:", error)
    throw error
  }
}

export async function createAIModel(model: Omit<AIModel, "id" | "created_at" | "updated_at">): Promise<AIModel> {
  const { name, description, full_description, cover_url, website_url, pricing, category_id, author_id } = model

  try {
    const result = await query(
      `INSERT INTO ai_models (
        name, description, full_description, cover_url, website_url, 
        pricing, category_id, author_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, description, full_description, cover_url, website_url, pricing, category_id, author_id],
    )

    return result.rows[0]
  } catch (error) {
    console.error("Error in createAIModel:", error)
    throw error
  }
}

export async function updateAIModel(id: number, updates: Partial<AIModel>, userId: number): Promise<AIModel | null> {
  try {
    // Проверяем, является ли пользователь автором или админом
    const authCheck = await query(
      `SELECT 1 FROM ai_models m
       JOIN users u ON u.id = $2
       WHERE m.id = $1 AND (m.author_id = $2 OR u.is_admin = true)`,
      [id, userId],
    )

    if (authCheck.rowCount === 0) {
      throw new Error("Unauthorized: You can only edit your own models unless you are an admin")
    }

    const fields = Object.keys(updates).filter((key) => !["id", "created_at", "updated_at", "author_id"].includes(key))

    if (fields.length === 0) return null

    const setClause = fields.map((field, i) => `${field} = $${i + 3}`).join(", ")
    const values = fields.map((field) => updates[field as keyof AIModel])

    const result = await query(`UPDATE ai_models SET ${setClause} WHERE id = $1 RETURNING *`, [id, userId, ...values])

    return result.rows[0] || null
  } catch (error) {
    console.error("Error in updateAIModel:", error)
    throw error
  }
}

export async function deleteAIModel(id: number, userId: number): Promise<boolean> {
  try {
    // Проверяем, является ли пользователь автором или админом
    const authCheck = await query(
      `SELECT 1 FROM ai_models m
       JOIN users u ON u.id = $2
       WHERE m.id = $1 AND (m.author_id = $2 OR u.is_admin = true)`,
      [id, userId],
    )

    if (authCheck.rowCount === 0) {
      throw new Error("Unauthorized: You can only delete your own models unless you are an admin")
    }

    const result = await query("DELETE FROM ai_models WHERE id = $1 RETURNING id", [id])
    return result.rowCount > 0
  } catch (error) {
    console.error("Error in deleteAIModel:", error)
    throw error
  }
}

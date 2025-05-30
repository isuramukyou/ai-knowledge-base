import { query } from "../db"

export interface User {
  id: number
  telegram_id: string
  username: string | null
  first_name: string
  last_name: string | null
  avatar_url: string | null
  is_admin: boolean
  is_blocked: boolean
  created_at: Date
  updated_at: Date
}

export async function getUserByTelegramId(telegramId: string): Promise<User | null> {
  const result = await query("SELECT * FROM users WHERE telegram_id = $1", [telegramId])
  return result.rows[0] || null
}

export async function createUser(user: Partial<User>): Promise<User> {
  const { telegram_id, username, first_name, last_name, avatar_url, is_admin = false } = user

  const result = await query(
    `INSERT INTO users (telegram_id, username, first_name, last_name, avatar_url, is_admin) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING *`,
    [telegram_id, username, first_name, last_name, avatar_url, is_admin],
  )

  return result.rows[0]
}

export async function updateUser(id: number, updates: Partial<User>): Promise<User | null> {
  const fields = Object.keys(updates).filter((key) => key !== "id" && key !== "created_at")

  if (fields.length === 0) return null

  const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(", ")
  const values = fields.map((field) => updates[field as keyof User])

  const result = await query(`UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`, [id, ...values])

  return result.rows[0] || null
}

export async function getAllUsers(page = 1, limit = 10): Promise<{ users: User[]; total: number }> {
  const offset = (page - 1) * limit

  const countResult = await query("SELECT COUNT(*) FROM users")
  const total = Number.parseInt(countResult.rows[0].count)

  const result = await query("SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2", [limit, offset])

  return { users: result.rows, total }
}

export async function blockUser(id: number, isBlocked: boolean): Promise<User | null> {
  const result = await query("UPDATE users SET is_blocked = $2 WHERE id = $1 RETURNING *", [id, isBlocked])

  return result.rows[0] || null
}

import { query } from "../db"

export interface Category {
  id: number
  name: string
  color: string
  created_at: Date
}

export async function getAllCategories(): Promise<Category[]> {
  const result = await query("SELECT * FROM categories ORDER BY name ASC")
  return result.rows
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const result = await query("SELECT * FROM categories WHERE id = $1", [id])
  return result.rows[0] || null
}

export async function createCategory(name: string, color = "#3b82f6"): Promise<Category> {
  const result = await query("INSERT INTO categories (name, color) VALUES ($1, $2) RETURNING *", [name, color])
  return result.rows[0]
}

export async function updateCategory(id: number, name: string, color: string): Promise<Category | null> {
  const result = await query("UPDATE categories SET name = $2, color = $3 WHERE id = $1 RETURNING *", [id, name, color])
  return result.rows[0] || null
}

export async function deleteCategory(id: number): Promise<boolean> {
  // Проверяем, используется ли категория
  const aiModelsCount = await query("SELECT COUNT(*) FROM ai_models WHERE category_id = $1", [id])
  const knowledgeItemsCount = await query("SELECT COUNT(*) FROM knowledge_items WHERE category_id = $1", [id])

  if (Number.parseInt(aiModelsCount.rows[0].count) > 0 || Number.parseInt(knowledgeItemsCount.rows[0].count) > 0) {
    throw new Error("Cannot delete category that is in use")
  }

  const result = await query("DELETE FROM categories WHERE id = $1 RETURNING id", [id])
  return result.rowCount > 0
}

import { query } from "../db"

export interface Category {
  id: number
  name: string
  color: string
  created_at: Date
  posts_count?: number
}

export async function getAllCategories(): Promise<Category[]> {
  const result = await query(`
    SELECT c.*, 
           COALESCE(
             (SELECT COUNT(*) FROM ai_models WHERE category_id = c.id) +
             (SELECT COUNT(*) FROM knowledge_items WHERE category_id = c.id),
             0
           ) as posts_count
    FROM categories c
    ORDER BY c.name ASC
  `)
  return result.rows
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const result = await query(`
    SELECT c.*, 
           COALESCE(
             (SELECT COUNT(*) FROM ai_models WHERE category_id = c.id) +
             (SELECT COUNT(*) FROM knowledge_items WHERE category_id = c.id),
             0
           ) as posts_count
    FROM categories c
    WHERE c.id = $1
  `, [id])
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
  // Проверяем наличие связанных записей
  const checkResult = await query(`
    SELECT 
      (SELECT COUNT(*) FROM ai_models WHERE category_id = $1) +
      (SELECT COUNT(*) FROM knowledge_items WHERE category_id = $1) as total_count
  `, [id])
  
  const totalCount = Number(checkResult.rows[0].total_count)
  if (totalCount > 0) {
    throw new Error(`Cannot delete category: it has ${totalCount} associated posts`)
  }

  const result = await query("DELETE FROM categories WHERE id = $1", [id])
  return result.rowCount > 0
}

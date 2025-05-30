import { Pool } from "pg"

// Создаем пул соединений с базой данных
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Функция для выполнения SQL запросов
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log("Executed query", { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error("Error executing query", { text, error })
    throw error
  }
}

// Функция для проверки соединения с базой данных
export async function testConnection() {
  try {
    const res = await query("SELECT NOW()")
    return res.rows[0]
  } catch (error) {
    console.error("Database connection error:", error)
    throw error
  }
}

// Закрытие пула соединений при завершении работы приложения
process.on("SIGINT", async () => {
  await pool.end()
  process.exit(0)
})

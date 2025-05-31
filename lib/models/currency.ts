import { query } from "../db"

export interface Currency {
  id: number
  symbol: string
  name: string
  code: string
}

export async function getAllCurrencies(): Promise<Currency[]> {
  const result = await query("SELECT * FROM currencies ORDER BY id ASC")
  return result.rows
} 
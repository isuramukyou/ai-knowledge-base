import { NextResponse } from "next/server"
import { CURRENCIES } from "@/lib/constants/currencies"

export async function GET() {
  try {
    return NextResponse.json(CURRENCIES)
  } catch (error) {
    console.error("Error fetching currencies:", error)
    return NextResponse.json({ error: "Failed to fetch currencies" }, { status: 500 })
  }
} 
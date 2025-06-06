import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const telegramIdFromHeader = request.headers.get("x-telegram-id")
  const telegramIdFromCookie = request.cookies.get("telegram_id")?.value
  const authToken = request.cookies.get("auth_token")?.value
  
  return NextResponse.json({
    auth_sources: {
      header: telegramIdFromHeader,
      cookie: telegramIdFromCookie,
      auth_token: authToken ? "present" : "missing"
    },
    headers: Object.fromEntries(request.headers.entries()),
    cookies: request.cookies.getAll(),
    url: request.url,
    environment: process.env.NODE_ENV
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const telegramIdFromHeader = request.headers.get("x-telegram-id")
  const telegramIdFromCookie = request.cookies.get("telegram_id")?.value
  
  return NextResponse.json({
    received_body: body,
    auth_sources: {
      header: telegramIdFromHeader,
      cookie: telegramIdFromCookie
    },
    can_create: !!(telegramIdFromHeader || telegramIdFromCookie)
  })
} 
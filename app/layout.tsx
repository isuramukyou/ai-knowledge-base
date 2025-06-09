"use client"

import "./globals.css"
import { Inter } from "next/font/google"
import TelegramWebAppScript from "@/components/telegram-webapp-script"
import { ThemeProvider } from "@/components/theme-provider"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { getTelegramUser, getTelegramInitData, getTelegramColorScheme } from "@/lib/telegram-webapp"

const inter = Inter({ subsets: ["latin"] })

// Типы для контекста авторизации
interface User {
  id?: number
  telegram_id: string
  first_name: string
  last_name: string | null
  username: string | null
  avatar_url: string | null
  is_admin?: boolean
  is_blocked?: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  authenticateUser: (telegramUser: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hook для использования контекста авторизации
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Провайдер авторизации
function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Функция для авторизации пользователя на сервере
  const authenticateUser = async (telegramUser: any) => {
    try {
      const initData = getTelegramInitData()

      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          initData,
          user: telegramUser,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        
        // Store auth data in localStorage
        localStorage.setItem("telegram_id", telegramUser.id.toString())
        localStorage.setItem("auth_token", data.token)
        localStorage.setItem("telegram_init_data", initData || "")
        
        // Update user state with data from server response
        if (data.user) {
          setUser(data.user)
        }
        
        console.log("Auth successful, data stored:", {
          telegram_id: telegramUser.id.toString(),
          has_token: !!data.token,
          has_initData: !!initData
        })
      } else {
        console.error("Authentication failed:", await response.text())
      }
    } catch (error) {
      console.error("Ошибка авторизации:", error)
    }
  }

  // Инициализация при загрузке приложения
  useEffect(() => {
    const initializeTelegram = async () => {
      setIsLoading(true)
      
      try {
        // Проверяем существующие данные авторизации
        const existingTelegramId = localStorage.getItem("telegram_id")
        const existingToken = localStorage.getItem("auth_token")
        
        if (existingTelegramId && existingToken) {
          console.log("Found existing auth data")
          
          // Пытаемся получить данные от Telegram
          const telegramUser = getTelegramUser()
          
          if (telegramUser) {
            // Если есть свежие данные от Telegram и они совпадают - используем их
            if (telegramUser.id.toString() === existingTelegramId) {
              setUser({
                telegram_id: telegramUser.id.toString(),
                first_name: telegramUser.first_name,
                last_name: telegramUser.last_name || null,
                username: telegramUser.username || null,
                avatar_url: telegramUser.photo_url || null,
              })
              // Обновляем данные на сервере
              await authenticateUser(telegramUser)
            } else {
              // Данные не совпадают - повторная авторизация
              await authenticateUser(telegramUser)
            }
          } else {
            // Telegram данных нет, но локальные есть - восстанавливаем базовую инфу
            setUser({
              telegram_id: existingTelegramId,
              first_name: "User",
              last_name: null,
              username: null,
              avatar_url: null,
            })
          }
        } else {
          // Нет сохраненных данных - пытаемся авторизоваться
          const telegramUser = getTelegramUser()
          if (telegramUser) {
            console.log("New user authentication")
            setUser({
              telegram_id: telegramUser.id.toString(),
              first_name: telegramUser.first_name,
              last_name: telegramUser.last_name || null,
              username: telegramUser.username || null,
              avatar_url: telegramUser.photo_url || null,
            })
            await authenticateUser(telegramUser)
          } else {
            console.log("No Telegram user data available")
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Небольшая задержка для загрузки Telegram WebApp
    const timer = setTimeout(initializeTelegram, 100)
    return () => clearTimeout(timer)
  }, [])

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    authenticateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
        <TelegramWebAppScript />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

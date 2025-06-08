"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Moon, Sun, ExternalLink, Edit, Trash2 } from "lucide-react"
import { useTheme } from "next-themes"
import SearchFilter from "@/components/search-filter"
import Pagination from "@/components/pagination"
import { getTelegramUser, getTelegramColorScheme, isTelegramWebApp, getTelegramInitData } from "@/lib/telegram-webapp"
import type { AIModelWithDetails } from "@/lib/models/ai-model"
import type { KnowledgeItemWithDetails } from "@/lib/models/knowledge-item"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Author {
  first_name: string
  last_name: string | null
  username: string | null
  avatar_url: string | null
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function HomePage() {
  const { theme, setTheme } = useTheme()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [selectedModel, setSelectedModel] = useState<AIModelWithDetails | null>(null)
  const [selectedKnowledge, setSelectedKnowledge] = useState<KnowledgeItemWithDetails | null>(null)
  const [user, setUser] = useState<any | null>(null)

  const [aiModels, setAiModels] = useState<AIModelWithDetails[]>([])
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItemWithDetails[]>([])
  const [modelsPagination, setModelsPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [knowledgePagination, setKnowledgePagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [activeTab, setActiveTab] = useState("models")
  const [isLoading, setIsLoading] = useState(false)
  const [isWebApp, setIsWebApp] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [pendingDeleteModel, setPendingDeleteModel] = useState(false)
  const [pendingDeleteKnowledge, setPendingDeleteKnowledge] = useState(false)

  // Получаем параметры из URL
  const page = Number.parseInt(searchParams.get("page") || "1")
  const search = searchParams.get("search") || undefined
  const category = searchParams.get("category") || undefined
  const type = searchParams.get("type") || undefined

  // Инициализация Telegram WebApp и получение данных пользователя
  useEffect(() => {
        const initializeTelegram = async () => {
      console.log("Initializing Telegram WebApp...")
      
      // Проверяем, находимся ли мы в Telegram WebApp
      const isInTelegramWebApp = isTelegramWebApp()
      setIsWebApp(isInTelegramWebApp)
      console.log("Is in Telegram WebApp:", isInTelegramWebApp)

      if (isInTelegramWebApp) {
        // Сообщаем Telegram, что WebApp готов
        if (window.Telegram?.WebApp?.ready) {
          window.Telegram.WebApp.ready()
          console.log("Telegram WebApp ready() called")
        }
        
        // Даем время Telegram WebApp для полной инициализации
        let attempts = 0
        const maxAttempts = 10
        
        const tryGetUser = () => {
          attempts++
          console.log(`Attempt ${attempts} to get Telegram user...`)
          
          const telegramUser = getTelegramUser()
          
          if (telegramUser) {
            console.log("Telegram user found:", telegramUser)
            
            // Преобразуем данные пользователя Telegram в формат нашего приложения
            setUser({
              telegram_id: telegramUser.id.toString(),
              first_name: telegramUser.first_name,
              last_name: telegramUser.last_name || null,
              username: telegramUser.username || null,
              avatar_url: telegramUser.photo_url || null,
            })

            // Отправляем данные на сервер для авторизации
            authenticateUser(telegramUser)
            return true
          } else if (attempts < maxAttempts) {
            console.log("No user data yet, retrying in 500ms...")
            setTimeout(tryGetUser, 500)
            return false
          } else {
            console.error("Failed to get Telegram user data after", maxAttempts, "attempts")
            return false
          }
        }

        // Начинаем попытки получения данных пользователя
        tryGetUser()

        // Устанавливаем тему в соответствии с темой Telegram
        const colorScheme = getTelegramColorScheme()
        if (colorScheme) {
          setTheme(colorScheme)
        }
      } else {
        console.log("Not in Telegram WebApp, checking localStorage for existing auth...")
        // Если не в Telegram WebApp, попробуем восстановить данные из localStorage
        const existingTelegramId = localStorage.getItem("telegram_id")
        const existingToken = localStorage.getItem("auth_token")
        
        if (existingTelegramId && existingToken) {
          console.log("Found existing auth in localStorage:", existingTelegramId)
          // В режиме разработки или если есть валидные данные - создаем пользователя
          const isDev = process.env.NODE_ENV === "development"
          if (isDev) {
            // В режиме разработки получаем пользователя из мока
            const mockUser = getTelegramUser()
            if (mockUser) {
              setUser({
                telegram_id: mockUser.id.toString(),
                first_name: mockUser.first_name,
                last_name: mockUser.last_name || null,
                username: mockUser.username || null,
                avatar_url: mockUser.photo_url || null,
              })
              // Аутентифицируем мок-пользователя
              authenticateUser(mockUser)
            }
          } else {
            // В продакшене восстанавливаем базовые данные
            setUser({
              telegram_id: existingTelegramId,
              first_name: "User",
              last_name: null,
              username: null,
              avatar_url: null,
            })
          }
        } else {
          console.log("No existing auth found")
          // В режиме разработки все равно попробуем инициализировать мок-пользователя
          const isDev = process.env.NODE_ENV === "development"
          if (isDev) {
            const mockUser = getTelegramUser()
            if (mockUser) {
              setUser({
                telegram_id: mockUser.id.toString(),
                first_name: mockUser.first_name,
                last_name: mockUser.last_name || null,
                username: mockUser.username || null,
                avatar_url: mockUser.photo_url || null,
              })
              authenticateUser(mockUser)
            }
          }
        }
      }
    }

    initializeTelegram()
  }, [setTheme])

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
        // Update user state with server response
        setUser(data.user)
        // Store token for subsequent requests (cookies are set on server-side)
        localStorage.setItem("telegram_id", telegramUser.id.toString())
        localStorage.setItem("auth_token", data.token)
        
        // Для дополнительной безопасности храним данные авторизации в localStorage как fallback
        localStorage.setItem("telegram_init_data", initData || "")
        
        console.log("Auth data stored in localStorage:", {
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

  // Загрузка данных при изменении параметров
  useEffect(() => {
    if (activeTab === "models") {
      fetchAIModels(page, search, category)
    } else {
      fetchKnowledgeItems(page, search, category, type)
    }
  }, [activeTab, page, search, category, type])

  // Загрузка моделей нейросетей
  const fetchAIModels = async (page = 1, search?: string, category?: string) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", "9") // Показываем по 9 карточек на странице
      if (search) params.set("search", search)
      if (category) params.set("category", category)

      const response = await fetch(`/api/models?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setAiModels(data.models)
        setModelsPagination(data.pagination)
      }
    } catch (error) {
      console.error("Error fetching AI models:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Загрузка статей базы знаний
  const fetchKnowledgeItems = async (page = 1, search?: string, category?: string, type?: string) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", "9") // Показываем по 9 карточек на странице
      if (search) params.set("search", search)
      if (category) params.set("category", category)
      if (type) params.set("type", type)

      const response = await fetch(`/api/knowledge?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setKnowledgeItems(data.items)
        setKnowledgePagination(data.pagination)
      }
    } catch (error) {
      console.error("Error fetching knowledge items:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Обработчик смены вкладки
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const AuthorBadge = ({ author }: { author: Author }) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Avatar className="w-4 h-4">
        <AvatarImage src={author.avatar_url || `https://t.me/i/userpic/320/${author.username}.jpg`} />
        <AvatarFallback className="text-[8px]">
          {author.first_name?.[0]}
          {author.last_name?.[0]}
        </AvatarFallback>
      </Avatar>
      <span>
        {author.first_name} {author.last_name}
      </span>
    </div>
  )

  const ModelCard = ({ model }: { model: AIModelWithDetails }) => (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-card/50 backdrop-blur-sm border-border/50"
      onClick={() => setSelectedModel(model)}
    >
      <CardContent className="p-0">
        {model.cover_url && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img
              src={model.cover_url || "/placeholder.svg?height=200&width=300"}
              alt={model.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg leading-tight">{model.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">{model.description}</p>
          <div className="flex items-center justify-between">
            <Badge
              variant="secondary"
              className="text-xs"
              style={{ backgroundColor: model.category_color + "20", color: model.category_color }}
            >
              {model.category_name}
            </Badge>
            <AuthorBadge
              author={{
                first_name: model.author_first_name,
                last_name: model.author_last_name,
                username: model.author_username,
                avatar_url: model.author_avatar_url,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const KnowledgeCard = ({ item }: { item: KnowledgeItemWithDetails }) => (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-card/50 backdrop-blur-sm border-border/50"
      onClick={() => {
        setSelectedKnowledge(item);
      }}
    >
      <CardContent className="p-0">
        {item.cover_url && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img
              src={item.cover_url || "/placeholder.svg?height=200&width=300"}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg leading-tight flex-1">{item.title}</h3>
              <span className="text-lg">{item.type === "article" ? "📄" : item.type === "video" ? "🎥" : "🔗"}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
          <div className="flex items-center justify-between">
            <Badge
              variant="secondary"
              className="text-xs"
              style={{ backgroundColor: item.category_color + "20", color: item.category_color }}
            >
              {item.category_name}
            </Badge>
            <AuthorBadge
              author={{
                first_name: item.author_first_name,
                last_name: item.author_last_name,
                username: item.author_username,
                avatar_url: item.author_avatar_url,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Вспомогательная функция для красивого отображения цены
  function renderPricing(pricing: string | null) {
    if (!pricing) return null
    // Пример: 1000|₽|месяц
    const [amount, currency, period] = pricing.split("|")
    if (!amount || !currency || !period) return pricing
    return `от ${amount} ${currency}/${period}`
  }

  // Вспомогательная функция для перехода на сайт
  function openWebsite(url: string) {
    let finalUrl = url
    if (!/^https?:\/\//i.test(url)) {
      finalUrl = "https://" + url
    }
    window.open(finalUrl, "_blank")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💢</span>
            <h1 className="text-xl font-semibold">База нейросетей</h1>
            {user?.is_admin && (
              <Badge 
                variant="secondary" 
                className="text-xs ml-2 cursor-pointer hover:bg-secondary/80"
                onClick={() => setShowAdminPanel(true)}
              >
                Admin
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Показываем переключатель темы только если не в Telegram WebApp */}
            {!isWebApp && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            )}

            {/* Показываем аватар пользователя, если он авторизован */}
            {user && (
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>
                    {user.first_name?.[0]}
                    {user.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="models" className="w-full" onValueChange={handleTabChange}>
          <div className="flex items-center justify-between mb-8">
            <TabsList className="grid w-fit grid-cols-2 rounded-full">
              <TabsTrigger value="models" className="rounded-full">
                🤖 Нейросети
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="rounded-full">
                📚 База знаний
              </TabsTrigger>
            </TabsList>
          </div>

          <SearchFilter
            placeholder={activeTab === "models" ? "Поиск нейросетей..." : "Поиск в базе знаний..."}
            showTypeFilter={activeTab === "knowledge"}
          />

          <TabsContent value="models" className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : aiModels.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {aiModels.map((model) => (
                    <ModelCard key={model.id} model={model} />
                  ))}
                </div>
                <Pagination currentPage={modelsPagination.page} totalPages={modelsPagination.totalPages} />
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Нейросети не найдены</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : knowledgeItems.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {knowledgeItems.map((item) => (
                    <KnowledgeCard key={item.id} item={item} />
                  ))}
                </div>
                <Pagination currentPage={knowledgePagination.page} totalPages={knowledgePagination.totalPages} />
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Записи не найдены</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Floating Add Button */}
        {user && (
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              size="icon"
              className="w-14 h-14 rounded-full shadow-lg bg-primary/80 backdrop-blur-md border border-white/20 hover:bg-primary/90 transition-all duration-200"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        )}

        {/* Admin Panel Access - Long press on logo */}
        {user?.is_admin && showAdminPanel && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center space-y-4">
                <h3 className="text-lg font-semibold">Админ панель</h3>
                <p className="text-sm text-muted-foreground">Вы хотите перейти в админ панель?</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowAdminPanel(false)}>
                    Отмена
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      window.location.href = "/admin"
                    }}
                  >
                    Перейти
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Model Detail Modal */}
      <Dialog open={!!selectedModel} onOpenChange={() => setSelectedModel(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl" showClose={false}>
          {selectedModel && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedModel.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedModel.cover_url && (
                  <img
                    src={selectedModel.cover_url || "/placeholder.svg"}
                    alt={selectedModel.name}
                    className="w-full aspect-video object-cover rounded-xl"
                  />
                )}
                {/* Автор и Категория */}
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant="secondary"
                    style={{
                      backgroundColor: selectedModel.category_color + "20",
                      color: selectedModel.category_color,
                    }}
                    className="rounded-lg"
                  >
                    {selectedModel.category_name}
                  </Badge>
                  <AuthorBadge
                    author={{
                      first_name: selectedModel.author_first_name,
                      last_name: selectedModel.author_last_name,
                      username: selectedModel.author_username,
                      avatar_url: selectedModel.author_avatar_url,
                    }}
                  />
                </div>
                {/* Цена */}
                {selectedModel.pricing && (
                  <div className="flex justify-start mb-2">
                    <span className="text-sm font-medium text-primary">
                      {renderPricing(selectedModel.pricing)}
                    </span>
                  </div>
                )}
                {/* Описание */}
                <p className="text-muted-foreground mt-2 whitespace-pre-line">
                  {selectedModel.full_description || selectedModel.description}
                </p>
                {/* Кнопка сайта */}
                {selectedModel.website_url && (
                  <Button
                    size="lg"
                    variant="secondary"
                    className="mt-4 w-full flex items-center justify-center gap-2 text-base font-semibold"
                    onClick={() => openWebsite(selectedModel.website_url || "")}
                  >
                    <ExternalLink className="w-5 h-5" /> Перейти на сайт
                  </Button>
                )}
                {/* Кнопки редактирования/удаления */}
                {(user && (user.is_admin || user.telegram_id == selectedModel.author_username || user.telegram_id == selectedModel.author_id)) && (
                  <div className="flex gap-2 mt-4">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/models/${selectedModel.id}/edit`)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setPendingDeleteModel(true)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
          {/* Модалка подтверждения удаления модели */}
          {pendingDeleteModel && (
            <Dialog open={pendingDeleteModel} onOpenChange={setPendingDeleteModel}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Удалить нейросеть?</DialogTitle>
                </DialogHeader>
                <p>Вы уверены, что хотите удалить эту нейросеть? Это действие необратимо.</p>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={() => setPendingDeleteModel(false)}>Отмена</Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (!selectedModel) return;
                      const telegramId = typeof window !== "undefined" ? localStorage.getItem("telegram_id") : null;
                      const res = await fetch(`/api/models/${selectedModel.id}`, {
                        method: "DELETE",
                        headers: telegramId ? { "x-telegram-id": telegramId } : {},
                      });
                      setPendingDeleteModel(false);
                      setSelectedModel(null);
                      if (res.ok) {
                        fetchAIModels();
                      }
                    }}
                  >
                    Удалить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </DialogContent>
      </Dialog>

      {/* Knowledge Item Detail Modal */}
      <Dialog open={selectedKnowledge !== null} onOpenChange={(open) => !open && setSelectedKnowledge(null)}>
        <DialogContent className="sm:max-w-[425px] md:max-w-[600px] lg:max-w-[800px] rounded-2xl" showClose={false}>
          {selectedKnowledge && (
            <div className="space-y-4">
              {selectedKnowledge.cover_url && (
                <div className="aspect-video w-full overflow-hidden rounded-lg">
                  <img
                    src={selectedKnowledge.cover_url || "/placeholder.svg"}
                    alt={selectedKnowledge.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <DialogHeader>
                <DialogTitle>{selectedKnowledge.title}</DialogTitle>
              </DialogHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {selectedKnowledge.category_name && (
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: selectedKnowledge.category_color + "20",
                        color: selectedKnowledge.category_color,
                      }}
                      className="rounded-lg"
                    >
                      {selectedKnowledge.category_name}
                    </Badge>
                  )}
                  <span className="text-lg">
                    {selectedKnowledge.type === "article" ? "📄" : selectedKnowledge.type === "video" ? "🎥" : "🔗"}
                  </span>
                </div>
                {selectedKnowledge.author_first_name && (
                  <AuthorBadge
                    author={{
                      first_name: selectedKnowledge.author_first_name,
                      last_name: selectedKnowledge.author_last_name,
                      username: selectedKnowledge.author_username,
                      avatar_url: selectedKnowledge.author_avatar_url,
                    }}
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{selectedKnowledge.description}</p>
              {/* Content or Link Button */}
              {selectedKnowledge.type === "link" || selectedKnowledge.type === "video" ? (
                selectedKnowledge.url && (
                  <Button
                    variant="secondary"
                    className="mt-4 w-full flex items-center justify-center gap-2 text-base font-semibold"
                    onClick={() => openWebsite(selectedKnowledge.url!)}
                  >
                    {selectedKnowledge.type === "link" ? "Открыть ссылку" : "Смотреть видео"}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                )
              ) : selectedKnowledge.type === "article" ? (
                /* Temporarily commented out: Article content display is disabled */
                /*
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedKnowledge.content || ""}</ReactMarkdown>
                </div>
                */
                <div className="text-center text-muted-foreground">
                   Содержание статьи временно недоступно.
                </div>
              ) : null}
              {/* Edit and Delete Buttons (Optional, based on permissions) */}
              {(user && (user.is_admin || user.telegram_id === selectedKnowledge.author_username || user.telegram_id === selectedKnowledge.author_id)) && (
                <div className="flex gap-2 mt-4">
                   <Button variant="ghost" size="sm" onClick={() => router.push(`/knowledge/${selectedKnowledge.id}/edit`)}>
                     <Edit className="w-4 h-4" />
                   </Button>
                   <Button variant="ghost" size="sm" onClick={() => setPendingDeleteKnowledge(true)}>
                     <Trash2 className="w-4 h-4" />
                   </Button>
                </div>
              )}
            </div>
          )}
          {/* Модалка подтверждения удаления записи БД */}
          {pendingDeleteKnowledge && selectedKnowledge && (
            <Dialog open={pendingDeleteKnowledge} onOpenChange={setPendingDeleteKnowledge}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Удалить запись из базы знаний?</DialogTitle>
                </DialogHeader>
                <p>Вы уверены, что хотите удалить эту запись? Это действие необратимо.</p>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={() => setPendingDeleteKnowledge(false)}>Отмена</Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (!selectedKnowledge) return;
                      const telegramId = typeof window !== "undefined" ? localStorage.getItem("telegram_id") : null;
                      const res = await fetch(`/api/knowledge/${selectedKnowledge.id}`, {
                        method: "DELETE",
                        headers: telegramId ? { "x-telegram-id": telegramId } : {},
                      });
                      setPendingDeleteKnowledge(false);
                      setSelectedKnowledge(null);
                      if (res.ok) {
                        fetchKnowledgeItems(); // Refresh knowledge items list
                      }
                    }}
                  >
                    Удалить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Добавить запись</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              className="w-full justify-start rounded-xl"
              variant="outline"
              onClick={() => {
                setShowAddModal(false)
                router.push("/models/new")
              }}
            >
              🤖 Добавить нейросеть
            </Button>
            <Button
              className="w-full justify-start rounded-xl"
              variant="outline"
              onClick={() => {
                setShowAddModal(false)
                router.push("/knowledge/new")
              }}
            >
              📚 Добавить в базу знаний
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

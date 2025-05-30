"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Moon, Sun, User } from "lucide-react"
import { useTheme } from "next-themes"
import SearchFilter from "@/components/search-filter"
import Pagination from "@/components/pagination"
import type { AIModelWithDetails } from "@/lib/models/ai-model"
import type { KnowledgeItemWithDetails } from "@/lib/models/knowledge-item"

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

  // Получаем параметры из URL
  const page = Number.parseInt(searchParams.get("page") || "1")
  const search = searchParams.get("search") || undefined
  const category = searchParams.get("category") || undefined
  const type = searchParams.get("type") || undefined

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
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg leading-tight">{model.name}</h3>
            <Badge
              variant="secondary"
              className="text-xs"
              style={{ backgroundColor: model.category_color + "20", color: model.category_color }}
            >
              {model.category_name}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">{model.description}</p>
          <AuthorBadge
            author={{
              first_name: model.author_first_name,
              last_name: model.author_last_name,
              username: model.author_username,
              avatar_url: model.author_avatar_url,
            }}
          />
        </div>
      </CardContent>
    </Card>
  )

  const KnowledgeCard = ({ item }: { item: KnowledgeItemWithDetails }) => (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-card/50 backdrop-blur-sm border-border/50"
      onClick={() => {
        if (item.type === "link" || item.type === "video") {
          window.open(item.url || "", "_blank")
        } else {
          setSelectedKnowledge(item)
        }
      }}
    >
      <CardContent className="p-0">
        {item.cover_url && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img
              src={item.cover_url || "/placeholder.svg?height=200&width=300"}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg leading-tight flex-1">{item.title}</h3>
              <span className="text-lg">{item.type === "article" ? "📄" : item.type === "video" ? "🎥" : "🔗"}</span>
            </div>
            <Badge
              variant="secondary"
              className="text-xs"
              style={{ backgroundColor: item.category_color + "20", color: item.category_color }}
            >
              {item.category_name}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
          <AuthorBadge
            author={{
              first_name: item.author_first_name,
              last_name: item.author_last_name,
              username: item.author_username,
              avatar_url: item.author_avatar_url,
            }}
          />
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <h1 className="text-xl font-semibold">AI Knowledge Base</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {user ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="w-4 h-4" />
                </Button>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>
                    {user.first_name?.[0]}
                    {user.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <Button variant="default" className="rounded-full">
                <User className="w-4 h-4 mr-2" />
                Войти через Telegram
              </Button>
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

            {user && (
              <Button className="rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Добавить
              </Button>
            )}
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
      </main>

      {/* Model Detail Modal */}
      <Dialog open={!!selectedModel} onOpenChange={() => setSelectedModel(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedModel && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedModel.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {selectedModel.cover_url && (
                  <img
                    src={selectedModel.cover_url || "/placeholder.svg"}
                    alt={selectedModel.name}
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: selectedModel.category_color + "20",
                        color: selectedModel.category_color,
                      }}
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

                  <p className="text-muted-foreground">{selectedModel.full_description || selectedModel.description}</p>

                  {selectedModel.website_url && (
                    <div>
                      <h4 className="font-semibold mb-2">🌐 Веб-сайт</h4>
                      <a
                        href={selectedModel.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {selectedModel.website_url}
                      </a>
                    </div>
                  )}

                  {selectedModel.pricing && (
                    <div>
                      <h4 className="font-semibold mb-2">💰 Цены</h4>
                      <p>{selectedModel.pricing}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Knowledge Detail Modal */}
      <Dialog open={!!selectedKnowledge} onOpenChange={() => setSelectedKnowledge(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedKnowledge && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedKnowledge.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Badge
                    variant="secondary"
                    style={{
                      backgroundColor: selectedKnowledge.category_color + "20",
                      color: selectedKnowledge.category_color,
                    }}
                  >
                    {selectedKnowledge.category_name}
                  </Badge>
                  <AuthorBadge
                    author={{
                      first_name: selectedKnowledge.author_first_name,
                      last_name: selectedKnowledge.author_last_name,
                      username: selectedKnowledge.author_username,
                      avatar_url: selectedKnowledge.author_avatar_url,
                    }}
                  />
                </div>

                {selectedKnowledge.content && (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div dangerouslySetInnerHTML={{ __html: selectedKnowledge.content.replace(/\n/g, "<br>") }} />
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

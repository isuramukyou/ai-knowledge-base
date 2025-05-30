"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
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
  const [modelsPagination, setModelsPagination] = useState<PaginationData>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [knowledgePagination, setKnowledgePagination] = useState<PaginationData>({ page: 1, limit: 10, total: 0, totalPages: 0 })
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
      className="group cursor-pointer transition-all duration-200 hover:shadow-\

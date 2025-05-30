"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"
import type { Category } from "@/lib/models/category"

interface SearchFilterProps {
  placeholder?: string
  showTypeFilter?: boolean
  onSearch?: (params: { search?: string; category?: string; type?: string }) => void
}

export default function SearchFilter({
  placeholder = "Поиск...",
  showTypeFilter = false,
  onSearch,
}: SearchFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [category, setCategory] = useState(searchParams.get("category") || "all")
  const [type, setType] = useState(searchParams.get("type") || "all")
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Загрузка категорий
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories")
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }

    fetchCategories()
  }, [])

  const handleSearch = () => {
    setIsLoading(true)

    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (category !== "all") params.set("category", category)
    if (type !== "all" && showTypeFilter) params.set("type", type)

    // Сбрасываем страницу при новом поиске
    params.set("page", "1")

    if (onSearch) {
      onSearch({
        search: search || undefined,
        category: category !== "all" ? category : undefined,
        type: type !== "all" ? type : undefined,
      })
      setIsLoading(false)
    } else {
      // Обновляем URL с параметрами поиска
      router.push(`?${params.toString()}`)
    }
  }

  const handleReset = () => {
    setSearch("")
    setCategory("all")
    setType("all")

    if (onSearch) {
      onSearch({})
    } else {
      router.push("")
    }
  }

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
              onClick={() => setSearch("")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showTypeFilter && (
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Тип" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="article">Статьи</SelectItem>
              <SelectItem value="link">Ссылки</SelectItem>
              <SelectItem value="video">Видео</SelectItem>
            </SelectContent>
          </Select>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSearch} disabled={isLoading} className="w-full sm:w-auto">
            Поиск
          </Button>
          {(search || category !== "all" || type !== "all") && (
            <Button variant="outline" onClick={handleReset} disabled={isLoading} className="w-full sm:w-auto">
              Сбросить
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

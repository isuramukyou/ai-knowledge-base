"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"
import type { Category } from "@/lib/models/category"
import { useDebounce } from "@/hooks/use-debounce"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label"
import { CategorySelect } from "@/components/category-select"
import { TypeSelect } from "@/components/type-select"
import { cn } from "@/lib/utils"
import { Filter } from "lucide-react"

interface SearchFilterProps {
  placeholder?: string
  showTypeFilter?: boolean
  onSearch?: (params: { search?: string; category?: string; type?: string }) => void
  onCategoryChange?: (categoryId: number | null) => void
  onTypeChange?: (type: string | null) => void
  onReset?: () => void
}

export default function SearchFilter({
  placeholder = "Поиск...",
  showTypeFilter = false,
  onSearch,
  onCategoryChange,
  onTypeChange,
  onReset,
}: SearchFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Инициализируем состояния из URL параметров
  const initialSearch = searchParams.get("search") || ""
  const initialCategory = searchParams.get("category") || "all"
  const initialType = searchParams.get("type") || "all"

  const [search, setSearch] = useState(initialSearch)
  const [category, setCategory] = useState(initialCategory)
  const [type, setType] = useState(initialType)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const debouncedSearch = useDebounce(search, 300)

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

  const updateSearch = useCallback(() => {
    setIsLoading(true)

    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (category !== "all") params.set("category", category)
    if (type !== "all" && showTypeFilter) params.set("type", type)

    // Сбрасываем страницу при новом поиске
    params.set("page", "1")

    if (onSearch) {
      onSearch({
        search: debouncedSearch || undefined,
        category: category !== "all" ? category : undefined,
        type: type !== "all" ? type : undefined,
      })
      setIsLoading(false)
    } else {
      // Обновляем URL с параметрами поиска
      router.push(`?${params.toString()}`)
    }
  }, [debouncedSearch, category, type, showTypeFilter, onSearch, router])

  // Эффект для автоматического поиска при изменении debouncedSearch
  useEffect(() => {
    updateSearch()
  }, [debouncedSearch, updateSearch])

  const handleCategoryChange = (categoryId: number | null) => {
    setCategory(categoryId?.toString() || "all")
    onCategoryChange?.(categoryId)
  }

  const handleTypeChange = (type: string | null) => {
    setType(type || "all")
    onTypeChange?.(type)
  }

  const handleReset = () => {
    console.log("Resetting filters")
    setSearch("")
    setCategory("all")
    setType("all")

    if (onSearch) {
      onSearch({})
    } else {
      router.push("")
    }
  }

  // Проверяем, есть ли активные фильтры
  const hasActiveFilters = Boolean(
    search.trim() || // есть текст поиска (игнорируем пробелы)
    (category && category !== "all") || // выбрана категория
    (showTypeFilter && type && type !== "all") // выбран тип (только если showTypeFilter=true)
  )

  // Отладочная информация
  useEffect(() => {
    console.log("Filter states updated:", {
      search,
      category,
      type,
      hasActiveFilters,
      showTypeFilter,
      searchParams: Object.fromEntries(searchParams.entries())
    })
  }, [search, category, type, hasActiveFilters, showTypeFilter, searchParams])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Input
          type="search"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(isOpen && "bg-accent")}
        >
          <Filter className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          disabled={!hasActiveFilters}
          title={hasActiveFilters ? "Сбросить фильтры" : "Нет активных фильтров"}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent className="space-y-4">
          <div className={cn("grid gap-4", showTypeFilter ? "md:grid-cols-2" : "md:grid-cols-1")}>
            <div className="space-y-2">
              <Label>Категория</Label>
              <CategorySelect
                selectedCategory={category !== "all" ? parseInt(category) : null}
                onCategoryChange={handleCategoryChange}
              />
            </div>
            {showTypeFilter && (
              <div className="space-y-2">
                <Label>Тип</Label>
                <TypeSelect selectedType={type !== "all" ? type : null} onTypeChange={handleTypeChange} />
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

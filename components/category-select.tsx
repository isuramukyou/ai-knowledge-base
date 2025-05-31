import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Category } from "@/lib/models/category"

interface CategorySelectProps {
  selectedCategory: number | null
  onCategoryChange: (categoryId: number | null) => void
}

export function CategorySelect({ selectedCategory, onCategoryChange }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories")
        const data = await response.json()
        setCategories(data)
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }
    fetchCategories()
  }, [])

  return (
    <Select
      value={selectedCategory?.toString() || "all"}
      onValueChange={(value) => onCategoryChange(value === "all" ? null : parseInt(value))}
    >
      <SelectTrigger>
        <SelectValue placeholder="Выберите категорию" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Все категории</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id.toString()}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 
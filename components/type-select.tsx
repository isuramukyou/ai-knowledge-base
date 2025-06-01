import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TypeSelectProps {
  selectedType: string | null
  onTypeChange: (type: string | null) => void
}

export function TypeSelect({ selectedType, onTypeChange }: TypeSelectProps) {
  return (
    <Select
      value={selectedType || "all"}
      onValueChange={(value) => onTypeChange(value === "all" ? null : value)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Выберите тип" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Все типы</SelectItem>
        {/* Temporarily commented out: Article type filter is disabled */}
        {/* <SelectItem value="article">Статьи</SelectItem> */}
        <SelectItem value="link">Ссылки</SelectItem>
        <SelectItem value="video">Видео</SelectItem>
      </SelectContent>
    </Select>
  )
} 
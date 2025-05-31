"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import dynamic from "next/dynamic"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

interface Category {
  id: number
  name: string
}

const typeOptions = [
  { value: "article", label: "Статья", icon: "📄" },
  { value: "link", label: "Ссылка", icon: "🔗" },
  { value: "video", label: "Видео", icon: "🎥" },
]

export default function NewKnowledgePage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")
  const [type, setType] = useState("article")
  const [url, setUrl] = useState("")
  const [coverUrl, setCoverUrl] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetch("/api/categories")
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(() => setCategories([]))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const telegramId = typeof window !== "undefined" ? localStorage.getItem("telegram_id") : null
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(telegramId ? { "x-telegram-id": telegramId } : {}),
        },
        body: JSON.stringify({
          title,
          description,
          content: type === "article" ? content : null,
          type,
          url: type !== "article" ? url : null,
          cover_url: coverUrl,
          category_id: categoryId,
        }),
      })
      if (res.ok) {
        router.push("/")
      } else {
        setError("Ошибка при создании записи")
      }
    } catch (e) {
      setError("Ошибка сети")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Добавить запись в базу знаний</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 mb-2">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-fit px-3 py-1 h-9 border-none bg-transparent shadow-none text-base font-medium focus:ring-0 focus:outline-none">
              <span className="flex items-center gap-1">
                <span style={{ pointerEvents: "none" }}>
                  {typeOptions.find(o => o.value === type)?.icon} {typeOptions.find(o => o.value === type)?.label}
                </span>
              </span>
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="flex items-center gap-2">
                  <span>{opt.icon}</span> {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input placeholder="Заголовок" value={title} onChange={e => setTitle(e.target.value)} required />
        <Textarea placeholder="Краткое описание" value={description} onChange={e => setDescription(e.target.value)} required />
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {type !== "article" && (
          <Input placeholder={type === "link" ? "URL статьи" : "URL видео"} value={url} onChange={e => setUrl(e.target.value)} required />
        )}
        <Input placeholder="URL обложки" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} />
        {type === "article" && (
          <div data-color-mode="light">
            <MDEditor
              value={content}
              onChange={v => setContent(v || "")}
              height={300}
              preview="edit"
              textareaProps={{ placeholder: "Текст статьи (поддерживается markdown)" }}
            />
          </div>
        )}
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <Button type="submit" disabled={loading}>{loading ? "Сохраняю..." : "Добавить"}</Button>
      </form>
    </div>
  )
} 
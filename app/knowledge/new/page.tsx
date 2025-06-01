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
import { Label } from "@/components/ui/label"
import { Trash2 } from "lucide-react"
import imageCompression from 'browser-image-compression';

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

interface Category {
  id: number
  name: string
}

const typeOptions = [
  { value: "link", label: "Ссылка", icon: "🔗" },
  { value: "video", label: "Видео", icon: "🎥" },
]

export default function NewKnowledgePage() {
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState<string | undefined>("")
  const [type, setType] = useState("link")
  const [url, setUrl] = useState("")
  const [coverUrl, setCoverUrl] = useState("")
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/categories")
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(() => setCategories([]))
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const maxSizeBytes = 3 * 1024 * 1024; // 3 MB

      if (file.size > maxSizeBytes) {
        setError(`Размер изображения не должен превышать ${maxSizeBytes / 1024 / 1024} MB.`);
        // Optionally clear the file input
        e.target.value = '';
        return;
      }

      // Compress image before setting state
      const options = {
        maxSizeMB: 1, // Maximum size in MB
        maxWidthOrHeight: 1920, // Maximum width or height
        useWebWorker: true, // Use web worker for better performance
      };
      try {
        const compressedFile = await imageCompression(file, options);
        setCoverFile(compressedFile);
        setCoverUrl("");
        const reader = new FileReader();
        reader.onloadend = () => {
          setCoverPreview(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Error compressing image:', error);
        // Handle error (e.g., show a message to the user)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    let uploadedCoverUrl = coverUrl
    if (coverFile) {
      const formData = new FormData()
      formData.append("file", coverFile)

      try {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          uploadedCoverUrl = uploadData.url
        } else {
          setError("Ошибка при загрузке изображения")
          setLoading(false)
          return
        }
      } catch (e) {
        setError("Ошибка сети при загрузке")
        setLoading(false)
        return
      }
    }

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
          cover_url: uploadedCoverUrl,
          category_id: categoryId !== null ? Number(categoryId) : null,
        }),
      })
      if (res.ok) {
        router.push("/") // Redirect to home or the new item's page
      } else {
        setError("Ошибка при создании записи")
      }
    } catch (e: any) {
      setError("Ошибка сети: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Добавить запись в базу знаний</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 mb-2">
          <Select value={type} onValueChange={setType} disabled={loading}>
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
        <Input placeholder="Заголовок" value={title} onChange={e => setTitle(e.target.value)} required disabled={loading} />
        <Textarea placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)} required disabled={loading} />
        <Select value={categoryId?.toString() || ""} onValueChange={value => setCategoryId(value === "" ? null : Number(value))} disabled={loading}>
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
          <Input placeholder={type === "link" ? "Ссылка на статью" : "Ссылка на видео"} value={url} onChange={e => setUrl(e.target.value)} required disabled={loading} />
        )}
        <div className="space-y-2">
          <Label htmlFor="coverImage">Изображение обложки</Label>
          <Input id="coverImage" type="file" accept="image/*" onChange={handleFileChange} disabled={loading} />
          {(coverPreview || coverUrl) && (
            <div className="relative w-full aspect-video rounded-md overflow-hidden">
              <img
                src={coverPreview || coverUrl || "/placeholder.svg"}
                alt="Cover Preview"
                className="w-full h-full object-cover"
              />
              {coverPreview && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full"
                  onClick={() => {
                    setCoverFile(null);
                    setCoverPreview(null);
                    setCoverUrl("");
                  }}
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
        {/* Temporarily commented out: Article type is disabled */}
        {/*
        {!loading && type === "article" && (
          <div data-color-mode="light" className="w-full">
            <MDEditor
              value={content}
              onChange={v => setContent(v || "")}
              height={300}
              preview="live"
              textareaProps={{ placeholder: "Текст статьи (поддерживается markdown)" }}
            />
          </div>
        )}
        */}
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/")} disabled={loading}>
            Отмена
          </Button>
          <Button type="submit" disabled={loading}>{loading ? "Сохраняю..." : "Добавить"}</Button>
        </div>
      </form>
    </div>
  )
} 
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { uniqBy } from "lodash-es"
import { Label } from "@/components/ui/label"
import { Trash2 } from "lucide-react"
import imageCompression from 'browser-image-compression';

interface Category {
  id: number
  name: string
}

interface Currency {
  code: string
  symbol: string
  name: string
}

export default function NewModelPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [coverUrl, setCoverUrl] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [pricing, setPricing] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [currency, setCurrency] = useState("")
  const [period, setPeriod] = useState("month")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  const periodOptions = [
    { value: "day", label: "день" },
    { value: "week", label: "неделя" },
    { value: "month", label: "месяц" },
    { value: "year", label: "год" },
  ]

  useEffect(() => {
    fetch("/api/categories")
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    fetch("/api/currencies").then(r => r.json()).then(setCurrencies)
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
        setCoverUrl(""); // Clear URL if file is selected
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
          return // Stop the submission if upload fails
        }
      } catch (e) {
        setError("Ошибка сети при загрузке")
        setLoading(false)
        return
      }
    }

    try {
      const telegramId = typeof window !== "undefined" ? localStorage.getItem("telegram_id") : null
      const res = await fetch("/api/models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(telegramId ? { "x-telegram-id": telegramId } : {}),
        },
        body: JSON.stringify({
          name,
          description,
          category_id: categoryId,
          cover_url: uploadedCoverUrl, // Use the uploaded URL
          website_url: websiteUrl,
          pricing: pricing && currency && period ? `${pricing}|${currency}|${period}` : "",
        }),
      })
      if (res.ok) {
        router.push("/")
      } else {
        setError("Ошибка при создании модели")
      }
    } catch (e) {
      setError("Ошибка сети")
    } finally {
      setLoading(false)
    }
  }

  const handleWebsiteClick = (url: string) => {
    let finalUrl = url
    if (!/^https?:\/\//i.test(url)) {
      finalUrl = "https://" + url
    }
    window.open(finalUrl, "_blank")
  }

  const uniqueCurrencies = uniqBy(currencies, "code")
  const uniqueCategories = uniqBy(categories, "id")

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Добавить нейросеть</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input placeholder="Название" value={name} onChange={e => setName(e.target.value)} required disabled={loading} />
        <Textarea placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)} required disabled={loading} />
        <Select value={categoryId} onValueChange={setCategoryId} disabled={loading}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat: Category) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="Сайт" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} disabled={loading} />
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            min={0}
            placeholder="Цена"
            value={pricing}
            onChange={e => setPricing(e.target.value)}
            className="w-24"
          />
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Валюта">
                {uniqueCurrencies.find(c => c.code === currency)?.symbol || "Валюта"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c: Currency) => (
                <SelectItem key={c.code} value={c.code}>{c.symbol}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>/</span>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {pricing && currency && period && (
          <div className="text-sm text-muted-foreground mt-1">
            Пример: от {pricing} {uniqueCurrencies.find(c => c.code === currency)?.symbol}/{periodOptions.find(p => p.value === period)?.label}
          </div>
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
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/")} disabled={loading}>Отмена</Button>
          <Button type="submit" disabled={loading}>{loading ? "Сохраняю..." : "Добавить"}</Button>
        </div>
      </form>
    </div>
  )
} 
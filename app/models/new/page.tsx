"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { uniqBy } from "lodash-es"

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const telegramId = typeof window !== "undefined" ? localStorage.getItem("telegram_id") : null
      const res = await fetch("/api/models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(telegramId ? { "x-telegram-id": telegramId } : {}),
        },
        body: JSON.stringify({ name, description, category_id: categoryId, cover_url: coverUrl, website_url: websiteUrl, pricing }),
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
        <Input placeholder="Название" value={name} onChange={e => setName(e.target.value)} required />
        <Textarea placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)} required />
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            {uniqueCategories.map(cat => (
              <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="URL обложки" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} />
        <Input placeholder="Сайт" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} />
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
              {uniqueCurrencies.map(c => (
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
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <Button type="submit" disabled={loading}>{loading ? "Сохраняю..." : "Добавить"}</Button>
      </form>
    </div>
  )
} 
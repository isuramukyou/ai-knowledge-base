import { notFound, redirect } from "next/navigation"
import { getKnowledgeItemById } from "@/lib/models/knowledge-item"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default async function KnowledgeItemPage({ params }: { params: { id: string } }) {
  // Проверяем, что ID является корректным числом
  const id = Number(params.id)
  if (isNaN(id)) {
    return notFound()
  }

  const item = await getKnowledgeItemById(id)
  if (!item) return notFound()

  // Temporarily hide article content
  if (item.type === "article") {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 text-center text-muted-foreground">
        <h1 className="text-3xl font-bold mb-4">{item.title}</h1>
        <p>Содержание статьи временно недоступно.</p>
        {/* Optionally add author info if desired */}
         <div className="flex items-center justify-center gap-2 mt-4 text-sm">
          <Avatar className="w-6 h-6">
            <AvatarImage src={item.author_avatar_url || `https://t.me/i/userpic/320/${item.author_username ?? ''}.jpg`} />
            <AvatarFallback>
              {item.author_first_name?.[0]}
              {item.author_last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <span>
            {item.author_first_name} {item.author_last_name}
          </span>
        </div>
      </div>
    );
  }

  // Если это ссылка или видео — редирект на источник
  if ((item.type === "link" || item.type === "video") && item.url) {
    redirect(item.url)
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {item.cover_url && (
        <img src={item.cover_url} alt={item.title} className="w-full rounded-lg mb-6 object-cover max-h-80" />
      )}
      <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
      <div className="flex items-center gap-2 mb-6 text-muted-foreground text-sm">
        <Avatar className="w-6 h-6">
          <AvatarImage src={item.author_avatar_url || `https://t.me/i/userpic/320/${item.author_username ?? ''}.jpg`} />
          <AvatarFallback>
            {item.author_first_name?.[0]}
            {item.author_last_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <span>
          {item.author_first_name} {item.author_last_name}
        </span>
      </div>
      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content || item.description || ""}</ReactMarkdown>
      </div>
    </div>
  )
} 
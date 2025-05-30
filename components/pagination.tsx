"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange?: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return

    if (onPageChange) {
      onPageChange(page)
    } else {
      const params = new URLSearchParams(searchParams.toString())
      params.set("page", page.toString())
      router.push(`?${params.toString()}`)
    }
  }

  // Определяем, какие страницы показывать
  const getPageNumbers = () => {
    const pages = []

    // Всегда показываем первую страницу
    if (currentPage > 3) {
      pages.push(1)
      if (currentPage > 4) {
        pages.push("ellipsis1")
      }
    }

    // Показываем страницы вокруг текущей
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
      pages.push(i)
    }

    // Всегда показываем последнюю страницу
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        pages.push("ellipsis2")
      }
      pages.push(totalPages)
    }

    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(1)}
        disabled={currentPage === 1}
        className="hidden sm:flex"
      >
        <ChevronsLeft className="h-4 w-4" />
        <span className="sr-only">Первая страница</span>
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Предыдущая страница</span>
      </Button>

      {getPageNumbers().map((page, index) => {
        if (page === "ellipsis1" || page === "ellipsis2") {
          return (
            <Button key={`ellipsis-${index}`} variant="outline" size="icon" disabled>
              ...
            </Button>
          )
        }

        return (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="icon"
            onClick={() => handlePageChange(page as number)}
          >
            {page}
          </Button>
        )
      })}

      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Следующая страница</span>
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="hidden sm:flex"
      >
        <ChevronsRight className="h-4 w-4" />
        <span className="sr-only">Последняя страница</span>
      </Button>
    </div>
  )
}

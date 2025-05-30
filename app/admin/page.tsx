"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Shield, Users, Tags, FileText, Settings } from "lucide-react"
import Pagination from "@/components/pagination"

interface User {
  id: number
  telegram_id: string
  username: string | null
  first_name: string
  last_name: string | null
  avatar_url: string | null
  is_admin: boolean
  is_blocked: boolean
  created_at: string
  updated_at: string
  posts_count?: number
}

interface Category {
  id: number
  name: string
  color: string
  created_at: string
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState({ name: "", color: "#3b82f6" })
  const [usersPagination, setUsersPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("users")
  const [stats, setStats] = useState({
    modelsCount: 0,
    knowledgeCount: 0,
    activeUsers: 0,
  })

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers(1)
    } else if (activeTab === "categories") {
      fetchCategories()
    } else if (activeTab === "content") {
      fetchStats()
    }
  }, [activeTab])

  // Загрузка пользователей
  const fetchUsers = async (page = 1) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", "10")

      const telegramId = localStorage.getItem("telegram_id")
      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          "x-telegram-id": telegramId || "",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setUsersPagination(data.pagination)
      } else {
        console.error("Failed to fetch users:", await response.text())
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Загрузка категорий
  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Загрузка статистики
  const fetchStats = async () => {
    setIsLoading(true)
    try {
      // В реальном приложении здесь будет запрос к API для получения статистики
      // Для примера используем моковые данные
      setStats({
        modelsCount: 12,
        knowledgeCount: 8,
        activeUsers: users.filter((u) => !u.is_blocked).length,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Блокировка/разблокировка пользователя
  const toggleUserBlock = async (userId: number, isBlocked: boolean) => {
    try {
      const telegramId = localStorage.getItem("telegram_id")
      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-id": telegramId || "",
        },
        body: JSON.stringify({ isBlocked }),
      })

      if (response.ok) {
        setUsers(users.map((user) => (user.id === userId ? { ...user, is_blocked: isBlocked } : user)))
      } else {
        console.error("Failed to toggle user block status:", await response.text())
      }
    } catch (error) {
      console.error("Error toggling user block status:", error)
    }
  }

  // Добавление категории
  const addCategory = async () => {
    if (newCategory.name.trim()) {
      try {
        const telegramId = localStorage.getItem("telegram_id")
        const response = await fetch("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-telegram-id": telegramId || "",
          },
          body: JSON.stringify(newCategory),
        })

        if (response.ok) {
          const category = await response.json()
          setCategories([...categories, category])
          setNewCategory({ name: "", color: "#3b82f6" })
        } else {
          console.error("Failed to add category:", await response.text())
        }
      } catch (error) {
        console.error("Error adding category:", error)
      }
    }
  }

  // Удаление категории
  const deleteCategory = async (categoryId: number) => {
    try {
      const telegramId = localStorage.getItem("telegram_id")
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
        headers: {
          "x-telegram-id": telegramId || "",
        },
      })

      if (response.ok) {
        setCategories(categories.filter((cat) => cat.id !== categoryId))
      } else {
        console.error("Failed to delete category:", await response.text())
      }
    } catch (error) {
      console.error("Error deleting category:", error)
    }
  }

  // Обработчик смены вкладки
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold">Админ панель</h1>
          </div>

          <Button variant="outline" className="rounded-full">
            <Settings className="w-4 h-4 mr-2" />
            Настройки
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="w-full" onValueChange={handleTabChange}>
          <TabsList className="grid w-fit grid-cols-3 rounded-full mb-8">
            <TabsTrigger value="users" className="rounded-full">
              <Users className="w-4 h-4 mr-2" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-full">
              <Tags className="w-4 h-4 mr-2" />
              Категории
            </TabsTrigger>
            <TabsTrigger value="content" className="rounded-full">
              <FileText className="w-4 h-4 mr-2" />
              Контент
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Управление пользователями</h2>
              <Badge variant="secondary">{usersPagination.total} пользователей</Badge>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : users.length > 0 ? (
              <div className="grid gap-4">
                {users.map((user) => (
                  <Card key={user.id} className="transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={user.avatar_url || `https://t.me/i/userpic/320/${user.username}.jpg`} />
                            <AvatarFallback>
                              {user.first_name?.[0]}
                              {user.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>

                          <div className="space-y-1">
                            <h3 className="font-semibold">
                              {user.first_name} {user.last_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Регистрация: {new Date(user.created_at).toLocaleDateString()}</span>
                              <span>Записей: {user.posts_count || 0}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {user.is_blocked && <Badge variant="destructive">Заблокирован</Badge>}
                          {user.is_admin && <Badge variant="default">Администратор</Badge>}

                          <div className="flex items-center gap-2">
                            <Label htmlFor={`block-${user.id}`} className="text-sm">
                              Заблокировать
                            </Label>
                            <Switch
                              id={`block-${user.id}`}
                              checked={user.is_blocked}
                              onCheckedChange={(checked) => toggleUserBlock(user.id, checked)}
                              disabled={user.is_admin}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Pagination
                  currentPage={usersPagination.page}
                  totalPages={usersPagination.totalPages}
                  onPageChange={(page) => fetchUsers(page)}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Пользователи не найдены</p>
              </div>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Управление категориями</h2>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="rounded-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить категорию
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Новая категория</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category-name">Название</Label>
                      <Input
                        id="category-name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        placeholder="Введите название категории"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category-color">Цвет</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="category-color"
                          type="color"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                          className="w-16 h-10"
                        />
                        <Input
                          value={newCategory.color}
                          onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>

                    <Button onClick={addCategory} className="w-full">
                      Создать категорию
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : categories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <Card key={category.id} className="transition-all duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCategory(category.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          Удалить
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Создана: {new Date(category.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Категории не найдены</p>
              </div>
            )}
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Управление контентом</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">🤖 Нейросети</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{stats.modelsCount}</div>
                  <p className="text-sm text-muted-foreground">Всего записей</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">📚 База знаний</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{stats.knowledgeCount}</div>
                  <p className="text-sm text-muted-foreground">Всего записей</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">👥 Активные пользователи</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{stats.activeUsers}</div>
                  <p className="text-sm text-muted-foreground">Не заблокированы</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

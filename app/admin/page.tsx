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
      const telegramId = localStorage.getItem("telegram_id")
      // Получаем количество моделей
      const modelsRes = await fetch(`/api/models?page=1&limit=1`)
      const modelsData = await modelsRes.json()
      // Получаем количество записей в базе знаний
      const knowledgeRes = await fetch(`/api/knowledge?page=1&limit=1`)
      const knowledgeData = await knowledgeRes.json()
      // Получаем пользователей (админский эндпоинт)
      const usersRes = await fetch(`/api/admin/users?page=1&limit=1`, {
        headers: { "x-telegram-id": telegramId || "" },
      })
      const usersData = await usersRes.json()
      // Получаем всех пользователей и фильтруем активных (is_blocked === false)
      // Для оптимизации можно сделать отдельный эндпоинт, но пока так:
      const allUsersRes = await fetch(`/api/admin/users?page=1&limit=10000`, {
        headers: { "x-telegram-id": telegramId || "" },
      })
      const allUsersData = await allUsersRes.json()
      const activeUsers = Array.isArray(allUsersData.users)
        ? allUsersData.users.filter((u: any) => !u.is_blocked).length
        : 0
      setStats({
        modelsCount: modelsData.pagination?.total || 0,
        knowledgeCount: knowledgeData.pagination?.total || 0,
        activeUsers,
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
        <div className="container mx-auto px-2 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <h1 className="text-lg sm:text-xl font-semibold">Админ панель</h1>
          </div>

          <Button variant="outline" className="rounded-full px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base">
            <Settings className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Настройки</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <Tabs defaultValue="users" className="w-full" onValueChange={handleTabChange}>
          <TabsList className="grid w-fit grid-cols-3 rounded-full mb-4 sm:mb-8">
            <TabsTrigger value="users" className="rounded-full text-sm sm:text-base px-2 sm:px-4 py-1.5">
              <Users className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Пользователи</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-full text-sm sm:text-base px-2 sm:px-4 py-1.5">
              <Tags className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Категории</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="rounded-full text-sm sm:text-base px-2 sm:px-4 py-1.5">
              <FileText className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Контент</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <h2 className="text-xl sm:text-2xl font-semibold">Управление пользователями</h2>
              <Badge variant="secondary">{usersPagination.total} пользователей</Badge>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : users.length > 0 ? (
              <div className="grid gap-2 sm:gap-4">
                {users.map((user) => (
                  <Card key={user.id} className="transition-all duration-200">
                    <CardContent className="p-3 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                            <AvatarImage src={user.avatar_url || `https://t.me/i/userpic/320/${user.username}.jpg`} />
                            <AvatarFallback>
                              {user.first_name?.[0]}
                              {user.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>

                          <div className="space-y-1">
                            <h3 className="font-semibold text-base sm:text-lg">
                              {user.first_name} {user.last_name}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">@{user.username}</p>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 text-xs text-muted-foreground">
                              <span>Регистрация: {new Date(user.created_at).toLocaleDateString()}</span>
                              <span>Записей: {user.posts_count || 0}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
                          {user.is_blocked && <Badge variant="destructive">Заблокирован</Badge>}
                          {user.is_admin && <Badge variant="default">Администратор</Badge>}

                          <div className="flex items-center gap-1 sm:gap-2">
                            <Label htmlFor={`block-${user.id}`} className="text-xs sm:text-sm">
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
              <div className="text-center py-8 sm:py-12">
                <p className="text-muted-foreground">Пользователи не найдены</p>
              </div>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <h2 className="text-xl sm:text-2xl font-semibold">Управление категориями</h2>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="rounded-full px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base">
                    <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Добавить категорию</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Новая категория</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="category-name">Название</Label>
                      <Input
                        id="category-name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        placeholder="Введите название категории"
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="category-color">Цвет</Label>
                      <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2">
                        <Input
                          id="category-color"
                          type="color"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                          className="w-12 h-8 sm:w-16 sm:h-10"
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
              <div className="flex justify-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : categories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                {categories.map((category) => (
                  <Card key={category.id} className="transition-all duration-200">
                    <CardHeader className="pb-2 sm:pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                          <CardTitle className="text-base sm:text-lg">{category.name}</CardTitle>
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
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Создана: {new Date(category.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <p className="text-muted-foreground">Категории не найдены</p>
              </div>
            )}
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <h2 className="text-xl sm:text-2xl font-semibold">Управление контентом</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">🤖 Нейросети</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{stats.modelsCount}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Всего записей</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">📚 База знаний</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{stats.knowledgeCount}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Всего записей</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">👥 Активные пользователи</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{stats.activeUsers}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Не заблокированы</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

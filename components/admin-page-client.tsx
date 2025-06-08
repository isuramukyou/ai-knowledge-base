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
import { Plus, Users, Tags, FileText, Home, Pencil, Trash2 } from "lucide-react"
import Pagination from "@/components/pagination"
import { useRouter } from "next/navigation"
import { useAuthFetch } from "@/hooks/use-auth-fetch"

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
  posts_count?: number
}

interface PaginationData {
  page: number
  total: number
  totalPages: number
}

interface Stats {
  modelsCount: number
  knowledgeCount: number
  activeUsers: number
}

export default function AdminPageClient() {
  const router = useRouter()
  const { authFetch } = useAuthFetch()
  const [users, setUsers] = useState<User[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState({ name: "", color: "#000000" })
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [pagination, setPagination] = useState<PaginationData>({ page: 1, total: 0, totalPages: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("users")
  const [stats, setStats] = useState<Stats | null>(null)

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers()
    } else if (activeTab === "categories") {
      fetchCategories()
    } else if (activeTab === "stats") {
      fetchStats()
    }
  }, [activeTab])

  // Загрузка пользователей
  const fetchUsers = async (page: number = pagination.page) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", "10")
      params.set("include_posts_count", "true")

      const response = await authFetch(`/api/admin/users?${params.toString()}`)

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setPagination(data.pagination)
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
      const response = await authFetch("/api/categories", { requireAuth: false })
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
      // Получаем количество моделей
      const modelsRes = await authFetch(`/api/models?page=1&limit=1`, { requireAuth: false })
      const modelsData = await modelsRes.json()
      // Получаем количество записей в базе знаний
      const knowledgeRes = await authFetch(`/api/knowledge?page=1&limit=1`, { requireAuth: false })
      const knowledgeData = await knowledgeRes.json()
      // Получаем пользователей (админский эндпоинт)
      const usersRes = await authFetch(`/api/admin/users?page=1&limit=1`)
      const usersData = await usersRes.json()
      // Получаем всех пользователей и фильтруем активных (is_blocked === false)
      // Для оптимизации можно сделать отдельный эндпоинт, но пока так:
      const allUsersRes = await authFetch(`/api/admin/users?page=1&limit=10000`)
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
      const response = await authFetch(`/api/admin/users/${userId}/block`, {
        method: "POST",
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
        const response = await authFetch("/api/categories", {
          method: "POST",
          body: JSON.stringify(newCategory),
        })

        if (response.ok) {
          const category = await response.json()
          setCategories([...categories, category])
          setNewCategory({ name: "", color: "#000000" })
        } else {
          console.error("Failed to add category:", await response.text())
        }
      } catch (error) {
        console.error("Error adding category:", error)
      }
    }
  }

  // Редактирование категории
  const updateCategory = async (id: number, name: string, color: string) => {
    try {
      const response = await authFetch(`/api/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name, color }),
      })

      if (response.ok) {
        const updatedCategory = await response.json()
        setCategories(categories.map((cat) => (cat.id === id ? updatedCategory : cat)))
        setEditingCategory(null)
      } else {
        console.error("Failed to update category:", await response.text())
      }
    } catch (error) {
      console.error("Error updating category:", error)
    }
  }

  // Удаление категории
  const deleteCategory = async (categoryId: number) => {
    try {
      const response = await authFetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setCategories(categories.filter((cat) => cat.id !== categoryId))
      } else {
        const error = await response.text()
        console.error("Failed to delete category:", error)
        // Показываем ошибку пользователю
        alert(error)
      }
    } catch (error) {
      console.error("Error deleting category:", error)
    }
  }

  // Обработчик смены вкладки
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "users") {
      fetchUsers()
    } else if (value === "categories") {
      fetchCategories()
    } else if (value === "stats") {
      fetchStats()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-2 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧩</span>
            <h1 className="text-lg sm:text-xl font-semibold">Админ панель</h1>
          </div>

          <Button 
            variant="outline" 
            className="rounded-full px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base flex items-center justify-center"
            onClick={() => router.push("/")}
          >
            <Home className="w-4 h-4 xs:mr-2" />
            <span className="hidden xs:inline">На главную</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="w-full" onValueChange={handleTabChange}>
          <div className="flex items-center justify-center mb-8">
            <TabsList className="grid w-fit grid-cols-3 rounded-full">
              <TabsTrigger value="users" className="rounded-full">
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="categories" className="rounded-full">
                <Tags className="w-4 h-4 mr-2" />
                Data
              </TabsTrigger>
              <TabsTrigger value="stats" className="rounded-full">
                <FileText className="w-4 h-4 mr-2" />
                Stats
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Управление пользователями</h2>
              <Badge variant="secondary" className="whitespace-nowrap">{pagination.total} пользователей</Badge>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : users.length > 0 ? (
              <div className="grid gap-6">
                {users.map((user) => (
                  <Card key={user.id} className="transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={user.avatar_url || `https://t.me/i/userpic/320/${user.username}.jpg`} />
                            <AvatarFallback>
                              {user.first_name?.[0]}
                              {user.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>

                          <div className="space-y-1">
                            <h3 className="font-semibold text-lg">
                              {user.first_name} {user.last_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                              <span>Регистрация: {new Date(user.created_at).toLocaleDateString()}</span>
                              <span>Записей: {user.posts_count || 0}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="flex items-center gap-2">
                            {user.is_blocked && <Badge variant="destructive">Заблокирован</Badge>}
                            {user.is_admin && <Badge variant="default">Администратор</Badge>}
                          </div>

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
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
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
              <h2 className="text-2xl font-semibold">Управление данными</h2>

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
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Название</Label>
                      <Input
                        id="name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        placeholder="Введите название категории"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="color">Цвет</Label>
                      <Input
                        id="color"
                        type="color"
                        value={newCategory.color}
                        onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      />
                    </div>
                    <Button onClick={addCategory} className="w-full">
                      Добавить
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <Card key={category.id} className="transition-all duration-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCategory(category)}
                            className="text-primary hover:text-primary"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCategory(category.id)}
                            className="text-destructive hover:text-destructive"
                            disabled={(category.posts_count ?? 0) > 0}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Создана: {new Date(category.created_at).toLocaleDateString()}
                        </p>
                        <Badge variant="secondary">
                          {category.posts_count} {category.posts_count === 1 ? "запись" : "записей"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Категории не найдены</p>
              </div>
            )}

            {/* Диалог редактирования категории */}
            <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Редактировать категорию</DialogTitle>
                </DialogHeader>
                {editingCategory && (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Название</Label>
                      <Input
                        id="edit-name"
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        placeholder="Введите название категории"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-color">Цвет</Label>
                      <Input
                        id="edit-color"
                        type="color"
                        value={editingCategory.color}
                        onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                      />
                    </div>
                    <Button
                      onClick={() => updateCategory(editingCategory.id, editingCategory.name, editingCategory.color)}
                      className="w-full"
                    >
                      Сохранить
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Статистика</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">🤖 Нейросети</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{stats?.modelsCount}</div>
                  <p className="text-sm text-muted-foreground">Всего записей</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">📚 База знаний</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{stats?.knowledgeCount}</div>
                  <p className="text-sm text-muted-foreground">Всего записей</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">👥 Активные пользователи</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{stats?.activeUsers}</div>
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
"use client"

import { useState } from "react"
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

interface User {
  id: string
  firstName: string
  lastName: string
  username: string
  avatar?: string
  isBlocked: boolean
  createdAt: string
  postsCount: number
}

interface Category {
  id: string
  name: string
  color: string
  createdAt: string
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      firstName: "Иван",
      lastName: "Петров",
      username: "ivan_petrov",
      isBlocked: false,
      createdAt: "2024-01-15",
      postsCount: 5,
    },
    {
      id: "2",
      firstName: "Мария",
      lastName: "Сидорова",
      username: "maria_sid",
      isBlocked: false,
      createdAt: "2024-01-10",
      postsCount: 3,
    },
  ])

  const [categories, setCategories] = useState<Category[]>([
    { id: "1", name: "Языковые модели", color: "#3b82f6", createdAt: "2024-01-01" },
    { id: "2", name: "Генерация изображений", color: "#10b981", createdAt: "2024-01-01" },
    { id: "3", name: "Дизайн", color: "#f59e0b", createdAt: "2024-01-01" },
    { id: "4", name: "Программирование", color: "#8b5cf6", createdAt: "2024-01-01" },
  ])

  const [newCategory, setNewCategory] = useState({ name: "", color: "#3b82f6" })

  const toggleUserBlock = (userId: string) => {
    setUsers(users.map((user) => (user.id === userId ? { ...user, isBlocked: !user.isBlocked } : user)))
  }

  const addCategory = () => {
    if (newCategory.name.trim()) {
      const category: Category = {
        id: Date.now().toString(),
        name: newCategory.name,
        color: newCategory.color,
        createdAt: new Date().toISOString().split("T")[0],
      }
      setCategories([...categories, category])
      setNewCategory({ name: "", color: "#3b82f6" })
    }
  }

  const deleteCategory = (categoryId: string) => {
    setCategories(categories.filter((cat) => cat.id !== categoryId))
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
        <Tabs defaultValue="users" className="w-full">
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
              <Badge variant="secondary">{users.length} пользователей</Badge>
            </div>

            <div className="grid gap-4">
              {users.map((user) => (
                <Card key={user.id} className="transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={user.avatar || `https://t.me/i/userpic/320/${user.username}.jpg`} />
                          <AvatarFallback>
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>

                        <div className="space-y-1">
                          <h3 className="font-semibold">
                            {user.firstName} {user.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Регистрация: {user.createdAt}</span>
                            <span>Записей: {user.postsCount}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {user.isBlocked && <Badge variant="destructive">Заблокирован</Badge>}

                        <div className="flex items-center gap-2">
                          <Label htmlFor={`block-${user.id}`} className="text-sm">
                            Заблокировать
                          </Label>
                          <Switch
                            id={`block-${user.id}`}
                            checked={user.isBlocked}
                            onCheckedChange={() => toggleUserBlock(user.id)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                    <p className="text-sm text-muted-foreground">Создана: {category.createdAt}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                  <div className="text-3xl font-bold mb-2">12</div>
                  <p className="text-sm text-muted-foreground">Всего записей</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">📚 База знаний</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">8</div>
                  <p className="text-sm text-muted-foreground">Всего записей</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">👥 Активные пользователи</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{users.filter((u) => !u.isBlocked).length}</div>
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

import { redirect } from "next/navigation"
import { isCurrentUserAdmin } from "@/lib/auth"
import AdminPageClient from "@/components/admin-page-client"

// Серверный компонент для проверки авторизации
export default async function AdminPage() {
  // Проверяем права администратора на сервере
  const isAdmin = await isCurrentUserAdmin()
  
  if (!isAdmin) {
    // Если не админ - перенаправляем на главную страницу
    redirect('/')
  }

  // Если админ - показываем клиентскую часть
  return <AdminPageClient />
}

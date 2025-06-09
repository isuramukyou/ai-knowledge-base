import { redirect } from "next/navigation"
import { isCurrentUserAdmin } from "@/lib/auth"
import AdminPageClient from "@/components/admin-page-client"

// Серверный компонент для проверки авторизации
export default async function AdminPage() {
  // Проверяем права администратора на сервере
  const isAdmin = await isCurrentUserAdmin()
  
  console.log('Admin page check:', { isAdmin, env: process.env.NODE_ENV })
  
  if (!isAdmin) {
    console.log('Redirecting from admin page - user is not admin')
    // Если не админ - перенаправляем на главную страницу
    redirect('/')
  }

  console.log('Showing admin page - user is admin')
  // Если админ - показываем клиентскую часть
  return <AdminPageClient />
}

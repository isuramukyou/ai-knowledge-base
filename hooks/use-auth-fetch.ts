import { useCallback } from 'react'

export interface AuthFetchOptions extends RequestInit {
  requireAuth?: boolean
}

export function useAuthFetch() {
  const authFetch = useCallback(async (url: string, options: AuthFetchOptions = {}) => {
    const { requireAuth = true, headers = {}, ...otherOptions } = options
    
    // Подготавливаем заголовки
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers as Record<string, string>
    }

    // Добавляем авторизационные заголовки если нужно
    if (requireAuth && typeof window !== 'undefined') {
      const telegramId = localStorage.getItem('telegram_id')
      const authToken = localStorage.getItem('auth_token')
      
      if (telegramId) {
        requestHeaders['x-telegram-id'] = telegramId
      }
      
      if (authToken) {
        requestHeaders['x-auth-token'] = authToken
        requestHeaders['authorization'] = `Bearer ${authToken}`
      }
      
      console.log('Auth headers added:', {
        hasTelegramId: !!telegramId,
        hasAuthToken: !!authToken,
        url,
        telegramId: telegramId ? telegramId.substring(0, 3) + '***' : null
      })
      
      // В development режиме, если нет данных авторизации, попробуем их получить
      if (process.env.NODE_ENV === 'development' && !telegramId) {
        console.warn('No auth data in localStorage for dev mode')
      }
    }

    try {
      const response = await fetch(url, {
        ...otherOptions,
        headers: requestHeaders
      })

      // Если получили 401/403 и это авторизованный запрос, выводим понятную ошибку
      if (!response.ok && requireAuth && (response.status === 401 || response.status === 403)) {
        const errorData = await response.json().catch(() => ({ error: 'Auth failed' }))
        console.error('Auth error:', errorData)
        throw new Error('Ошибка авторизации. Перезапустите приложение через Telegram.')
      }

      return response
    } catch (error) {
      console.error('Auth fetch error:', error)
      throw error
    }
  }, [])

  return { authFetch }
} 
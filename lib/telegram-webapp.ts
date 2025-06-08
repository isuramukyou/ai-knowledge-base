// Типы для Telegram WebApp
export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

export interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    query_id?: string
    user?: TelegramUser
    auth_date: number
    hash: string
  }
  colorScheme: "light" | "dark"
  viewportHeight: number
  viewportStableHeight: number
  isExpanded: boolean
  expand: () => void
  close: () => void
  ready: () => void
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    isProgressVisible: boolean
    show: () => void
    hide: () => void
    enable: () => void
    disable: () => void
    showProgress: (leaveActive: boolean) => void
    hideProgress: () => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
    setText: (text: string) => void
    setParams: (params: object) => void
  }
  BackButton: {
    isVisible: boolean
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
  }
  HapticFeedback: {
    impactOccurred: (style: string) => void
    notificationOccurred: (type: string) => void
    selectionChanged: () => void
  }
  onEvent: (eventType: string, eventHandler: () => void) => void
  offEvent: (eventType: string, eventHandler: () => void) => void
  sendData: (data: string) => void
  openLink: (url: string) => void
  openTelegramLink: (url: string) => void
  setHeaderColor: (color: string) => void
  setBackgroundColor: (color: string) => void
}

// Расширение глобального объекта Window
declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

// Функция для получения данных пользователя из Telegram WebApp
export function getTelegramUser(): TelegramUser | null {
  if (typeof window !== "undefined") {
    console.log("Checking Telegram WebApp data:", {
      hasTelegram: !!window.Telegram,
      hasWebApp: !!window.Telegram?.WebApp,
      hasInitDataUnsafe: !!window.Telegram?.WebApp?.initDataUnsafe,
      hasUser: !!window.Telegram?.WebApp?.initDataUnsafe?.user,
      user: window.Telegram?.WebApp?.initDataUnsafe?.user
    })
    
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      return window.Telegram.WebApp.initDataUnsafe.user
    }
  }
  
    // Мок-данные для разработки  
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("Creating mock Telegram user for development")
    // Создаем мок-объект Telegram WebApp только если его еще нет
    if (!window.Telegram) {
      window.Telegram = {
        WebApp: {
          initData: "",
          initDataUnsafe: {
            user: {
              id: parseInt(process.env.NEXT_PUBLIC_DEV_ADMIN_ID || "579218344"),
              username: "dev_admin",
              first_name: "Dev",
              last_name: "Admin",
              photo_url: "https://t.me/i/userpic/320/dev_admin.jpg",
            },
            auth_date: Math.floor(Date.now() / 1000),
            hash: "dev_hash_" + Date.now()
          },
          colorScheme: "light",
          viewportHeight: 800,
          viewportStableHeight: 800,
          isExpanded: true,
          expand: () => {},
          close: () => {},
          ready: () => {},
          MainButton: {
            text: "",
            color: "",
            textColor: "",
            isVisible: false,
            isActive: false,
            isProgressVisible: false,
            show: () => {},
            hide: () => {},
            enable: () => {},
            disable: () => {},
            showProgress: () => {},
            hideProgress: () => {},
            onClick: () => {},
            offClick: () => {},
            setText: () => {},
            setParams: () => {},
          },
          BackButton: {
            isVisible: false,
            show: () => {},
            hide: () => {},
            onClick: () => {},
            offClick: () => {},
          },
          HapticFeedback: {
            impactOccurred: () => {},
            notificationOccurred: () => {},
            selectionChanged: () => {},
          },
          onEvent: () => {},
          offEvent: () => {},
          sendData: () => {},
          openLink: () => {},
          openTelegramLink: () => {},
          setHeaderColor: () => {},
          setBackgroundColor: () => {},
        }
      }
    }
    return window.Telegram.WebApp.initDataUnsafe.user || null
  }
  return null
}

// Функция для получения цветовой схемы из Telegram WebApp
export function getTelegramColorScheme(): "light" | "dark" | null {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    return window.Telegram.WebApp.colorScheme
  }
  return null
}

// Функция для проверки, запущено ли приложение в Telegram WebApp
export function isTelegramWebApp(): boolean {
  return typeof window !== "undefined" && !!window.Telegram?.WebApp
}

// Функция для получения initData для проверки на сервере
export function getTelegramInitData(): string | null {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    return window.Telegram.WebApp.initData
  }
  // Мок-данные для разработки - НЕ ГЕНЕРИРУЕМ ФЕЙКОВЫЙ HASH!
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    const devAdminId = process.env.NEXT_PUBLIC_DEV_ADMIN_ID || "579218344"
    const authDate = Math.floor(Date.now() / 1000)
    
    // Возвращаем initData БЕЗ hash для dev режима
    const params = new URLSearchParams({
      user: JSON.stringify({
        id: parseInt(devAdminId),
        username: "dev_admin", 
        first_name: "Dev",
        last_name: "Admin",
        photo_url: "https://t.me/i/userpic/320/dev_admin.jpg",
      }),
      auth_date: authDate.toString(),
      query_id: "dev_query_" + Date.now()
    })
    
    return params.toString()
  }
  return null
}

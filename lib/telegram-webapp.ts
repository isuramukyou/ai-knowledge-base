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
  if (typeof window !== "undefined" && window.Telegram?.WebApp?.initDataUnsafe?.user) {
    return window.Telegram.WebApp.initDataUnsafe.user
  }
  // Мок-данные для разработки
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    // Создаем мок-объект Telegram WebApp
    window.Telegram = {
      WebApp: {
        initData: "",
        initDataUnsafe: {
          user: {
            id: 579218344,
            username: "isuramukyou",
            first_name: "Islam",
            last_name: "Gasanov",
            photo_url: "https://t.me/i/userpic/320/isuramukyou.jpg",
          },
          auth_date: 1710000000,
          hash: "testhash1234567890"
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
  // Мок-данные для разработки
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    // Сгенерируем тестовый hash (можно любой, так как сервер в dev не проверяет его)
    return new URLSearchParams({
      id: "579218344",
      username: "isuramukyou",
      first_name: "Islam",
      last_name: "Gasanov",
      photo_url: "https://t.me/i/userpic/320/isuramukyou.jpg",
      auth_date: "1710000000",
      hash: "testhash1234567890"
    }).toString()
  }
  return null
}

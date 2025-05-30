"use client"

import { useEffect } from "react"
import Script from "next/script"

export default function TelegramWebAppScript() {
  // Инициализация Telegram WebApp после загрузки скрипта
  useEffect(() => {
    // Проверяем, что мы в Telegram WebApp
    if (window.Telegram?.WebApp) {
      // Расширяем WebApp на весь экран
      window.Telegram.WebApp.expand()

      // Устанавливаем цвет основной кнопки (если нужно)
      // window.Telegram.WebApp.MainButton.setParams({
      //   text: "Поделиться",
      //   color: "#2481cc",
      // })

      // Сообщаем Telegram, что приложение готово
      window.Telegram.WebApp.ready()
    }
  }, [])

  return <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
}

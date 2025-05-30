# Настройка Telegram WebApp (Mini App)

## Шаг 1: Создание бота в Telegram

1. Откройте Telegram и найдите @BotFather
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Сохраните полученный токен (формат: `1234567890:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`)

## Шаг 2: Настройка WebApp в BotFather

1. Отправьте команду `/mybots` в BotFather
2. Выберите вашего бота
3. Нажмите "Bot Settings" > "Menu Button" > "Configure menu button"
4. Введите текст кнопки (например, "База нейросетей")
5. Введите URL вашего приложения (например, `https://yourdomain.com`)

## Шаг 3: Настройка переменных окружения

Добавьте следующие переменные в ваш `.env` файл:

\`\`\`env
TELEGRAM_BOT_TOKEN=1234567890:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
ADMIN_TELEGRAM_ID=123456789
\`\`\`

## Шаг 4: Проверка работы WebApp

1. Откройте вашего бота в Telegram
2. Нажмите на кнопку меню (должна появиться внизу экрана)
3. Приложение должно открыться внутри Telegram

## Особенности работы Telegram WebApp

### Авторизация

Telegram WebApp автоматически передает данные пользователя в приложение. Эти данные включают:

- ID пользователя
- Имя и фамилию
- Имя пользователя (если есть)
- URL фотографии профиля (если доступна)

### Безопасность

Для проверки подлинности данных используется хеш, который нужно проверять на сервере. Это реализовано в файле `app/api/auth/telegram/route.ts`.

### Интеграция с Telegram

Telegram WebApp предоставляет API для взаимодействия с Telegram:

- `Telegram.WebApp.ready()` - сообщает Telegram, что приложение загружено
- `Telegram.WebApp.expand()` - расширяет WebApp на весь экран
- `Telegram.WebApp.MainButton` - управление главной кнопкой внизу экрана
- `Telegram.WebApp.BackButton` - управление кнопкой "Назад"
- `Telegram.WebApp.sendData()` - отправка данных боту

### Цветовая схема

Telegram WebApp автоматически адаптирует цветовую схему в соответствии с настройками Telegram пользователя. Это реализовано в файле `app/page.tsx`.

## Тестирование вне Telegram

Для тестирования вне Telegram WebApp приложение будет работать как обычное веб-приложение, но без автоматической авторизации.

## Дополнительные ресурсы

- [Официальная документация Telegram WebApp](https://core.telegram.org/bots/webapps)
- [Примеры Telegram WebApp](https://github.com/TelegramWebApps)

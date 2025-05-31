# AI Knowledge Base

База знаний о нейросетях и искусственном интеллекте с минималистичным дизайном в стиле Apple.

## Особенности

- 🧠 База данных нейросетей с подробными описаниями
- 📚 Справочная информация и статьи об ИИ
- 🔐 Авторизация через Telegram OAuth
- 👨‍💼 Админ панель для управления контентом
- 🌙 Темная и светлая темы
- 📱 Адаптивный дизайн
- 🐳 Docker-compose для простого развертывания

## Технологии

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL
- **Cache**: Redis
- **Auth**: NextAuth.js с Telegram Provider
- **Deployment**: Docker, Nginx

## Быстрый старт

### Предварительные требования

- Docker и Docker Compose
- Telegram Bot Token (получить у @BotFather)

### Установка

1. Клонируйте репозиторий:
\`\`\`bash
git clone <repository-url>
cd ai-knowledge-base
\`\`\`

2. Создайте файл \`.env.local\`:
\`\`\`env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/ai_knowledge_base
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
ADMIN_TELEGRAM_ID=your-admin-telegram-id
\`\`\`

3. Запустите приложение:
\`\`\`bash
docker-compose up -d
\`\`\`

4. Откройте браузер и перейдите на \`http://localhost:3000\`

## Настройка Telegram Bot

1. Создайте бота у @BotFather в Telegram
2. Получите токен бота
3. Настройте webhook или используйте polling
4. Добавьте токен в переменные окружения

## Структура проекта

\`\`\`
├── app/                    # Next.js App Router
│   ├── page.tsx           # Главная страница
│   ├── admin/             # Админ панель
│   └── api/               # API маршруты
├── components/            # React компоненты
├── lib/                   # Утилиты и конфигурация
├── docker-compose.yml     # Docker конфигурация
├── Dockerfile            # Docker образ приложения
├── init.sql              # Схема базы данных
└── nginx.conf            # Nginx конфигурация
\`\`\`

## Функциональность

### Для пользователей
- Просмотр базы нейросетей и статей
- Авторизация через Telegram
- Создание и редактирование записей
- Поиск и фильтрация контента

### Для администраторов
- Управление пользователями
- Создание категорий
- Модерация контента
- Блокировка пользователей

## API Endpoints

- \`GET /api/models\` - Получить список нейросетей
- \`POST /api/models\` - Создать новую запись о нейросети
- \`GET /api/knowledge\` - Получить статьи базы знаний
- \`POST /api/knowledge\` - Создать новую статью
- \`GET /api/categories\` - Получить категории
- \`POST /api/admin/users\` - Управление пользователями

## Развертывание в продакшене

1. Настройте SSL сертификаты в папке \`ssl/\`
2. Обновите \`nginx.conf\` для HTTPS
3. Установите доменное имя в \`NEXTAUTH_URL\`
4. Используйте сильные пароли для базы данных

## Лицензия

MIT License

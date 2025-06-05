#!/bin/bash

# Скрипт для первоначального деплоя AI Knowledge Base
# Использование: ./deploy.sh

set -e  # Остановка при любой ошибке

echo "🚀 Начало деплоя AI Knowledge Base..."

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не найден! Установите Docker и Docker Compose"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose не найден! Установите Docker Compose V2"
    exit 1
fi

# Проверка наличия .env файла
if [ ! -f ".env" ]; then
    echo "❌ Ошибка: файл .env не найден!"
    echo "Создайте .env файл на основе следующего шаблона:"
    echo ""
    echo "# База данных"
    echo "DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/ai_knowledge_base"
    echo ""
    echo "# Telegram"
    echo "TELEGRAM_BOT_TOKEN=your-telegram-bot-token"
    echo "TELEGRAM_CHAT_ID=your-telegram-chat-id"
    echo "ADMIN_TELEGRAM_ID=your-telegram-admin-id"
    echo ""
    echo "# S3 Storage"
    echo "S3_REGION=your-s3-region"
    echo "S3_ENDPOINT=your-s3-endpoint"
    echo "S3_ACCESS_KEY_ID=your-s3-access-key"
    echo "S3_SECRET_ACCESS_KEY=your-s3-secret-key"
    echo "S3_BUCKET_NAME=your-s3-bucket-name"
    echo "S3_PUBLIC_ENDPOINT=your-s3-public-endpoint"
    echo ""
    exit 1
fi

# Остановка возможно запущенных контейнеров
echo "🛑 Остановка старых контейнеров..."
docker compose down || true

# Удаление старых образов
echo "🧹 Очистка старых образов..."
docker image prune -f || true

# Сборка образов
echo "🔧 Сборка Docker образов..."
docker compose build --no-cache

# Запуск приложения
echo "▶️  Запуск приложения..."
docker compose up -d

# Ожидание запуска
echo "⏳ Ожидание запуска приложения..."
sleep 30

# Проверка статуса
echo "📊 Проверка статуса контейнеров..."
docker compose ps

# Проверка здоровья приложения
echo "🏥 Проверка здоровья приложения..."
MAX_RETRIES=5
RETRY=0

while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Приложение успешно запущено!"
        break
    else
        RETRY=$((RETRY+1))
        echo "⏳ Попытка $RETRY/$MAX_RETRIES... Ожидание 10 секунд"
        sleep 10
    fi
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo "⚠️  Приложение может быть недоступно. Проверьте логи:"
    echo "docker compose logs app"
    echo "docker compose logs telegram-bot"
else
    echo ""
    echo "🎉 Деплoy завершен успешно!"
    echo "🌐 Приложение доступно по адресу: http://localhost:3000"
    echo ""
    echo "📝 Полезные команды:"
    echo "  Просмотр логов: docker compose logs -f"
    echo "  Остановка: docker compose down"
    echo "  Обновление: ./scripts/update.sh"
fi 
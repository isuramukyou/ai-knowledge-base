#!/bin/bash

# Скрипт для обновления AI Knowledge Base
# Использование: ./update.sh

set -e  # Остановка при любой ошибке

echo "Начало обновления AI Knowledge Base..."

# Проверка наличия .env файла
if [ ! -f ".env" ]; then
    echo "❌ Ошибка: файл .env не найден!"
    echo "Создайте .env файл с переменными для S3, Telegram и базы данных"
    exit 1
fi

# Создание резервной копии перед обновлением
echo "Создание резервной копии..."
./scripts/backup.sh

# Получение обновлений из репозитория (если используется git)
if [ -d ".git" ]; then
    echo "Получение обновлений из репозитория..."
    git pull origin main
fi

# Остановка приложения
echo "Остановка приложения..."
docker compose down

# Удаление старых образов для пересборки
echo "Очистка старых образов..."
docker image prune -f

# Обновление образов
echo "Обновление Docker образов..."
docker compose pull postgres redis

# Пересборка приложения
echo "Пересборка приложения..."
docker compose build --no-cache app telegram-bot

# Запуск обновленного приложения
echo "Запуск обновленного приложения..."
docker compose up -d

# Ожидание запуска
echo "Ожидание запуска приложения..."
sleep 20

# Проверка статуса
echo "Проверка статуса контейнеров..."
docker compose ps

# Проверка здоровья приложения
echo "Проверка здоровья приложения..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Приложение успешно запущено!"
else
    echo "⚠️  Приложение может быть недоступно. Проверьте логи:"
    echo "docker compose logs app"
fi

echo "Обновление завершено!"
echo "Проверьте работу приложения: http://localhost:3000"

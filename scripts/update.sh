#!/bin/bash

# Скрипт для обновления AI Knowledge Base
# Использование: ./update.sh

echo "Начало обновления AI Knowledge Base..."

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
docker-compose down

# Обновление образов
echo "Обновление Docker образов..."
docker-compose pull

# Пересборка приложения
echo "Пересборка приложения..."
docker-compose build --no-cache app

# Запуск обновленного приложения
echo "Запуск обновленного приложения..."
docker-compose up -d

# Ожидание запуска
echo "Ожидание запуска приложения..."
sleep 15

# Проверка статуса
echo "Проверка статуса контейнеров..."
docker-compose ps

echo "Обновление завершено!"
echo "Проверьте работу приложения: http://localhost:3000"

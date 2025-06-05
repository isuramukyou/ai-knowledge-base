#!/bin/bash

# Скрипт для восстановления AI Knowledge Base из резервной копии
# Использование: ./restore.sh backup_file_prefix

if [ $# -eq 0 ]; then
    echo "Использование: $0 <backup_file_prefix>"
    echo "Пример: $0 ai_knowledge_backup_20241201_120000"
    exit 1
fi

BACKUP_PREFIX=$1
BACKUP_DIR="/opt/ai-knowledge-base/backups"

echo "Восстановление из резервной копии: $BACKUP_PREFIX"

# Проверка существования файлов резервной копии
if [ ! -f "${BACKUP_DIR}/${BACKUP_PREFIX}.sql" ]; then
    echo "Ошибка: Файл резервной копии базы данных не найден!"
    exit 1
fi

# Остановка приложения
echo "Остановка приложения..."
docker compose down

# Восстановление базы данных
echo "Восстановление базы данных..."
docker compose up -d postgres redis
sleep 10

# Очистка существующей базы данных
docker compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS ai_knowledge_base;"
docker compose exec postgres psql -U postgres -c "CREATE DATABASE ai_knowledge_base;"

# Восстановление данных
docker compose exec -T postgres psql -U postgres ai_knowledge_base < "${BACKUP_DIR}/${BACKUP_PREFIX}.sql"

# Запуск приложения
echo "Запуск приложения..."
docker compose up -d

echo "Восстановление завершено!"
echo "📝 Примечание: Медиа-файлы хранятся в S3 и не восстанавливаются локально"
echo "Проверьте работу приложения: http://localhost:3000"

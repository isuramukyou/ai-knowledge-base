#!/bin/bash

# Скрипт для создания резервной копии AI Knowledge Base
# Использование: ./backup.sh

BACKUP_DIR="/opt/ai-knowledge-base/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="ai_knowledge_backup_${DATE}"

# Создание директории для резервных копий
mkdir -p $BACKUP_DIR

echo "Создание резервной копии базы данных..."

# Резервная копия PostgreSQL
docker-compose exec -T postgres pg_dump -U postgres ai_knowledge_base > "${BACKUP_DIR}/${BACKUP_FILE}.sql"

# Резервная копия загруженных файлов
echo "Создание архива загруженных файлов..."
tar -czf "${BACKUP_DIR}/${BACKUP_FILE}_uploads.tar.gz" uploads/

# Резервная копия конфигурации
echo "Создание резервной копии конфигурации..."
cp .env "${BACKUP_DIR}/${BACKUP_FILE}.env"
cp docker-compose.yml "${BACKUP_DIR}/${BACKUP_FILE}_docker-compose.yml"

echo "Резервная копия создана:"
echo "- База данных: ${BACKUP_DIR}/${BACKUP_FILE}.sql"
echo "- Файлы: ${BACKUP_DIR}/${BACKUP_FILE}_uploads.tar.gz"
echo "- Конфигурация: ${BACKUP_DIR}/${BACKUP_FILE}.env"

# Удаление старых резервных копий (старше 30 дней)
find $BACKUP_DIR -name "ai_knowledge_backup_*" -mtime +30 -delete

echo "Резервное копирование завершено!"

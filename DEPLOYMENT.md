# Инструкция по развертыванию AI Knowledge Base

## Предварительные требования

- Сервер с Ubuntu 20.04+ или CentOS 7+
- Docker и Docker Compose установлены
- Nginx установлен на хостовой машине
- Доменное имя (опционально, но рекомендуется)
- SSL сертификат (рекомендуется)

## Шаг 1: Подготовка сервера

### Установка Docker (если не установлен)

\`\`\`bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Перезагрузка для применения изменений группы
sudo reboot
\`\`\`

### Создание директории проекта

\`\`\`bash
sudo mkdir -p /opt/ai-knowledge-base
sudo chown $USER:$USER /opt/ai-knowledge-base
cd /opt/ai-knowledge-base
\`\`\`

## Шаг 2: Настройка Telegram Bot

### Создание бота

1. Откройте Telegram и найдите @BotFather
2. Отправьте команду \`/newbot\`
3. Следуйте инструкциям для создания бота
4. Сохраните полученный токен (формат: \`1234567890:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\`)
5. Сохраните username бота (без @)

### Получение вашего Telegram ID

1. Откройте Telegram и найдите @userinfobot
2. Отправьте команду \`/start\`
3. Сохраните ваш ID (числовое значение)

## Шаг 3: Загрузка и настройка проекта

### Клонирование репозитория

\`\`\`bash
cd /opt/ai-knowledge-base
# Если у вас есть git репозиторий:
# git clone <your-repository-url> .

# Или скопируйте файлы проекта в эту директорию
\`\`\`

### Создание файла переменных окружения

\`\`\`bash
cp .env.example .env
nano .env
\`\`\`

### Заполните .env файл:

\`\`\`env
# Основные настройки приложения
NODE_ENV=production
PORT=3000

# База данных PostgreSQL (НЕ ИЗМЕНЯЙТЕ, если используете Docker)
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/ai_knowledge_base

# Redis для кэширования (НЕ ИЗМЕНЯЙТЕ, если используете Docker)
REDIS_URL=redis://redis:6379

# NextAuth.js настройки
NEXTAUTH_SECRET=ваш-очень-секретный-ключ-минимум-32-символа-1234567890
NEXTAUTH_URL=https://yourdomain.com

# Telegram Bot настройки
TELEGRAM_BOT_TOKEN=1234567890:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
TELEGRAM_BOT_USERNAME=your_bot_username
ADMIN_TELEGRAM_ID=123456789

# Опциональные настройки
UPLOADS_DIR=/app/uploads
MAX_FILE_SIZE=10485760
\`\`\`

### Важные замечания по переменным:

- **NEXTAUTH_SECRET**: Сгенерируйте случайную строку минимум 32 символа
- **NEXTAUTH_URL**: Замените на ваш реальный домен (https://yourdomain.com)
- **TELEGRAM_BOT_TOKEN**: Токен от @BotFather
- **TELEGRAM_BOT_USERNAME**: Username вашего бота (без @)
- **ADMIN_TELEGRAM_ID**: Ваш Telegram ID (будете администратором)

### Генерация секретного ключа

\`\`\`bash
# Генерация случайного ключа для NEXTAUTH_SECRET
openssl rand -base64 32
\`\`\`

## Шаг 4: Создание директорий и установка прав

\`\`\`bash
# Создание директории для загрузок
mkdir -p uploads
chmod 755 uploads

# Проверка прав на файлы
chmod +x docker-compose.yml
chmod 600 .env
\`\`\`

## Шаг 5: Запуск приложения

### Сборка и запуск контейнеров

\`\`\`bash
# Сборка и запуск в фоновом режиме
docker-compose up -d --build

# Проверка статуса контейнеров
docker-compose ps

# Просмотр логов
docker-compose logs -f app
\`\`\`

### Проверка работы

\`\`\`bash
# Проверка доступности приложения
curl http://localhost:3000

# Проверка базы данных
docker-compose exec postgres psql -U postgres -d ai_knowledge_base -c "SELECT COUNT(*) FROM categories;"
\`\`\`

## Шаг 6: Настройка Nginx

### Создание конфигурации Nginx

\`\`\`bash
sudo nano /etc/nginx/sites-available/ai-knowledge-base
\`\`\`

### Конфигурация для HTTP (базовая):

\`\`\`nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Auth endpoints rate limiting
    location /api/auth/ {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Main application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
\`\`\`

### Активация конфигурации

\`\`\`bash
# Создание символической ссылки
sudo ln -s /etc/nginx/sites-available/ai-knowledge-base /etc/nginx/sites-enabled/

# Проверка конфигурации
sudo nginx -t

# Перезагрузка Nginx
sudo systemctl reload nginx
\`\`\`

## Шаг 7: Настройка SSL (рекомендуется)

### Установка Certbot

\`\`\`bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
\`\`\`

### Получение SSL сертификата

\`\`\`bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
\`\`\`

### Автоматическое обновление сертификата

\`\`\`bash
# Добавление в crontab
sudo crontab -e

# Добавьте эту строку:
0 12 * * * /usr/bin/certbot renew --quiet
\`\`\`

## Шаг 8: Настройка автозапуска

### Создание systemd сервиса

\`\`\`bash
sudo nano /etc/systemd/system/ai-knowledge-base.service
\`\`\`

\`\`\`ini
[Unit]
Description=AI Knowledge Base
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/ai-knowledge-base
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
\`\`\`

### Активация сервиса

\`\`\`bash
sudo systemctl enable ai-knowledge-base.service
sudo systemctl start ai-knowledge-base.service
\`\`\`

## Шаг 9: Мониторинг и обслуживание

### Полезные команды

\`\`\`bash
# Просмотр логов приложения
docker-compose logs -f app

# Просмотр логов базы данных
docker-compose logs -f postgres

# Перезапуск приложения
docker-compose restart app

# Обновление приложения
docker-compose down
docker-compose pull
docker-compose up -d --build

# Резервное копирование базы данных
docker-compose exec postgres pg_dump -U postgres ai_knowledge_base > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление базы данных
docker-compose exec -T postgres psql -U postgres ai_knowledge_base < backup_file.sql
\`\`\`

### Мониторинг ресурсов

\`\`\`bash
# Использование ресурсов контейнерами
docker stats

# Размер томов Docker
docker system df

# Очистка неиспользуемых ресурсов
docker system prune -a
\`\`\`

## Шаг 10: Безопасность

### Настройка файрвола

\`\`\`bash
# UFW (Ubuntu)
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Закрытие прямого доступа к портам приложения
sudo ufw deny 3000
sudo ufw deny 5432
sudo ufw deny 6379
\`\`\`

### Регулярные обновления

\`\`\`bash
# Создание скрипта обновления
nano /opt/ai-knowledge-base/update.sh
\`\`\`

\`\`\`bash
#!/bin/bash
cd /opt/ai-knowledge-base

# Создание резервной копии
docker-compose exec postgres pg_dump -U postgres ai_knowledge_base > backup_$(date +%Y%m%d_%H%M%S).sql

# Обновление приложения
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Проверка статуса
sleep 10
docker-compose ps
\`\`\`

\`\`\`bash
chmod +x /opt/ai-knowledge-base/update.sh
\`\`\`

## Устранение неполадок

### Проблемы с подключением к базе данных

\`\`\`bash
# Проверка статуса PostgreSQL
docker-compose exec postgres pg_isready -U postgres

# Подключение к базе данных
docker-compose exec postgres psql -U postgres ai_knowledge_base
\`\`\`

### Проблемы с авторизацией Telegram

1. Проверьте правильность токена бота
2. Убедитесь, что NEXTAUTH_URL соответствует вашему домену
3. Проверьте, что бот активен и отвечает в Telegram

### Проблемы с производительностью

\`\`\`bash
# Увеличение ресурсов для контейнеров
# Отредактируйте docker-compose.yml и добавьте:
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
\`\`\`

## Заключение

После выполнения всех шагов ваше приложение будет доступно по адресу https://yourdomain.com

Для первого входа:
1. Откройте сайт в браузере
2. Нажмите "Войти через Telegram"
3. Авторизуйтесь через Telegram
4. Вы автоматически получите права администратора (если указали правильный ADMIN_TELEGRAM_ID)

Приложение готово к использованию!

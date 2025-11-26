# Инструкция по развертыванию AlgoTrack

## Production Deployment на Ubuntu Server

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker и Docker Compose
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker

# Установка Nginx (опционально, если не используете Docker для Nginx)
sudo apt install -y nginx
```

### 2. Клонирование проекта

```bash
cd /opt
sudo git clone <repository-url> algotrack
cd algotrack
```

### 3. Настройка переменных окружения

Создайте файлы `.env` для каждого сервиса:

**backend/.env:**
```env
DATABASE_URL="postgresql://algotrack:strong_password_here@postgres:5432/algotrack"
REDIS_URL="redis://redis:6379"
JWT_SECRET="generate-strong-secret-here"
GREEN_API_ID="your-green-api-id"
GREEN_API_TOKEN="your-green-api-token"
PORT=3001
NODE_ENV=production
```

**worker/.env:**
```env
DATABASE_URL="postgresql://algotrack:strong_password_here@postgres:5432/algotrack"
REDIS_URL="redis://redis:6379"
GREEN_API_ID="your-green-api-id"
GREEN_API_TOKEN="your-green-api-token"
PDF_DIR="/app/uploads/pdfs"
```

**frontend/.env:**
```env
VITE_API_URL=https://algoschool.org/api
```

### 4. Настройка Nginx

Создайте конфигурацию `/etc/nginx/sites-available/algotrack`:

```nginx
server {
    listen 80;
    server_name algoschool.org;

    location /algotrack {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируйте конфигурацию:

```bash
sudo ln -s /etc/nginx/sites-available/algotrack /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Настройка SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d algoschool.org
```

### 6. Запуск через Docker Compose

```bash
cd /opt/algotrack
docker-compose -f docker-compose.prod.yml up -d
```

### 7. Инициализация базы данных

```bash
# Войти в контейнер backend
docker exec -it algotrack-backend bash

# Запустить миграции
npx prisma migrate deploy

# Запустить seed (опционально)
npx prisma db seed
```

### 8. Настройка systemd для автозапуска

Создайте `/etc/systemd/system/algotrack.service`:

```ini
[Unit]
Description=AlgoTrack Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/algotrack
ExecStart=/usr/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Активируйте сервис:

```bash
sudo systemctl enable algotrack
sudo systemctl start algotrack
```

### 9. Настройка бэкапов

Создайте скрипт `/opt/algotrack/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/algotrack/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Бэкап базы данных
docker exec algotrack-postgres pg_dump -U algotrack algotrack > $BACKUP_DIR/db_$DATE.sql

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "db_*.sql" -mtime +30 -delete
```

Добавьте в crontab:

```bash
crontab -e
# Добавить строку:
0 2 * * * /opt/algotrack/backup.sh
```

### 10. Мониторинг

Проверка статуса:

```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

Health check:

```bash
curl http://localhost:3001/api/health
```

## Обновление приложения

```bash
cd /opt/algotrack
git pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
docker exec algotrack-backend npx prisma migrate deploy
```

## Troubleshooting

### Проблемы с подключением к БД

```bash
docker exec -it algotrack-postgres psql -U algotrack -d algotrack
```

### Просмотр логов

```bash
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs worker
```

### Перезапуск сервисов

```bash
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml restart worker
```




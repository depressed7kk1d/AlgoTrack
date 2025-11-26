# 🚀 Развертывание AlgoTrack на сервере

## Предварительные требования

- Ubuntu Server 20.04+ (или другой Linux)
- Docker и Docker Compose установлены
- Доступ к серверу по SSH
- Домен настроен на IP сервера (например, algoschool.org)

---

## Шаг 1: Подготовка сервера

### 1.1 Подключитесь к серверу
```bash
ssh user@your-server-ip
```

### 1.2 Установите Docker и Docker Compose (если не установлены)
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo apt install docker-compose-plugin -y

# Проверка установки
docker --version
docker compose version
```

### 1.3 Создайте директорию для проекта
```bash
sudo mkdir -p /opt/algotrack
sudo chown $USER:$USER /opt/algotrack
cd /opt/algotrack
```

---

## Шаг 2: Загрузка проекта на сервер

### Вариант A: Через Git (рекомендуется)
```bash
cd /opt/algotrack
git clone <your-repository-url> .
```

### Вариант B: Через SCP (если нет Git репозитория)
На вашем локальном компьютере:
```powershell
# Из папки AlgoTrack
scp -r * user@your-server-ip:/opt/algotrack/
```

---

## Шаг 3: Настройка переменных окружения

### 3.1 Создайте файл .env в корне проекта
```bash
cd /opt/algotrack
nano .env
```

### 3.2 Добавьте следующие переменные:
```env
# PostgreSQL
POSTGRES_PASSWORD=ваш_сильный_пароль_здесь

# JWT Secret (сгенерируйте случайную строку)
JWT_SECRET=ваш_секретный_jwt_ключ_здесь

# GreenAPI (для WhatsApp интеграции)
GREEN_API_ID=ваш_green_api_id
GREEN_API_TOKEN=ваш_green_api_token
```

**💡 Совет:** Для генерации безопасного JWT_SECRET используйте:
```bash
openssl rand -base64 32
```

Сохраните файл (Ctrl+O, Enter, Ctrl+X)

---

## Шаг 4: Запуск приложения

### 4.1 Соберите и запустите контейнеры
```bash
cd /opt/algotrack
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

### 4.2 Проверьте статус контейнеров
```bash
docker compose -f docker-compose.prod.yml ps
```

Вы должны увидеть 5 контейнеров:
- algotrack-postgres-prod (healthy)
- algotrack-redis-prod (healthy)
- algotrack-backend-prod (running)
- algotrack-worker-prod (running)
- algotrack-frontend-prod (running)

### 4.3 Проверьте логи
```bash
# Все логи
docker compose -f docker-compose.prod.yml logs -f

# Только backend
docker compose -f docker-compose.prod.yml logs -f backend

# Только frontend
docker compose -f docker-compose.prod.yml logs -f frontend
```

---

## Шаг 5: Инициализация базы данных

### 5.1 Подождите 30 секунд для полного запуска сервисов
```bash
sleep 30
```

### 5.2 Примените миграции Prisma
```bash
docker exec algotrack-backend-prod npx prisma migrate deploy
```

### 5.3 Загрузите тестовые данные (опционально)
```bash
docker exec algotrack-backend-prod npx prisma db seed
```

**Тестовый аккаунт:**
- Email: `alexander@algoschool.org`
- Пароль: `teacher123`

---

## Шаг 6: Настройка Nginx (Reverse Proxy)

### 6.1 Установите Nginx
```bash
sudo apt install nginx -y
```

### 6.2 Создайте конфигурацию для AlgoTrack
```bash
sudo nano /etc/nginx/sites-available/algotrack
```

### 6.3 Добавьте следующую конфигурацию:
```nginx
server {
    listen 80;
    server_name algoschool.org www.algoschool.org;

    # Frontend (React SPA)
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Увеличенные таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # PDF файлы
    location /uploads {
        alias /opt/algotrack/worker/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.4 Активируйте конфигурацию
```bash
sudo ln -s /etc/nginx/sites-available/algotrack /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Шаг 7: Настройка SSL (HTTPS)

### 7.1 Установите Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 7.2 Получите SSL сертификат
```bash
sudo certbot --nginx -d algoschool.org -d www.algoschool.org
```

Следуйте инструкциям Certbot. Он автоматически настроит HTTPS.

### 7.3 Проверьте автоматическое обновление сертификата
```bash
sudo certbot renew --dry-run
```

---

## Шаг 8: Настройка автозапуска

### 8.1 Создайте systemd сервис
```bash
sudo nano /etc/systemd/system/algotrack.service
```

### 8.2 Добавьте следующее содержимое:
```ini
[Unit]
Description=AlgoTrack Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/algotrack
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

### 8.3 Активируйте сервис
```bash
sudo systemctl daemon-reload
sudo systemctl enable algotrack
sudo systemctl start algotrack
```

---

## Шаг 9: Настройка бэкапов базы данных

### 9.1 Создайте скрипт бэкапа
```bash
sudo nano /opt/algotrack/backup.sh
```

### 9.2 Добавьте следующее:
```bash
#!/bin/bash
BACKUP_DIR="/opt/algotrack/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Бэкап базы данных
docker exec algotrack-postgres-prod pg_dump -U algotrack algotrack > $BACKUP_DIR/db_$DATE.sql

# Сжатие бэкапа
gzip $BACKUP_DIR/db_$DATE.sql

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_$DATE.sql.gz"
```

### 9.3 Сделайте скрипт исполняемым
```bash
chmod +x /opt/algotrack/backup.sh
```

### 9.4 Настройте автоматический бэкап через cron
```bash
crontab -e
```

Добавьте строку (бэкап каждый день в 2:00 ночи):
```
0 2 * * * /opt/algotrack/backup.sh >> /opt/algotrack/backup.log 2>&1
```

---

## Шаг 10: Проверка работы

### 10.1 Проверьте health endpoint
```bash
curl http://localhost:3001/api/health
```

Должен вернуть: `{"status":"ok"}`

### 10.2 Откройте в браузере
```
https://algoschool.org
```

### 10.3 Войдите с тестовыми данными
- Email: `alexander@algoschool.org`
- Пароль: `teacher123`

---

## Полезные команды

### Просмотр логов
```bash
# Все логи
docker compose -f docker-compose.prod.yml logs -f

# Backend
docker compose -f docker-compose.prod.yml logs -f backend

# Worker
docker compose -f docker-compose.prod.yml logs -f worker
```

### Перезапуск сервисов
```bash
# Все сервисы
docker compose -f docker-compose.prod.yml restart

# Только backend
docker compose -f docker-compose.prod.yml restart backend
```

### Остановка и удаление
```bash
docker compose -f docker-compose.prod.yml down
```

### Обновление приложения
```bash
cd /opt/algotrack
git pull  # если используете Git
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker exec algotrack-backend-prod npx prisma migrate deploy
```

### Prisma Studio (GUI для БД)
```bash
docker exec -it algotrack-backend-prod npx prisma studio
```
Откройте в браузере: http://your-server-ip:5555

---

## Мониторинг

### Проверка использования ресурсов
```bash
docker stats
```

### Проверка дискового пространства
```bash
df -h
du -sh /opt/algotrack/*
```

### Логи Nginx
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### Контейнер не запускается
```bash
docker compose -f docker-compose.prod.yml logs <service-name>
```

### Ошибка подключения к БД
```bash
# Проверьте, что PostgreSQL запущен
docker ps | grep postgres

# Проверьте логи
docker logs algotrack-postgres-prod

# Подключитесь к БД вручную
docker exec -it algotrack-postgres-prod psql -U algotrack -d algotrack
```

### Nginx не работает
```bash
sudo nginx -t  # Проверка конфигурации
sudo systemctl status nginx
sudo systemctl restart nginx
```

### Очистка Docker
```bash
# Удалить неиспользуемые образы
docker system prune -a

# Удалить неиспользуемые volumes
docker volume prune
```

---

## Безопасность

✅ Используйте сильные пароли для POSTGRES_PASSWORD и JWT_SECRET
✅ Настройте firewall (ufw):
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

✅ Регулярно обновляйте систему:
```bash
sudo apt update && sudo apt upgrade -y
```

✅ Настройте fail2ban для защиты от брутфорса:
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

---

## Контакты и поддержка

При возникновении проблем проверьте:
1. Логи контейнеров
2. Логи Nginx
3. Статус сервисов через `docker compose ps`
4. Health endpoint: `curl http://localhost:3001/api/health`

**Готово! 🎉 AlgoTrack развернут на сервере!**


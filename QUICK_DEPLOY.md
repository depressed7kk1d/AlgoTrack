# ⚡ Быстрое развертывание AlgoTrack на сервере

## 📋 Краткая инструкция (5 минут)

### 1️⃣ На сервере: Подготовка
```bash
# Установка Docker (если нет)
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh

# Создание директории
sudo mkdir -p /opt/algotrack && sudo chown $USER:$USER /opt/algotrack
cd /opt/algotrack
```

### 2️⃣ Загрузка проекта

**Вариант A: Через Git**
```bash
git clone <your-repo-url> .
```

**Вариант B: Через SCP с вашего компьютера**
```powershell
# На Windows в папке AlgoTrack
scp -r * user@server-ip:/opt/algotrack/
```

### 3️⃣ Настройка переменных окружения
```bash
cd /opt/algotrack
nano .env
```

Добавьте:
```env
POSTGRES_PASSWORD=ваш_сильный_пароль
JWT_SECRET=$(openssl rand -base64 32)
GREEN_API_ID=
GREEN_API_TOKEN=
```

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

### 4️⃣ Запуск
```bash
# Сборка и запуск
docker compose -f docker-compose.prod.yml up -d --build

# Ждём 30 секунд
sleep 30

# Инициализация БД
docker exec algotrack-backend-prod npx prisma migrate deploy
docker exec algotrack-backend-prod npx prisma db seed
```

### 5️⃣ Проверка
```bash
# Проверка статуса
docker compose -f docker-compose.prod.yml ps

# Health check
curl http://localhost:3001/api/health

# Логи
docker compose -f docker-compose.prod.yml logs -f
```

### 6️⃣ Настройка Nginx (опционально для домена)
```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/algotrack
```

Добавьте конфигурацию из `nginx-config-example.conf`, затем:
```bash
sudo ln -s /etc/nginx/sites-available/algotrack /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 7️⃣ SSL (опционально)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d ваш-домен.com
```

---

## 🎯 Доступ к приложению

- **Frontend**: http://server-ip:5173
- **Backend API**: http://server-ip:3001
- **API Docs**: http://server-ip:3001/api

**Тестовый вход:**
- Email: `alexander@algoschool.org`
- Пароль: `teacher123`

---

## 🔧 Полезные команды

```bash
# Логи
docker compose -f docker-compose.prod.yml logs -f backend

# Перезапуск
docker compose -f docker-compose.prod.yml restart

# Остановка
docker compose -f docker-compose.prod.yml down

# Обновление
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker exec algotrack-backend-prod npx prisma migrate deploy
```

---

## 📚 Полная документация

См. `DEPLOY_SERVER.md` для детальных инструкций по:
- Настройке автозапуска
- Бэкапам БД
- Мониторингу
- Безопасности
- Troubleshooting

---

**Готово! 🚀**


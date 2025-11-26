# 📦 Подготовка проекта для загрузки на сервер

## Шаг 1: Создание архива (на вашем компьютере)

### В PowerShell:
```powershell
cd C:\Users\akbar\AlgoTrack

# Создаём zip архив (исключая ненужные файлы)
Compress-Archive -Path * -DestinationPath AlgoTrack.zip -Force
```

### Или вручную:
1. Откройте папку `C:\Users\akbar\AlgoTrack`
2. Выделите все файлы (Ctrl+A)
3. ПКМ → Отправить → Сжатая ZIP-папка
4. Назовите: `AlgoTrack.zip`

---

## Шаг 2: Загрузка на сервер

### Вариант A: Через SCP (рекомендуется)
```powershell
# Замените YOUR_SERVER_IP на IP вашего сервера
scp AlgoTrack.zip root@YOUR_SERVER_IP:/root/
```

### Вариант B: Через SFTP клиент
- Используйте WinSCP, FileZilla или другой SFTP клиент
- Подключитесь к серверу
- Загрузите `AlgoTrack.zip` в `/root/` или `/opt/`

---

## Шаг 3: На сервере (после подключения)

```bash
# Переход в директорию
cd /root

# Установка unzip (если нет)
sudo apt update
sudo apt install unzip -y

# Создание директории для проекта
sudo mkdir -p /opt/algotrack
cd /opt/algotrack

# Распаковка архива
unzip /root/AlgoTrack.zip -d /opt/algotrack

# Или если архив уже в /opt/algotrack
unzip AlgoTrack.zip

# Удаление архива (опционально)
rm /root/AlgoTrack.zip
```

---

## Шаг 4: Быстрая установка (всё в одной команде)

После распаковки выполните:

```bash
cd /opt/algotrack

# Установка Docker (если нет)
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh

# Создание .env файла
cat > .env << 'EOF'
POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
GREEN_API_ID=
GREEN_API_TOKEN=
EOF

# Запуск
docker compose -f docker-compose.prod.yml up -d --build

# Ожидание запуска
sleep 30

# Инициализация БД
docker exec algotrack-backend-prod npx prisma migrate deploy
docker exec algotrack-backend-prod npx prisma db seed

# Проверка
docker compose -f docker-compose.prod.yml ps
curl http://localhost:3001/api/health
```

---

## 📝 Что понадобится на сервере

1. **IP адрес сервера** - для подключения
2. **Root пароль** или SSH ключ
3. **5-10 минут** на установку

---

## 🎯 После установки

Приложение будет доступно по адресам:
- **Frontend**: http://YOUR_SERVER_IP:5173
- **Backend API**: http://YOUR_SERVER_IP:3001
- **API Docs**: http://YOUR_SERVER_IP:3001/api

**Тестовый вход:**
- Email: `alexander@algoschool.org`
- Пароль: `teacher123`

---

## 🔐 Настройка домена (опционально)

Если у вас есть домен (например, algoschool.org):

```bash
# Установка Nginx
sudo apt install nginx -y

# Копирование конфигурации
sudo cp nginx-config-example.conf /etc/nginx/sites-available/algotrack

# Редактирование (замените algoschool.org на ваш домен)
sudo nano /etc/nginx/sites-available/algotrack

# Активация
sudo ln -s /etc/nginx/sites-available/algotrack /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL сертификат
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d ваш-домен.com
```

---

## ✅ Готово к загрузке!

Когда сервер будет готов:
1. Получите IP адрес и пароль
2. Загрузите AlgoTrack.zip
3. Подключите меня к серверу
4. Я помогу с установкой! 🚀


# Запуск AlgoTrack без Docker (локально)

## Вариант 1: С Docker (рекомендуется)

### Шаг 1: Запустите Docker Desktop
Убедитесь, что Docker Desktop запущен и работает.

### Шаг 2: Запустите проект
```powershell
# В PowerShell
.\start.ps1

# Или вручную:
docker-compose up -d
```

### Шаг 3: Инициализируйте БД
```powershell
docker exec algotrack-backend npx prisma migrate dev --name init
docker exec algotrack-backend npx prisma db seed
```

---

## Вариант 2: Без Docker (локально)

Если Docker не запущен, можно запустить локально:

### Требования
- Node.js 18+
- PostgreSQL 14+ (установлен локально или через Docker только для БД)
- Redis 7+ (установлен локально или через Docker только для Redis)

### Шаг 1: Установите зависимости

```powershell
# Backend
cd backend
npm install
npx prisma generate

# Frontend
cd ../frontend
npm install

# Worker
cd ../worker
npm install
npx prisma generate
```

### Шаг 2: Настройте PostgreSQL и Redis

**Вариант A: Только БД через Docker**
```powershell
# Запустите только PostgreSQL и Redis
docker run -d --name algotrack-postgres -e POSTGRES_USER=algotrack -e POSTGRES_PASSWORD=algotrack_password -e POSTGRES_DB=algotrack -p 5432:5432 postgres:15-alpine
docker run -d --name algotrack-redis -p 6379:6379 redis:7-alpine
```

**Вариант B: Локально установленные**
- Убедитесь, что PostgreSQL и Redis запущены локально

### Шаг 3: Настройте переменные окружения

Создайте `backend/.env`:
```env
DATABASE_URL="postgresql://algotrack:algotrack_password@localhost:5432/algotrack"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="test-secret-key-change-in-production"
GREEN_API_ID=""
GREEN_API_TOKEN=""
PORT=3001
NODE_ENV=development
```

Создайте `worker/.env`:
```env
DATABASE_URL="postgresql://algotrack:algotrack_password@localhost:5432/algotrack"
REDIS_URL="redis://localhost:6379"
GREEN_API_ID=""
GREEN_API_TOKEN=""
PDF_DIR="./uploads/pdfs"
```

Создайте `frontend/.env`:
```env
VITE_API_URL=http://localhost:3001
```

### Шаг 4: Инициализируйте БД

```powershell
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### Шаг 5: Запустите сервисы

Откройте 3 терминала:

**Терминал 1 - Backend:**
```powershell
cd backend
npm run start:dev
```

**Терминал 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

**Терминал 3 - Worker:**
```powershell
cd worker
npm run start:dev
```

### Шаг 6: Откройте приложение

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api

### Тестовые данные для входа:
- Email: `alexander@algoschool.org`
- Пароль: `teacher123`

---

## Быстрый запуск только БД через Docker

Если хотите запустить только PostgreSQL и Redis через Docker, а остальное локально:

```powershell
# Запуск только БД и Redis
docker run -d --name algotrack-postgres -e POSTGRES_USER=algotrack -e POSTGRES_PASSWORD=algotrack_password -e POSTGRES_DB=algotrack -p 5432:5432 postgres:15-alpine
docker run -d --name algotrack-redis -p 6379:6379 redis:7-alpine

# Затем выполните шаги 3-6 из варианта 2
```




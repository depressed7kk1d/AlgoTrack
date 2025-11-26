# Скрипт для запуска AlgoTrack локально (только БД через Docker)

Write-Host "🚀 Запуск AlgoTrack (локальный режим)..." -ForegroundColor Green

# Проверка Node.js
Write-Host "`n📦 Проверка Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js установлен: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js не установлен. Установите Node.js 18+" -ForegroundColor Red
    exit 1
}

# Запуск только БД и Redis
Write-Host "`n🐳 Запуск PostgreSQL и Redis..." -ForegroundColor Yellow
docker-compose -f docker-compose.db-only.yml up -d

Write-Host "`n⏳ Ожидание запуска БД (10 секунд)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Проверка установки зависимостей
Write-Host "`n📦 Проверка зависимостей..." -ForegroundColor Yellow

if (-not (Test-Path "backend/node_modules")) {
    Write-Host "Установка зависимостей backend..." -ForegroundColor Cyan
    Set-Location backend
    npm install
    Set-Location ..
}

if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "Установка зависимостей frontend..." -ForegroundColor Cyan
    Set-Location frontend
    npm install
    Set-Location ..
}

if (-not (Test-Path "worker/node_modules")) {
    Write-Host "Установка зависимостей worker..." -ForegroundColor Cyan
    Set-Location worker
    npm install
    Set-Location ..
}

# Генерация Prisma Client
Write-Host "`n🔧 Генерация Prisma Client..." -ForegroundColor Yellow
Set-Location backend
npx prisma generate
Set-Location ../worker
npx prisma generate
Set-Location ..

# Создание .env файлов если их нет
Write-Host "`n⚙️  Проверка .env файлов..." -ForegroundColor Yellow

if (-not (Test-Path "backend/.env")) {
    Write-Host "Создание backend/.env..." -ForegroundColor Cyan
    @"
DATABASE_URL="postgresql://algotrack:algotrack_password@localhost:5432/algotrack"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="test-secret-key-change-in-production"
GREEN_API_ID=""
GREEN_API_TOKEN=""
PORT=3001
NODE_ENV=development
"@ | Out-File -FilePath "backend/.env" -Encoding utf8
}

if (-not (Test-Path "worker/.env")) {
    Write-Host "Создание worker/.env..." -ForegroundColor Cyan
    @"
DATABASE_URL="postgresql://algotrack:algotrack_password@localhost:5432/algotrack"
REDIS_URL="redis://localhost:6379"
GREEN_API_ID=""
GREEN_API_TOKEN=""
PDF_DIR="./uploads/pdfs"
"@ | Out-File -FilePath "worker/.env" -Encoding utf8
}

if (-not (Test-Path "frontend/.env")) {
    Write-Host "Создание frontend/.env..." -ForegroundColor Cyan
    @"
VITE_API_URL=http://localhost:3001
"@ | Out-File -FilePath "frontend/.env" -Encoding utf8
}

# Инициализация БД
Write-Host "`n🗄️  Инициализация базы данных..." -ForegroundColor Yellow
Set-Location backend
Write-Host "Выполнение миграций..." -ForegroundColor Cyan
npx prisma migrate dev --name init
Write-Host "Заполнение тестовыми данными..." -ForegroundColor Cyan
npx prisma db seed
Set-Location ..

Write-Host "`n✅ Готово к запуску!" -ForegroundColor Green
Write-Host "`n📱 Запустите сервисы в отдельных терминалах:" -ForegroundColor Cyan
Write-Host "`nТерминал 1 - Backend:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm run start:dev" -ForegroundColor Gray
Write-Host "`nТерминал 2 - Frontend:" -ForegroundColor Yellow
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host "`nТерминал 3 - Worker (опционально):" -ForegroundColor Yellow
Write-Host "   cd worker" -ForegroundColor Gray
Write-Host "   npm run start:dev" -ForegroundColor Gray
Write-Host "`n🔑 Тестовые данные для входа:" -ForegroundColor Cyan
Write-Host "   Email:    alexander@algoschool.org" -ForegroundColor White
Write-Host "   Пароль:   teacher123" -ForegroundColor White
Write-Host "`n🛑 Остановка БД:" -ForegroundColor Yellow
Write-Host "   docker-compose -f docker-compose.db-only.yml down" -ForegroundColor Gray




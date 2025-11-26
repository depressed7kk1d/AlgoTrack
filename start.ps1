# Скрипт для быстрого запуска AlgoTrack (Windows PowerShell)

Write-Host "🚀 Запуск AlgoTrack..." -ForegroundColor Green

# Проверка Docker
Write-Host "`n📦 Проверка Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    docker-compose --version | Out-Null
    Write-Host "✅ Docker установлен" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker не установлен. Установите Docker Desktop." -ForegroundColor Red
    exit 1
}

# Запуск через Docker Compose
Write-Host "`n🐳 Запуск контейнеров..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "`n⏳ Ожидание запуска сервисов (30 секунд)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Инициализация БД
Write-Host "`n🗄️  Инициализация базы данных..." -ForegroundColor Yellow
Write-Host "Выполнение миграций..." -ForegroundColor Cyan
docker exec algotrack-backend npx prisma migrate dev --name init 2>&1 | Out-Null

Write-Host "Заполнение тестовыми данными..." -ForegroundColor Cyan
docker exec algotrack-backend npx prisma db seed 2>&1 | Out-Null

Write-Host "`n✅ Проект запущен!" -ForegroundColor Green
Write-Host "`n📱 Доступные URL:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:   http://localhost:3001" -ForegroundColor White
Write-Host "   API Docs:  http://localhost:3001/api" -ForegroundColor White
Write-Host "   Health:    http://localhost:3001/api/health" -ForegroundColor White

Write-Host "`n🔑 Тестовые данные для входа:" -ForegroundColor Cyan
Write-Host "   Email:    alexander@algoschool.org" -ForegroundColor White
Write-Host "   Пароль:   teacher123" -ForegroundColor White

Write-Host "`n📊 Просмотр логов:" -ForegroundColor Yellow
Write-Host "   docker-compose logs -f" -ForegroundColor Gray
Write-Host "`n🛑 Остановка:" -ForegroundColor Yellow
Write-Host "   docker-compose down" -ForegroundColor Gray




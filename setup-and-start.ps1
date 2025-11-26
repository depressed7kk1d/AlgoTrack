# Полный скрипт настройки и запуска AlgoTrack

Write-Host "🚀 AlgoTrack - Полная настройка и запуск" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка Docker
Write-Host "🔍 Проверка Docker..." -ForegroundColor Yellow
try {
    $dockerCheck = docker ps 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker не запущен! Запустите Docker Desktop и попробуйте снова." -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Docker работает" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker не установлен или не запущен!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Создание .env файлов
Write-Host "🔧 Создание .env файлов..." -ForegroundColor Yellow
& .\setup-env.ps1

Write-Host ""

# Запуск Docker Compose
Write-Host "🐳 Запуск Docker Compose..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при запуске Docker Compose!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⏳ Ожидание запуска сервисов (30 секунд)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""

# Проверка статуса контейнеров
Write-Host "📊 Статус контейнеров:" -ForegroundColor Yellow
docker-compose ps

Write-Host ""

# Инициализация базы данных
Write-Host "🗄️  Инициализация базы данных..." -ForegroundColor Yellow

Write-Host "   Запуск миграций..." -ForegroundColor Cyan
docker exec algotrack-backend npx prisma migrate dev --name init

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Миграции выполнены" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Миграции уже применены или произошла ошибка" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "   Загрузка тестовых данных..." -ForegroundColor Cyan
docker exec algotrack-backend npx prisma db seed

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Тестовые данные загружены" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Данные уже загружены или произошла ошибка" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ AlgoTrack успешно запущен!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Доступ к приложению:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:   http://localhost:3001" -ForegroundColor White
Write-Host "   API Docs:  http://localhost:3001/api" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Тестовый аккаунт:" -ForegroundColor Cyan
Write-Host "   Email:     alexander@algoschool.org" -ForegroundColor White
Write-Host "   Пароль:    teacher123" -ForegroundColor White
Write-Host ""
Write-Host "📝 Полезные команды:" -ForegroundColor Cyan
Write-Host "   Остановить:        docker-compose down" -ForegroundColor White
Write-Host "   Логи:              docker-compose logs -f" -ForegroundColor White
Write-Host "   Перезапустить:     docker-compose restart" -ForegroundColor White
Write-Host "   Prisma Studio:     docker exec -it algotrack-backend npx prisma studio" -ForegroundColor White
Write-Host ""


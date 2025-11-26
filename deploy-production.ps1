# Скрипт для развертывания AlgoTrack в production режиме

param(
    [string]$Domain = "algoschool.org",
    [switch]$SkipEnvCheck = $false
)

Write-Host "🚀 AlgoTrack - Production Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Проверка Docker
Write-Host "🔍 Проверка Docker..." -ForegroundColor Yellow
try {
    $dockerCheck = docker ps 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker не запущен!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Docker работает" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker не установлен!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Проверка .env файла
if (-not $SkipEnvCheck) {
    Write-Host "🔍 Проверка .env файла..." -ForegroundColor Yellow
    if (-not (Test-Path ".env")) {
        Write-Host "❌ Файл .env не найден!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Создайте файл .env со следующими переменными:" -ForegroundColor Yellow
        Write-Host "POSTGRES_PASSWORD=<сильный_пароль>" -ForegroundColor White
        Write-Host "JWT_SECRET=<секретный_ключ>" -ForegroundColor White
        Write-Host "GREEN_API_ID=<ваш_green_api_id>" -ForegroundColor White
        Write-Host "GREEN_API_TOKEN=<ваш_green_api_token>" -ForegroundColor White
        Write-Host ""
        exit 1
    }
    
    # Проверка критичных переменных
    $envContent = Get-Content .env -Raw
    $warnings = @()
    
    if ($envContent -match "POSTGRES_PASSWORD=algotrack_strong_password_2024") {
        $warnings += "⚠️  Измените POSTGRES_PASSWORD на более безопасный"
    }
    if ($envContent -match "JWT_SECRET=algotrack-production-jwt-secret-key-change-this") {
        $warnings += "⚠️  Измените JWT_SECRET на уникальный секретный ключ"
    }
    if ($envContent -match "GREEN_API_ID=\s*$") {
        $warnings += "⚠️  GREEN_API_ID не установлен (WhatsApp интеграция не будет работать)"
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "⚠️  Предупреждения безопасности:" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "   $warning" -ForegroundColor Yellow
        }
        Write-Host ""
        $continue = Read-Host "Продолжить? (y/n)"
        if ($continue -ne "y") {
            exit 0
        }
    } else {
        Write-Host "✅ .env файл настроен" -ForegroundColor Green
    }
}

Write-Host ""

# Остановка существующих контейнеров
Write-Host "🛑 Остановка существующих контейнеров..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml down

Write-Host ""

# Сборка образов
Write-Host "🔨 Сборка Docker образов..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml build --no-cache

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при сборке образов!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Запуск контейнеров
Write-Host "🚀 Запуск контейнеров..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при запуске контейнеров!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⏳ Ожидание запуска сервисов (30 секунд)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""

# Проверка статуса
Write-Host "📊 Статус контейнеров:" -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml ps

Write-Host ""

# Инициализация БД
Write-Host "🗄️  Инициализация базы данных..." -ForegroundColor Yellow

Write-Host "   Применение миграций..." -ForegroundColor Cyan
docker exec algotrack-backend-prod npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Миграции применены" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Ошибка при применении миграций" -ForegroundColor Yellow
}

Write-Host ""
$seedData = Read-Host "Загрузить тестовые данные? (y/n)"
if ($seedData -eq "y") {
    Write-Host "   Загрузка тестовых данных..." -ForegroundColor Cyan
    docker exec algotrack-backend-prod npx prisma db seed
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ Production развертывание завершено!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Доступ к приложению:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:   http://localhost:3001" -ForegroundColor White
Write-Host "   API Docs:  http://localhost:3001/api" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Следующие шаги:" -ForegroundColor Yellow
Write-Host "   1. Настройте Nginx reverse proxy для домена $Domain" -ForegroundColor White
Write-Host "   2. Установите SSL сертификат (Let's Encrypt)" -ForegroundColor White
Write-Host "   3. Настройте автоматические бэкапы БД" -ForegroundColor White
Write-Host "   4. Настройте мониторинг и логирование" -ForegroundColor White
Write-Host ""
Write-Host "📝 Полезные команды:" -ForegroundColor Cyan
Write-Host "   Логи:              docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor White
Write-Host "   Остановить:        docker-compose -f docker-compose.prod.yml down" -ForegroundColor White
Write-Host "   Перезапустить:     docker-compose -f docker-compose.prod.yml restart" -ForegroundColor White
Write-Host "   Health check:      curl http://localhost:3001/api/health" -ForegroundColor White
Write-Host ""


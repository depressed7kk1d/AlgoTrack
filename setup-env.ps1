# Скрипт для создания .env файлов для локального запуска

Write-Host "🔧 Настройка окружения AlgoTrack..." -ForegroundColor Cyan

# Backend .env
$backendEnv = @"
DATABASE_URL="postgresql://algotrack:algotrack_password@localhost:5432/algotrack"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="algotrack-dev-secret-key-change-in-production"
GREEN_API_ID=""
GREEN_API_TOKEN=""
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
"@

if (-not (Test-Path "backend\.env")) {
    $backendEnv | Out-File -FilePath "backend\.env" -Encoding UTF8
    Write-Host "✅ Создан backend/.env" -ForegroundColor Green
} else {
    Write-Host "⚠️  backend/.env уже существует" -ForegroundColor Yellow
}

# Frontend .env
$frontendEnv = @"
VITE_API_URL=http://localhost:3001
"@

if (-not (Test-Path "frontend\.env")) {
    $frontendEnv | Out-File -FilePath "frontend\.env" -Encoding UTF8
    Write-Host "✅ Создан frontend/.env" -ForegroundColor Green
} else {
    Write-Host "⚠️  frontend/.env уже существует" -ForegroundColor Yellow
}

# Worker .env
$workerEnv = @"
DATABASE_URL="postgresql://algotrack:algotrack_password@localhost:5432/algotrack"
REDIS_URL="redis://localhost:6379"
GREEN_API_ID=""
GREEN_API_TOKEN=""
PDF_DIR="./uploads/pdfs"
NODE_ENV=development
"@

if (-not (Test-Path "worker\.env")) {
    $workerEnv | Out-File -FilePath "worker\.env" -Encoding UTF8
    Write-Host "✅ Создан worker/.env" -ForegroundColor Green
} else {
    Write-Host "⚠️  worker/.env уже существует" -ForegroundColor Yellow
}

# Root .env для production
$rootEnv = @"
# Production environment variables for docker-compose.prod.yml
POSTGRES_PASSWORD=algotrack_strong_password_2024
JWT_SECRET=algotrack-production-jwt-secret-key-change-this
GREEN_API_ID=
GREEN_API_TOKEN=
"@

if (-not (Test-Path ".env")) {
    $rootEnv | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ Создан .env (для production)" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env уже существует" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Настройка завершена!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Примечание:" -ForegroundColor Cyan
Write-Host "   - Для работы WhatsApp интеграции добавьте GREEN_API_ID и GREEN_API_TOKEN"
Write-Host "   - Для production измените JWT_SECRET и POSTGRES_PASSWORD на более безопасные"
Write-Host ""


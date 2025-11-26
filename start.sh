#!/bin/bash
# Скрипт для быстрого запуска AlgoTrack (Linux/Mac)

echo "🚀 Запуск AlgoTrack..."

# Проверка Docker
echo ""
echo "📦 Проверка Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker."
    exit 1
fi
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose не установлен. Установите docker-compose."
    exit 1
fi
echo "✅ Docker установлен"

# Запуск через Docker Compose
echo ""
echo "🐳 Запуск контейнеров..."
docker-compose up -d

echo ""
echo "⏳ Ожидание запуска сервисов (30 секунд)..."
sleep 30

# Инициализация БД
echo ""
echo "🗄️  Инициализация базы данных..."
echo "Выполнение миграций..."
docker exec algotrack-backend npx prisma migrate dev --name init

echo "Заполнение тестовыми данными..."
docker exec algotrack-backend npx prisma db seed

echo ""
echo "✅ Проект запущен!"
echo ""
echo "📱 Доступные URL:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:3001"
echo "   API Docs:  http://localhost:3001/api"
echo "   Health:    http://localhost:3001/api/health"
echo ""
echo "🔑 Тестовые данные для входа:"
echo "   Email:    alexander@algoschool.org"
echo "   Пароль:   teacher123"
echo ""
echo "📊 Просмотр логов:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Остановка:"
echo "   docker-compose down"




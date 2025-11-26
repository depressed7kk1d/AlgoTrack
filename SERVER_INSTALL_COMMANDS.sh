#!/bin/bash
# Скрипт автоматической установки AlgoTrack на сервере
# Ubuntu 22.04

set -e  # Остановка при ошибке

echo "🚀 Установка AlgoTrack на сервер..."
echo "===================================="
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Запустите скрипт с правами root: sudo bash SERVER_INSTALL_COMMANDS.sh${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Шаг 1: Обновление системы${NC}"
apt update && apt upgrade -y

echo ""
echo -e "${YELLOW}🐳 Шаг 2: Установка Docker${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker установлен${NC}"
else
    echo -e "${GREEN}✅ Docker уже установлен${NC}"
fi

echo ""
echo -e "${YELLOW}📁 Шаг 3: Создание директории проекта${NC}"
mkdir -p /opt/algotrack
cd /opt/algotrack
echo -e "${GREEN}✅ Директория создана: /opt/algotrack${NC}"

echo ""
echo -e "${YELLOW}📦 Шаг 4: Распаковка проекта${NC}"
if [ -f "/root/AlgoTrack.zip" ]; then
    apt install unzip -y
    unzip -o /root/AlgoTrack.zip -d /opt/algotrack
    echo -e "${GREEN}✅ Проект распакован${NC}"
elif [ -f "/opt/algotrack/AlgoTrack.zip" ]; then
    apt install unzip -y
    unzip -o AlgoTrack.zip
    rm AlgoTrack.zip
    echo -e "${GREEN}✅ Проект распакован${NC}"
else
    echo -e "${RED}❌ Файл AlgoTrack.zip не найден!${NC}"
    echo "Загрузите файл в /root/ или /opt/algotrack/"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔐 Шаг 5: Создание .env файла${NC}"
if [ ! -f ".env" ]; then
    POSTGRES_PASS=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 32)
    
    cat > .env << EOF
POSTGRES_PASSWORD=${POSTGRES_PASS}
JWT_SECRET=${JWT_SECRET}
GREEN_API_ID=
GREEN_API_TOKEN=
EOF
    echo -e "${GREEN}✅ Файл .env создан${NC}"
    echo -e "${YELLOW}📝 Сохраните эти данные:${NC}"
    echo "POSTGRES_PASSWORD=${POSTGRES_PASS}"
    echo "JWT_SECRET=${JWT_SECRET}"
else
    echo -e "${GREEN}✅ Файл .env уже существует${NC}"
fi

echo ""
echo -e "${YELLOW}🐳 Шаг 6: Сборка и запуск Docker контейнеров${NC}"
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

echo ""
echo -e "${YELLOW}⏳ Ожидание запуска сервисов (30 секунд)...${NC}"
sleep 30

echo ""
echo -e "${YELLOW}🗄️  Шаг 7: Инициализация базы данных${NC}"
docker exec algotrack-backend-prod npx prisma migrate deploy
echo -e "${GREEN}✅ Миграции применены${NC}"

echo ""
echo -e "${YELLOW}📊 Загрузка тестовых данных${NC}"
docker exec algotrack-backend-prod npx prisma db seed
echo -e "${GREEN}✅ Тестовые данные загружены${NC}"

echo ""
echo -e "${YELLOW}📊 Шаг 8: Проверка статуса${NC}"
docker compose -f docker-compose.prod.yml ps

echo ""
echo -e "${YELLOW}🏥 Health Check${NC}"
sleep 5
curl -s http://localhost:3001/api/health || echo -e "${RED}Backend еще запускается...${NC}"

echo ""
echo "===================================="
echo -e "${GREEN}✅ Установка завершена!${NC}"
echo "===================================="
echo ""
echo -e "${YELLOW}🌐 Доступ к приложению:${NC}"
echo "   Frontend:  http://$(curl -s ifconfig.me):5173"
echo "   Backend:   http://$(curl -s ifconfig.me):3001"
echo "   API Docs:  http://$(curl -s ifconfig.me):3001/api"
echo ""
echo -e "${YELLOW}🔑 Тестовый вход:${NC}"
echo "   Email:     alexander@algoschool.org"
echo "   Пароль:    teacher123"
echo ""
echo -e "${YELLOW}📝 Полезные команды:${NC}"
echo "   Логи:      docker compose -f docker-compose.prod.yml logs -f"
echo "   Рестарт:   docker compose -f docker-compose.prod.yml restart"
echo "   Остановка: docker compose -f docker-compose.prod.yml down"
echo ""
echo -e "${GREEN}🎉 Готово! Приложение запущено!${NC}"


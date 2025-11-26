# Быстрый старт AlgoTrack

## Шаг 1: Клонирование и настройка

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd AlgoTrack

# Создайте .env файлы
cp backend/.env.example backend/.env
cp worker/.env.example worker/.env
```

## Шаг 2: Настройка переменных окружения

Отредактируйте `backend/.env`:

```env
DATABASE_URL="postgresql://algotrack:algotrack_password@localhost:5432/algotrack"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key-change-in-production"
GREEN_API_ID="your-green-api-id"
GREEN_API_TOKEN="your-green-api-token"
PORT=3001
NODE_ENV=development
```

Отредактируйте `worker/.env`:

```env
DATABASE_URL="postgresql://algotrack:algotrack_password@localhost:5432/algotrack"
REDIS_URL="redis://localhost:6379"
GREEN_API_ID="your-green-api-id"
GREEN_API_TOKEN="your-green-api-token"
PDF_DIR="./uploads/pdfs"
```

## Шаг 3: Запуск через Docker Compose

```bash
# Запустить все сервисы
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановить
docker-compose down
```

## Шаг 4: Инициализация базы данных

```bash
# Войти в контейнер backend
docker exec -it algotrack-backend bash

# Запустить миграции
npx prisma migrate dev

# Запустить seed (создаст тестовые данные)
npx prisma db seed
```

## Шаг 5: Доступ к приложению

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **API Docs (Swagger):** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

## Шаг 6: Тестовый вход

Используйте тестовые данные из seed:

- **Email:** alexander@algoschool.org
- **Пароль:** teacher123

Или для администратора:

- **Email:** admin@algoschool.org
- **Пароль:** admin123

## Шаг 7: Проверка работы

1. Войдите в систему через frontend
2. Откройте класс "Нейросети - Группа А"
3. Выберите ученика и создайте карточку
4. Проверьте генерацию сводки

## Ручной запуск (без Docker)

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Worker

```bash
cd worker
npm install
# Скопируйте schema.prisma из backend/prisma в worker/prisma
cp ../backend/prisma/schema.prisma ./prisma/schema.prisma
npx prisma generate
npm run start:dev
```

## Troubleshooting

### Проблема: База данных не подключается

```bash
# Проверьте статус PostgreSQL
docker-compose ps postgres

# Проверьте логи
docker-compose logs postgres
```

### Проблема: Redis не работает

```bash
# Проверьте статус Redis
docker-compose ps redis

# Проверьте подключение
docker exec -it algotrack-redis redis-cli ping
```

### Проблема: Worker не обрабатывает задачи

```bash
# Проверьте логи worker
docker-compose logs worker

# Убедитесь, что Redis доступен
docker exec -it algotrack-worker sh -c "echo $REDIS_URL"
```

### Проблема: GreenAPI не отправляет сообщения

1. Проверьте правильность `GREEN_API_ID` и `GREEN_API_TOKEN`
2. Убедитесь, что GreenAPI аккаунт активен
3. Проверьте формат `chatId` (для групп используйте формат `79991234567@g.us`)

## Следующие шаги

1. Настройте GreenAPI для отправки WhatsApp сообщений
2. Изучите API документацию: http://localhost:3001/api
3. Импортируйте Postman collection: `docs/postman/AlgoTrack.postman_collection.json`
4. Прочитайте полную документацию: `docs/TECHNICAL_SPEC.md`

## Полезные команды

```bash
# Просмотр всех контейнеров
docker-compose ps

# Перезапуск сервиса
docker-compose restart backend

# Просмотр логов конкретного сервиса
docker-compose logs -f backend

# Остановка всех сервисов
docker-compose down

# Остановка с удалением volumes (ОСТОРОЖНО: удалит данные БД)
docker-compose down -v

# Пересборка образов
docker-compose build --no-cache
```




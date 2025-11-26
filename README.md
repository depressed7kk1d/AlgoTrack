# AlgoTrack - Платформа автоматизации отчетов для школы программирования "Алгоритмика"

## Описание проекта

Платформа для автоматизации отправки ежедневных/еженедельных/модульных отчетов (ОС) для школы программирования «Алгоритмика».

**Домен:** algoschool.org/algotrack

## Основные возможности

- ✅ Быстрая отметка прогресса учеников после каждого урока (1-2 мин/ученик)
- ✅ Автоматическая генерация и отправка сводок в WhatsApp группы
- ✅ Сохранение индивидуальных карточек прогресса для каждого ученика
- ✅ Автоматическое формирование итоговой ОС по модулю (настраиваемо, по умолчанию через 4 урока)
- ✅ Личные ссылки для родителей с визуальным кабинетом прогресса
- ✅ Учет типа родителя (спокойный/вспыльчивый/требовательный) для персонализации сообщений
- ✅ Масштабируемость на ~50 одновременных учителей

## Технологический стек

### Frontend
- React 18+ (Vite)
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query (React Query)
- React Hook Form

### Backend
- Node.js
- TypeScript
- NestJS
- PostgreSQL
- Prisma ORM
- Redis + BullMQ

### Интеграции
- GreenAPI (WhatsApp)
- Puppeteer (PDF генерация)

### DevOps
- Docker & Docker Compose
- GitHub Actions (CI/CD)

## Структура проекта

```
algotrack/
├── frontend/          # React приложение
├── backend/           # NestJS API
├── worker/            # BullMQ worker для асинхронных задач
├── docker-compose.yml # Docker конфигурация
└── README.md
```

## Быстрый старт

### Требования
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+ (или через Docker)
- Redis 7+ (или через Docker)

### Локальная разработка

1. Клонируйте репозиторий
```bash
git clone <repository-url>
cd AlgoTrack
```

2. Настройте переменные окружения

Создайте файлы `.env` в `backend/` и `frontend/`:

**backend/.env:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/algotrack"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
GREEN_API_ID="your-green-api-id"
GREEN_API_TOKEN="your-green-api-token"
PORT=3001
```

**frontend/.env:**
```env
VITE_API_URL=http://localhost:3001
```

3. Запустите через Docker Compose
```bash
docker-compose up -d
```

Или запустите вручную:

```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# Frontend (в другом терминале)
cd frontend
npm install
npm run dev

# Worker (в третьем терминале)
cd worker
npm install
npm run start:dev
```

4. Откройте приложение
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api

## Роли пользователей

### Администратор
- Настройка шаблонов сообщений
- Управление группами и учителями
- Управление типами родителей
- Просмотр логов и статистики
- Управление интеграциями (GreenAPI)
- Экспорт отчетов

### Учитель
- Доступ к своим классам
- Форма быстрой отметки карточек учеников
- Отправка/правка сводки в группу
- Просмотр и правка индивидуальных карточек до отправки ОС

### Родитель
- Личная защищенная ссылка на прогресс ребенка (read-only)
- Получение сообщений в WhatsApp

## API Endpoints

Основные endpoints:

- `POST /api/auth/login` - Авторизация
- `GET /api/classes` - Список классов
- `GET /api/classes/:id/students` - Ученики класса
- `POST /api/cards` - Создание карточки ученика
- `PUT /api/cards/:id` - Редактирование карточки
- `POST /api/messages/generate-summary` - Генерация сводки класса
- `POST /api/messages/send` - Отправка сообщения
- `GET /api/reports/:studentId` - Отчеты ученика
- `GET /api/parent/:token` - Публичная страница родителя

Полная документация доступна в Postman collection: `docs/postman/AlgoTrack.postman_collection.json`

## База данных

Схема БД создается через Prisma миграции:

```bash
cd backend
npx prisma migrate dev
npx prisma studio  # Визуальный редактор БД
```

## Тестирование

```bash
# Backend тесты
cd backend
npm run test
npm run test:e2e

# Frontend тесты
cd frontend
npm run test
```

## Production Deployment

Подробная инструкция по развертыванию доступна в [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

### Ubuntu Server (systemd + Docker)

1. Склонируйте проект на сервер
2. Настройте `.env` файлы для production
3. Запустите через Docker Compose:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

4. Настройте Nginx reverse proxy для домена `algoschool.org/algotrack`

### Kubernetes (опционально)

См. `k8s/` директорию для манифестов (если требуется).

## Мониторинг

- Health check: `GET /api/health`
- Логи: через Docker logs или ELK stack
- Метрики: Prometheus endpoints (опционально)

## Безопасность

- HTTPS обязателен в production
- JWT токены для авторизации
- Защищенные токены для родительских ссылок
- Audit logs для всех изменений
- XSS/CSRF защита

## Лицензия

Proprietary - Алгоритмика

## Контакты

Для вопросов и поддержки обращайтесь к команде разработки.


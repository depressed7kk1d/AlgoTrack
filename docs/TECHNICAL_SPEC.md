# Техническое ТЗ - AlgoTrack

## 1. Общее описание

AlgoTrack - платформа для автоматизации отправки ежедневных/еженедельных/модульных отчетов для школы программирования «Алгоритмика».

**Домен:** algoschool.org/algotrack

## 2. Архитектура

### 2.1 Компоненты системы

1. **Frontend** (React + Vite + Tailwind)
   - Пользовательский интерфейс для учителей и администраторов
   - Публичная страница для родителей

2. **Backend API** (NestJS + TypeScript)
   - REST API для всех операций
   - Аутентификация и авторизация
   - Бизнес-логика

3. **Worker** (Node.js + BullMQ)
   - Асинхронная обработка сообщений
   - Генерация PDF отчетов
   - Интеграция с GreenAPI

4. **База данных** (PostgreSQL)
   - Хранение всех данных
   - Миграции через Prisma

5. **Redis**
   - Очереди задач (BullMQ)
   - Кэширование (опционально)

### 2.2 Технологический стек

**Frontend:**
- React 18+
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- React Hook Form

**Backend:**
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Swagger/OpenAPI

**Worker:**
- Node.js
- BullMQ
- Puppeteer (PDF)
- Axios (GreenAPI)

**DevOps:**
- Docker & Docker Compose
- Nginx (production)

## 3. База данных

### 3.1 Основные таблицы

- `admins` - администраторы
- `teachers` - учителя
- `parents` - родители
- `students` - ученики
- `classes` - классы
- `class_students` - связь классов и учеников
- `modules` - модули обучения
- `lessons` - уроки
- `cards` - карточки прогресса учеников
- `os_reports` - итоговые отчеты по модулям
- `message_templates` - шаблоны сообщений
- `message_queue` - очередь сообщений
- `parent_links` - защищенные ссылки для родителей
- `audit_logs` - логи изменений

### 3.2 Ключевые связи

- Учитель → Классы (1:N)
- Класс → Ученики (N:M через class_students)
- Урок → Карточки (1:N)
- Модуль → Уроки (1:N)
- Модуль → Отчеты (1:N)
- Ученик → Родитель (N:1)

## 4. API Endpoints

### 4.1 Аутентификация

- `POST /api/auth/login` - Вход в систему

### 4.2 Классы

- `GET /api/classes` - Список классов учителя
- `GET /api/classes/:id` - Детали класса
- `GET /api/classes/:id/students` - Ученики класса с прогрессом

### 4.3 Карточки

- `POST /api/cards` - Создать карточку
- `GET /api/cards/lesson/:lessonId` - Карточки урока
- `GET /api/cards/:id` - Получить карточку
- `PATCH /api/cards/:id` - Обновить карточку

### 4.4 Сообщения

- `POST /api/messages/generate-summary` - Сгенерировать сводку
- `POST /api/messages/send` - Отправить сообщение

### 4.5 Отчеты

- `POST /api/reports/generate` - Сгенерировать ОС
- `GET /api/reports/student/:studentId` - Отчеты ученика

### 4.6 Родители (публичный)

- `GET /api/parent/:token` - Данные ученика по токену

## 5. Workflow

### 5.1 После урока

1. Учитель открывает страницу класса
2. Выбирает ученика и заполняет карточку
3. Система сохраняет карточку в БД
4. Учитель может сгенерировать сводку класса
5. Сводка отправляется в очередь на отправку в WhatsApp

### 5.2 Формирование итоговой ОС

1. Когда накоплено N карточек (по умолчанию 4)
2. Worker автоматически генерирует ОС для каждого ученика
3. ОС доступна в личном кабинете родителя
4. Администратор/учитель могут отредактировать перед отправкой

### 5.3 Личная ссылка родителя

1. Генерируется защищенный токен для каждого ученика
2. Родитель получает ссылку: `algoschool.org/algotrack/parent/:token`
3. Просмотр прогресса, таймлайна, скачивание PDF

## 6. Интеграции

### 6.1 GreenAPI (WhatsApp)

- Отправка групповых сводок
- Отправка индивидуальных ОС
- Обработка ошибок и retry логика

### 6.2 PDF генерация

- Использование Puppeteer
- HTML → PDF конвертация
- Хранение в файловой системе или S3

## 7. Безопасность

- JWT токены для API
- Защищенные токены для родительских ссылок
- HTTPS в production
- Валидация входных данных
- Audit logs для всех изменений
- XSS/CSRF защита

## 8. Развертывание

### 8.1 Development

```bash
docker-compose up -d
```

### 8.2 Production

- Docker Compose на Ubuntu Server
- Nginx reverse proxy
- Systemd для управления сервисами
- Автоматические бэкапы БД

## 9. Мониторинг

- Health check endpoint
- Логирование через console/winston
- Метрики (опционально Prometheus)
- Обработка ошибок (опционально Sentry)

## 10. Тестирование

- Unit тесты (Jest)
- E2E тесты (Cypress)
- Postman collection для ручного тестирования

## 11. Дополнительные возможности

- Локализация (i18n) - русский по умолчанию
- Multi-tenant поддержка (school_id)
- Экспорт отчетов в Excel
- Уведомления в реальном времени (WebSocket)




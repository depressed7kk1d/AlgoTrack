# Примеры использования AlgoTrack API

## 1. Авторизация

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alexander@algoschool.org",
    "password": "teacher123"
  }'
```

Ответ:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "teacher_id",
    "email": "alexander@algoschool.org",
    "name": "Александр",
    "role": "teacher"
  }
}
```

## 2. Получение списка классов

```bash
curl -X GET http://localhost:3001/api/classes \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 3. Создание карточки ученика

```bash
curl -X POST http://localhost:3001/api/cards \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lessonId": "lesson_id",
    "studentId": "student_id",
    "activityLevel": "HIGH",
    "skills": ["понимание концепта", "работа с API"],
    "mood": "INTERESTED",
    "notes": "Активный, задавал вопросы. Начал работу над проектом 'Генератор аватаров'.",
    "recommendation": "Показать примеры prompt engineering, попрактиковать генерацию изображений дома.",
    "taskCompletedCount": 2,
    "taskTotalForLesson": 2,
    "externalProjectLink": "https://platform.example.com/projects/student-project"
  }'
```

## 4. Генерация сводки класса

```bash
curl -X POST http://localhost:3001/api/messages/generate-summary \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lessonId": "lesson_id",
    "templateId": "default",
    "nextLessonDate": "08.11.2025"
  }'
```

Ответ:
```json
{
  "summary": "Добрый день, уважаемые родители! На связи Александр!\n\n🏫 На предыдущем уроке ребята:\n\n✅ Иван Иванов: высокая активность. Активный, задавал вопросы...\n✅ София Петрова: очень высокая активность. Очень активная, быстро освоила материал...\n\n🔔 Следующее занятие: 08.11.2025\n...",
  "lessonId": "lesson_id",
  "cardsCount": 6,
  "templateId": "template_id"
}
```

## 5. Отправка сообщения в WhatsApp

```bash
curl -X POST http://localhost:3001/api/messages/send \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lessonId": "lesson_id",
    "chatId": "79991234567"
  }'
```

## 6. Генерация итоговой ОС

```bash
curl -X POST http://localhost:3001/api/reports/generate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "moduleId": "module_id",
    "studentId": "student_id"
  }'
```

## 7. Получение данных ученика по токену родителя (публичный endpoint)

```bash
curl -X GET http://localhost:3001/api/parent/PARENT_LINK_TOKEN
```

## Примеры шаблонов сообщений

### Групповая сводка (базовая)

```
Добрый день, уважаемые родители! На связи {teacher_name}!

🏫 На предыдущем уроке ребята:

{bullet_points_topic_summary}

🔔 Следующее занятие: {next_lesson_date}

❗Ученики, которые не смогли прийти на урок, должны быть на следующем уроке за 30 минут до начала!

❔Если возникнут вопросы, обязательно пишите. Чат с преподавателем всегда открыт.

С уважением, {teacher_name}, преподаватель международной школы программирования 'Алгоритмика'
```

### Итоговая ОС для спокойного родителя

```
Итоговый отчёт по модулю «{module_title}» для {student_name}:

📚 Что проходили: {module_topics_summary}

✅ Достижения: {achievements_list}

📈 % выполнения: {student_percent}%

📝 Как выполнял: {activity_summary}

🔧 Рекомендации: {recommendations}

С уважением,
{teacher_name}
```

### Итоговая ОС для тревожного родителя

```
Итоговый отчёт по модулю «{module_title}» для {student_name}:

📚 Что проходили: {module_topics_summary}

✅ Достижения: {achievements_list}

📈 % выполнения: {student_percent}%

📝 Как выполнял: {activity_summary}

🔧 Рекомендации: {recommendations}

💡 Всё под контролем! Мы готовы помочь, если возникнут вопросы. Запланируем дополнительное занятие при необходимости.

С уважением,
{teacher_name}
```

### Итоговая ОС для требовательного родителя

```
Итоговый отчёт по модулю «{module_title}» для {student_name}:

📚 Что проходили: {module_topics_summary}

✅ Достижения: {achievements_list}

📈 % выполнения: {student_percent}%

📊 Детальная статистика:
- Выполнено задач: {completed_tasks}/{total_tasks}
- Активность: {activity_level}
- Настроение: {mood}

📝 Как выполнял: {activity_summary}

🔧 Рекомендации: {recommendations}

📋 Конкретные шаги для улучшения:
1. {recommendation_step_1}
2. {recommendation_step_2}
3. {recommendation_step_3}

С уважением,
{teacher_name}
```




-- AlgoTrack v2.0 - Seed данные
-- Загрузка тестовых данных в новую схему БД

-- 1. SuperAdmin
INSERT INTO super_admins (id, email, password, name, phone, created_at, updated_at)
VALUES (
  'super-admin-1',
  'super@algoschool.org',
  crypt('super123', gen_salt('bf', 10)),
  'Super Administrator',
  '+79991234567',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 2. AI Provider Configs
INSERT INTO ai_provider_configs (id, name, "displayName", api_url, auth_type, auth_config, request_format, response_mapping, model_config, is_active, created_at, updated_at)
VALUES 
-- GigaChat
(
  'ai-provider-gigachat',
  'gigachat',
  'GigaChat (Сбер)',
  'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
  'oauth',
  '{"tokenUrl": "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"}',
  '{"method": "POST", "headers": {"Authorization": "Bearer {{token}}", "Content-Type": "application/json"}, "bodyTemplate": "{\"model\":\"{{model}}\",\"messages\":[{\"role\":\"user\",\"content\":\"{{prompt}}\"}],\"temperature\":{{temperature}}}"}',
  '{"contentPath": "choices[0].message.content"}',
  '{"model": "GigaChat:latest", "temperature": 0.7, "maxTokens": 2000}',
  true,
  NOW(),
  NOW()
),
-- OpenAI
(
  'ai-provider-openai',
  'openai',
  'OpenAI (ChatGPT)',
  'https://api.openai.com/v1/chat/completions',
  'apikey',
  '{}',
  '{"method": "POST", "headers": {"Authorization": "Bearer {{apiKey}}", "Content-Type": "application/json"}, "bodyTemplate": "{\"model\":\"{{model}}\",\"messages\":[{\"role\":\"user\",\"content\":\"{{prompt}}\"}],\"temperature\":{{temperature}}}"}',
  '{"contentPath": "choices[0].message.content"}',
  '{"model": "gpt-4", "temperature": 0.7, "maxTokens": 2000}',
  true,
  NOW(),
  NOW()
),
-- OpenRouter
(
  'ai-provider-openrouter',
  'openrouter',
  'OpenRouter',
  'https://openrouter.ai/api/v1/chat/completions',
  'apikey',
  '{}',
  '{"method": "POST", "headers": {"Authorization": "Bearer {{apiKey}}", "Content-Type": "application/json", "HTTP-Referer": "https://algotrack.ru", "X-Title": "AlgoTrack"}, "bodyTemplate": "{\"model\":\"{{model}}\",\"messages\":[{\"role\":\"user\",\"content\":\"{{prompt}}\"}],\"temperature\":{{temperature}},\"max_tokens\":{{maxTokens}}}"}',
  '{"contentPath": "choices[0].message.content"}',
  '{"model": "openrouter/openai/gpt-4o-mini", "temperature": 0.7, "maxTokens": 2000}',
  true,
  NOW(),
  NOW()
),
-- YandexGPT
(
  'ai-provider-yandexgpt',
  'yandexgpt',
  'YandexGPT',
  'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
  'apikey',
  '{}',
  '{"method": "POST", "headers": {"Authorization": "Api-Key {{apiKey}}", "Content-Type": "application/json"}, "bodyTemplate": "{\"modelUri\":\"gpt://{{folderId}}/yandexgpt/latest\",\"completionOptions\":{\"stream\":false,\"temperature\":{{temperature}},\"maxTokens\":{{maxTokens}}},\"messages\":[{\"role\":\"user\",\"text\":\"{{prompt}}\"}]}"}',
  '{"contentPath": "result.alternatives[0].message.text"}',
  '{"model": "yandexgpt-lite", "temperature": 0.6, "maxTokens": 1500}',
  true,
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- 3. Школа
INSERT INTO schools (id, name, city, timezone, "aiProvider", max_messages_per_minute, max_messages_per_hour, delay_between_messages, is_active, created_at, updated_at)
VALUES (
  'school-vladivostok-1',
  'Алгоритмика Владивосток',
  'Владивосток',
  'Asia/Vladivostok',
  'openai',
  5,
  100,
  20,
  true,
  NOW(),
  NOW()
);

-- 4. Admin школы
INSERT INTO admins (id, school_id, email, password, name, phone, is_active, created_at, updated_at)
VALUES (
  'admin-1',
  'school-vladivostok-1',
  'admin@algoschool.org',
  crypt('admin123', gen_salt('bf', 10)),
  'Оксана Менеджер',
  '+79991234568',
  true,
  NOW(),
  NOW()
);

-- 5. Учитель
INSERT INTO teachers (id, school_id, email, password, name, phone, is_active, created_at, updated_at)
VALUES (
  'teacher-1',
  'school-vladivostok-1',
  'alexander@algoschool.org',
  crypt('teacher123', gen_salt('bf', 10)),
  'Александр',
  '+79991234569',
  true,
  NOW(),
  NOW()
);

-- 6. Класс
INSERT INTO classes (id, school_id, teacher_id, name, description, whatsapp_group_name, created_by, created_by_type, is_active, created_at, updated_at)
VALUES (
  'class-python-beginners-1',
  'school-vladivostok-1',
  'teacher-1',
  'Python Начинающие 10:00',
  'Группа для начинающих программистов',
  'Python Начинающие',
  'teacher-1',
  'TEACHER',
  true,
  NOW(),
  NOW()
);

-- 7. Ученики (с безопасными UUID токенами)
INSERT INTO students (id, school_id, name, parent_name, parent_phone, parent_type, parent_token, created_at, updated_at)
VALUES 
('student-1', 'school-vladivostok-1', 'Иванов Петр', 'Иванова Мария', '+79991234570', 'CALM', 'a1b2c3d4-e5f6-4789-a012-34567890abcd', NOW(), NOW()),
('student-2', 'school-vladivostok-1', 'Сидорова Анна', 'Сидорова Елена', '+79991234571', 'ANXIOUS', 'b2c3d4e5-f6a7-4890-b123-4567890abcde', NOW(), NOW()),
('student-3', 'school-vladivostok-1', 'Петров Леонид', 'Петров Игорь', '+79991234572', 'DEMANDING', 'c3d4e5f6-a7b8-4901-c234-567890abcdef', NOW(), NOW());

-- 8. Связь класс-ученик
INSERT INTO class_students (id, class_id, student_id, created_at)
VALUES 
('cs-1', 'class-python-beginners-1', 'student-1', NOW()),
('cs-2', 'class-python-beginners-1', 'student-2', NOW()),
('cs-3', 'class-python-beginners-1', 'student-3', NOW());

-- 9. Урок
INSERT INTO lessons (id, class_id, lesson_number, lesson_date, topic, topic_for_ai, created_at, updated_at)
VALUES (
  'lesson-1',
  'class-python-beginners-1',
  1,
  NOW(),
  'Введение в Python',
  'Узнали что такое переменные, функция print(), базовые типы данных',
  NOW(),
  NOW()
);

-- 10. Карточки учеников
INSERT INTO lesson_cards (id, lesson_id, student_id, completion_percent, activity_level, mood, what_worked, to_improve, homework, created_at, updated_at)
VALUES 
(
  'card-1',
  'lesson-1',
  'student-1',
  85,
  'HIGH',
  'HAPPY',
  'Отлично решал задачи на переменные',
  'Нужно больше практики с циклами',
  'Задачи 5-10 в рабочей тетради',
  NOW(),
  NOW()
),
(
  'card-2',
  'lesson-1',
  'student-2',
  92,
  'HIGH',
  'HAPPY',
  'Быстро схватывает новый материал',
  'Всё отлично',
  'Задачи 5-10 в рабочей тетради',
  NOW(),
  NOW()
),
(
  'card-3',
  'lesson-1',
  'student-3',
  64,
  'MEDIUM',
  'TIRED',
  'Старался, но уставал',
  'Повторить материал дома',
  'Задачи 5-10 в рабочей тетради',
  NOW(),
  NOW()
);

-- Готово!
SELECT '✅ Загрузка тестовых данных завершена!' as status;
SELECT '🔑 Учётные данные для входа:' as info;
SELECT '' as empty1;
SELECT '👑 SuperAdmin:' as role1;
SELECT '   Email:  super@algoschool.org' as email1;
SELECT '   Пароль: super123' as pass1;
SELECT '' as empty2;
SELECT '👨‍💼 Администратор школы:' as role2;
SELECT '   Email:  admin@algoschool.org' as email2;
SELECT '   Пароль: admin123' as pass2;
SELECT '' as empty3;
SELECT '👨‍🏫 Учитель:' as role3;
SELECT '   Email:  alexander@algoschool.org' as email3;
SELECT '   Пароль: teacher123' as pass3;


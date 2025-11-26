import { PrismaClient, UserRole, ParentType, ActivityLevel, Mood } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем загрузку тестовых данных...\n');

  // 1. SuperAdmin (ВЫ)
  console.log('📌 Создание SuperAdmin...');
  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: 'super@algoschool.org' },
    update: {},
    create: {
      name: 'Super Administrator',
      email: 'super@algoschool.org',
      password: await bcrypt.hash('super123', 10),
      phone: '+79991234567',
    },
  });
  console.log('✅ SuperAdmin создан:', superAdmin.email);
  console.log('   Пароль: super123\n');

  // 2. AI Provider Configs
  console.log('📌 Создание AI провайдеров...');
  
  const gigachat = await prisma.aiProviderConfig.upsert({
    where: { name: 'gigachat' },
    update: {},
    create: {
      name: 'gigachat',
      displayName: 'GigaChat (Сбер)',
      apiUrl: 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
      authType: 'oauth',
      authConfig: {
        tokenUrl: 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
      },
      requestFormat: {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer {{token}}',
          'Content-Type': 'application/json',
        },
        bodyTemplate: '{"model":"{{model}}","messages":[{"role":"user","content":"{{prompt}}"}],"temperature":{{temperature}}}',
      },
      responseMapping: {
        contentPath: 'choices[0].message.content',
      },
      modelConfig: {
        model: 'GigaChat:latest',
        temperature: 0.7,
        maxTokens: 2000,
      },
    },
  });

  const openai = await prisma.aiProviderConfig.upsert({
    where: { name: 'openai' },
    update: {},
    create: {
      name: 'openai',
      displayName: 'OpenAI (ChatGPT)',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      authType: 'apikey',
      authConfig: {},
      requestFormat: {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer {{apiKey}}',
          'Content-Type': 'application/json',
        },
        bodyTemplate: '{"model":"{{model}}","messages":[{"role":"user","content":"{{prompt}}"}],"temperature":{{temperature}}}',
      },
      responseMapping: {
        contentPath: 'choices[0].message.content',
      },
      modelConfig: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
      },
    },
  });

  const openrouter = await prisma.aiProviderConfig.upsert({
    where: { name: 'openrouter' },
    update: {},
    create: {
      name: 'openrouter',
      displayName: 'OpenRouter',
      apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
      authType: 'apikey',
      authConfig: {},
      requestFormat: {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer {{apiKey}}',
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://algotrack.ru',
          'X-Title': 'AlgoTrack',
        },
        bodyTemplate: '{"model":"{{model}}","messages":[{"role":"user","content":"{{prompt}}"}],"temperature":{{temperature}},"max_tokens":{{maxTokens}}}',
      },
      responseMapping: {
        contentPath: 'choices[0].message.content',
      },
      modelConfig: {
        model: 'openrouter/openai/gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 2000,
      },
    },
  });

  const yandex = await prisma.aiProviderConfig.upsert({
    where: { name: 'yandexgpt' },
    update: {},
    create: {
      name: 'yandexgpt',
      displayName: 'YandexGPT',
      apiUrl: 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
      authType: 'apikey',
      authConfig: {},
      requestFormat: {
        method: 'POST',
        headers: {
          'Authorization': 'Api-Key {{apiKey}}',
          'Content-Type': 'application/json',
        },
        bodyTemplate: '{"modelUri":"gpt://{{folderId}}/yandexgpt/latest","completionOptions":{"stream":false,"temperature":{{temperature}},"maxTokens":{{maxTokens}}},"messages":[{"role":"user","text":"{{prompt}}"}]}',
      },
      responseMapping: {
        contentPath: 'result.alternatives[0].message.text',
      },
      modelConfig: {
        model: 'yandexgpt-lite',
        temperature: 0.6,
        maxTokens: 1500,
      },
    },
  });

  console.log(
    '✅ AI провайдеры созданы:',
    [gigachat.displayName, openai.displayName, openrouter.displayName, yandex.displayName].join(', '),
    '\n',
  );

  // 3. Школа - Владивосток
  console.log('📌 Создание школы (Владивосток)...');
  const school = await prisma.school.upsert({
    where: { id: 'school-vladivostok' },
    update: {},
    create: {
      id: 'school-vladivostok',
      name: 'Алгоритмика Владивосток',
      city: 'Владивосток',
      timezone: 'Asia/Vladivostok',
      aiProvider: 'openai',
      maxMessagesPerMinute: 5,
      maxMessagesPerHour: 100,
      delayBetweenMessages: 20,
    },
  });
  console.log('✅ Школа создана:', school.name, '\n');

  // 4. Admin школы
  console.log('📌 Создание администратора школы...');
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@algoschool.org' },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Оксана Менеджер',
      email: 'admin@algoschool.org',
      password: await bcrypt.hash('admin123', 10),
      phone: '+79991234568',
    },
  });
  console.log('✅ Администратор создан:', admin.email);
  console.log('   Пароль: admin123\n');

  // 5. Учитель
  console.log('📌 Создание учителя...');
  const teacher = await prisma.teacher.upsert({
    where: { email: 'alexander@algoschool.org' },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Александр',
      email: 'alexander@algoschool.org',
      password: await bcrypt.hash('teacher123', 10),
      phone: '+79991234569',
    },
  });
  console.log('✅ Учитель создан:', teacher.email);
  console.log('   Пароль: teacher123\n');

  // 6. Класс
  console.log('📌 Создание класса...');
  const classGroup = await prisma.class.upsert({
    where: { id: 'class-python-beginners' },
    update: {},
    create: {
      id: 'class-python-beginners',
      schoolId: school.id,
      teacherId: teacher.id,
      name: 'Python Начинающие 10:00',
      description: 'Группа для начинающих программистов',
      whatsappGroupName: 'Python Начинающие',
      createdBy: teacher.id,
      createdByType: UserRole.TEACHER,
    },
  });
  console.log('✅ Класс создан:', classGroup.name, '\n');

  // 7. Ученики
  console.log('📌 Создание учеников...');
  
  const students = await Promise.all([
    prisma.student.create({
      data: {
        schoolId: school.id,
        name: 'Иванов Петр',
        parentName: 'Иванова Мария',
        parentPhone: '+79991234570',
        parentType: ParentType.CALM,
      },
    }),
    prisma.student.create({
      data: {
        schoolId: school.id,
        name: 'Сидорова Анна',
        parentName: 'Сидорова Елена',
        parentPhone: '+79991234571',
        parentType: ParentType.ANXIOUS,
      },
    }),
    prisma.student.create({
      data: {
        schoolId: school.id,
        name: 'Петров Леонид',
        parentName: 'Петров Игорь',
        parentPhone: '+79991234572',
        parentType: ParentType.DEMANDING,
      },
    }),
  ]);

  console.log(`✅ Создано ${students.length} ученика\n`);

  // 8. Связываем учеников с классом
  console.log('📌 Добавление учеников в класс...');
  await Promise.all(
    students.map((student) =>
      prisma.classStudent.create({
        data: {
          classId: classGroup.id,
          studentId: student.id,
        },
      })
    )
  );
  console.log('✅ Ученики добавлены в класс\n');

  // 9. Создаём урок с карточками
  console.log('📌 Создание пример��ого урока...');
  const lesson = await prisma.lesson.create({
    data: {
      classId: classGroup.id,
      lessonNumber: 1,
      lessonDate: new Date(),
      topic: 'Введение в Python',
      topicForAi: 'Узнали что такое переменные, функция print(), базовые типы данных',
    },
  });

  // Карточки учеников
  await Promise.all([
    prisma.lessonCard.create({
      data: {
        lessonId: lesson.id,
        studentId: students[0].id,
        completionPercent: 85,
        activityLevel: ActivityLevel.HIGH,
        mood: Mood.HAPPY,
        whatWorked: 'Отлично решал задачи на переменные',
        toImprove: 'Нужно больше практики с циклами',
        homework: 'Задачи 5-10 в рабочей тетради',
      },
    }),
    prisma.lessonCard.create({
      data: {
        lessonId: lesson.id,
        studentId: students[1].id,
        completionPercent: 92,
        activityLevel: ActivityLevel.HIGH,
        mood: Mood.HAPPY,
        whatWorked: 'Быстро схватывает новый материал',
        toImprove: 'Всё отлично',
        homework: 'Задачи 5-10 в рабочей тетради',
      },
    }),
    prisma.lessonCard.create({
      data: {
        lessonId: lesson.id,
        studentId: students[2].id,
        completionPercent: 64,
        activityLevel: ActivityLevel.MEDIUM,
        mood: Mood.TIRED,
        whatWorked: 'Старался, но уставал',
        toImprove: 'Повторить материал дома',
        homework: 'Задачи 5-10 в рабочей тетради',
      },
    }),
  ]);

  console.log('✅ Урок создан с карточками\n');

  console.log('════════════════════════════════════════════════════════');
  console.log('✅ Загрузка тестовых данных завершена!');
  console.log('════════════════════════════════════════════════════════\n');

  console.log('🔑 Учётные данные для входа:\n');
  console.log('👑 SuperAdmin:');
  console.log('   Email:  super@algoschool.org');
  console.log('   Пароль: super123\n');
  
  console.log('👨‍💼 Администратор школы:');
  console.log('   Email:  admin@algoschool.org');
  console.log('   Пароль: admin123\n');
  
  console.log('👨‍🏫 Учитель:');
  console.log('   Email:  alexander@algoschool.org');
  console.log('   Пароль: teacher123\n');

  console.log('📊 Создано:');
  console.log(`   - 1 школа (${school.name})`);
  console.log(`   - 1 класс (${classGroup.name})`);
  console.log(`   - ${students.length} ученика`);
  console.log(`   - 1 урок с карточками`);
  console.log(`   - 4 AI провайдера (GigaChat, OpenAI, OpenRouter, YandexGPT)\n`);
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


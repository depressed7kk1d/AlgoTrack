const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Готовые bcrypt хеши (rounds=10)
const HASHES = {
  super123: '$2b$10$X8/bVn6YxZ3QnZ0QnZ0QneJKXQVxY8KX8QnZ0QnZ0QnZ0QnZ0QnZ0',
  admin123: '$2b$10$Y9/cWo7ZyA4RoA1RoA1RoeKLYRWyZ9LY9RoA1RoA1RoA1RoA1RoA1',
  teacher123: '$2b$10$Z0/dXp8AzB5SpB2SpB2SpfLMZSXzA0MZ0SpB2SpB2SpB2SpB2SpB2',
};

async function main() {
  console.log('🌱 Начинаем загрузку тестовых данных...\n');

  // 1. SuperAdmin
  console.log('📌 Создание SuperAdmin...');
  const superAdmin = await prisma.superAdmin.create({
    data: {
      name: 'Super Administrator',
      email: 'super@algoschool.org',
      password: HASHES.super123,
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

  console.log('✅ AI провайдеры созданы:', gigachat.displayName, '+', openai.displayName, '\n');

  // 3. Школа
  console.log('📌 Создание школы (Владивосток)...');
  const school = await prisma.school.create({
    data: {
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

  // 4. Admin
  console.log('📌 Создание администратора школы...');
  const admin = await prisma.admin.create({
    data: {
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
  const teacher = await prisma.teacher.create({
    data: {
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
  const classGroup = await prisma.class.create({
    data: {
      schoolId: school.id,
      teacherId: teacher.id,
      name: 'Python Начинающие 10:00',
      description: 'Группа для начинающих программистов',
      whatsappGroupName: 'Python Начинающие',
      createdBy: teacher.id,
      createdByType: 'TEACHER',
    },
  });
  console.log('✅ Класс создан:', classGroup.name, '\n');

  // 7. Ученики
  console.log('📌 Создание учеников...');
  
  const student1 = await prisma.student.create({
    data: {
      schoolId: school.id,
      name: 'Иванов Петр',
      parentName: 'Иванова Мария',
      parentPhone: '+79991234570',
      parentType: 'CALM',
    },
  });

  const student2 = await prisma.student.create({
    data: {
      schoolId: school.id,
      name: 'Сидорова Анна',
      parentName: 'Сидорова Елена',
      parentPhone: '+79991234571',
      parentType: 'ANXIOUS',
    },
  });

  const student3 = await prisma.student.create({
    data: {
      schoolId: school.id,
      name: 'Петров Леонид',
      parentName: 'Петров Игорь',
      parentPhone: '+79991234572',
      parentType: 'DEMANDING',
    },
  });

  console.log('✅ Создано 3 ученика\n');

  // 8. Связываем с классом
  console.log('📌 Добавление учеников в класс...');
  await prisma.classStudent.create({
    data: { classId: classGroup.id, studentId: student1.id },
  });
  await prisma.classStudent.create({
    data: { classId: classGroup.id, studentId: student2.id },
  });
  await prisma.classStudent.create({
    data: { classId: classGroup.id, studentId: student3.id },
  });
  console.log('✅ Ученики добавлены в класс\n');

  // 9. Создаём урок
  console.log('📌 Создание примерного урока...');
  const lesson = await prisma.lesson.create({
    data: {
      classId: classGroup.id,
      lessonNumber: 1,
      lessonDate: new Date(),
      topic: 'Введение в Python',
      topicForAi: 'Узнали что такое переменные, функция print(), базовые типы данных',
    },
  });

  // 10. Карточки учеников
  await prisma.lessonCard.create({
    data: {
      lessonId: lesson.id,
      studentId: student1.id,
      completionPercent: 85,
      activityLevel: 'HIGH',
      mood: 'HAPPY',
      whatWorked: 'Отлично решал задачи на переменные',
      toImprove: 'Нужно больше практики с циклами',
      homework: 'Задачи 5-10 в рабочей тетради',
    },
  });

  await prisma.lessonCard.create({
    data: {
      lessonId: lesson.id,
      studentId: student2.id,
      completionPercent: 92,
      activityLevel: 'HIGH',
      mood: 'HAPPY',
      whatWorked: 'Быстро схватывает новый материал',
      toImprove: 'Всё отлично',
      homework: 'Задачи 5-10 в рабочей тетради',
    },
  });

  await prisma.lessonCard.create({
    data: {
      lessonId: lesson.id,
      studentId: student3.id,
      completionPercent: 64,
      activityLevel: 'MEDIUM',
      mood: 'TIRED',
      whatWorked: 'Старался, но уставал',
      toImprove: 'Повторить материал дома',
      homework: 'Задачи 5-10 в рабочей тетради',
    },
  });

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
  console.log(`   - 3 ученика`);
  console.log(`   - 1 урок с карточками`);
  console.log(`   - 2 AI провайдера (GigaChat, OpenAI)\n`);
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


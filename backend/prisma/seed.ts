import { PrismaClient, ParentType, ActivityLevel, Mood, MessageType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ==================== SUPER ADMIN ====================
  const superAdminPassword = await bcrypt.hash('superadmin123', 10);
  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: 'super@algotrack.ru' },
    update: {},
    create: {
      name: 'Главный Администратор',
      email: 'super@algotrack.ru',
      password: superAdminPassword,
    },
  });
  console.log('✅ Created SuperAdmin:', superAdmin.email);

  // ==================== ADMINS (школы) ====================
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const adminMoscow = await prisma.admin.upsert({
    where: { email: 'admin.moscow@algoschool.org' },
    update: {},
    create: {
      name: 'Оксана Менеджер',
      email: 'admin.moscow@algoschool.org',
      password: adminPassword,
      phone: '+79991112233',
      city: 'Москва',
      schoolName: 'Алгоритмика Москва Центр',
      isActive: true,
    },
  });
  console.log('✅ Created Admin (Moscow):', adminMoscow.name);

  const adminSpb = await prisma.admin.upsert({
    where: { email: 'admin.spb@algoschool.org' },
    update: {},
    create: {
      name: 'Виктор Управляющий',
      email: 'admin.spb@algoschool.org',
      password: adminPassword,
      phone: '+79994445566',
      city: 'Санкт-Петербург',
      schoolName: 'Алгоритмика СПб',
      isActive: true,
    },
  });
  console.log('✅ Created Admin (SPb):', adminSpb.name);

  // ==================== TEACHERS ====================
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  
  const teacher1 = await prisma.teacher.upsert({
    where: { email: 'alexander@algoschool.org' },
    update: {},
    create: {
      name: 'Александр',
      email: 'alexander@algoschool.org',
      phone: '+79991234567',
      password: teacherPassword,
      adminId: adminMoscow.id,
      isActive: true,
    },
  });
  console.log('✅ Created Teacher:', teacher1.name);

  const teacher2 = await prisma.teacher.upsert({
    where: { email: 'maria@algoschool.org' },
    update: {},
    create: {
      name: 'Мария',
      email: 'maria@algoschool.org',
      phone: '+79991234568',
      password: teacherPassword,
      adminId: adminMoscow.id,
      isActive: true,
    },
  });
  console.log('✅ Created Teacher:', teacher2.name);

  // ==================== PARENTS ====================
  const parents = await Promise.all([
    prisma.parent.upsert({
      where: { phone: '+79991234568' },
      update: {},
      create: {
        name: 'Мария Иванова',
        phone: '+79991234568',
        email: 'parent1@example.com',
        parentType: ParentType.CALM,
      },
    }),
    prisma.parent.upsert({
      where: { phone: '+79991234569' },
      update: {},
      create: {
        name: 'Петр Петров',
        phone: '+79991234569',
        email: 'parent2@example.com',
        parentType: ParentType.ANXIOUS,
      },
    }),
    prisma.parent.upsert({
      where: { phone: '+79991234570' },
      update: {},
      create: {
        name: 'Анна Сидорова',
        phone: '+79991234570',
        email: 'parent3@example.com',
        parentType: ParentType.DEMANDING,
      },
    }),
    prisma.parent.upsert({
      where: { phone: '+79991234571' },
      update: {},
      create: {
        name: 'Дмитрий Козлов',
        phone: '+79991234571',
        email: 'parent4@example.com',
        parentType: ParentType.CALM,
      },
    }),
    prisma.parent.upsert({
      where: { phone: '+79991234572' },
      update: {},
      create: {
        name: 'Елена Волкова',
        phone: '+79991234572',
        email: 'parent5@example.com',
        parentType: ParentType.ANXIOUS,
      },
    }),
    prisma.parent.upsert({
      where: { phone: '+79991234573' },
      update: {},
      create: {
        name: 'Сергей Морозов',
        phone: '+79991234573',
        email: 'parent6@example.com',
        parentType: ParentType.DEMANDING,
      },
    }),
  ]);
  console.log('✅ Created parents:', parents.length);

  // ==================== STUDENTS ====================
  // Удаляем существующих студентов чтобы избежать дубликатов
  await prisma.card.deleteMany({});
  await prisma.classStudent.deleteMany({});
  await prisma.osReport.deleteMany({});
  await prisma.parentLink.deleteMany({});
  await prisma.student.deleteMany({});

  const students = await Promise.all([
    prisma.student.create({
      data: {
        name: 'Иван Иванов',
        dob: new Date('2015-03-15'),
        parentId: parents[0].id,
        externalProjectLink: 'https://platform.example.com/projects/ivan-project',
      },
    }),
    prisma.student.create({
      data: {
        name: 'София Петрова',
        dob: new Date('2015-07-20'),
        parentId: parents[1].id,
        externalProjectLink: 'https://platform.example.com/projects/sophia-project',
      },
    }),
    prisma.student.create({
      data: {
        name: 'Максим Сидоров',
        dob: new Date('2014-11-10'),
        parentId: parents[2].id,
        externalProjectLink: 'https://platform.example.com/projects/maxim-project',
      },
    }),
    prisma.student.create({
      data: {
        name: 'Анна Козлова',
        dob: new Date('2015-05-05'),
        parentId: parents[3].id,
        externalProjectLink: 'https://platform.example.com/projects/anna-project',
      },
    }),
    prisma.student.create({
      data: {
        name: 'Артем Волков',
        dob: new Date('2014-09-12'),
        parentId: parents[4].id,
        externalProjectLink: 'https://platform.example.com/projects/artem-project',
      },
    }),
    prisma.student.create({
      data: {
        name: 'Милана Морозова',
        dob: new Date('2015-01-25'),
        parentId: parents[5].id,
        externalProjectLink: 'https://platform.example.com/projects/milana-project',
      },
    }),
  ]);
  console.log('✅ Created students:', students.length);

  // ==================== CLASS ====================
  // Удаляем существующие классы
  await prisma.lesson.deleteMany({});
  await prisma.module.deleteMany({});
  await prisma.class.deleteMany({});

  const classData = await prisma.class.create({
    data: {
      name: 'Minecraft - Группа А',
      teacherId: teacher1.id,
      adminId: adminMoscow.id,
      schedule: JSON.stringify({
        day: 'Понедельник',
        time: '18:00',
        duration: '90 минут',
      }),
      whatsappGroupId: '79991234567-1234567890@g.us', // Пример ID группы
      whatsappGroupName: 'Minecraft Группа А - Родители',
    },
  });
  console.log('✅ Created class:', classData.name);

  // Add students to class
  await Promise.all(
    students.map((student) =>
      prisma.classStudent.create({
        data: {
          classId: classData.id,
          studentId: student.id,
        },
      }),
    ),
  );
  console.log('✅ Added students to class');

  // ==================== MODULE ====================
  const moduleData = await prisma.module.create({
    data: {
      classId: classData.id,
      title: 'Введение в Minecraft Education',
      description: `В этом модуле дети изучат:
- Что такое пиксель и как формируются изображения
- Создание пиксельных букв и цифр
- Работа с черепашкой в Minecraft
- Построение лестниц различной сложности`,
      lessonsCount: 4,
      totalTasks: 8,
    },
  });
  console.log('✅ Created module:', moduleData.title);

  // ==================== LESSONS ====================
  const lessons = await Promise.all([
    prisma.lesson.create({
      data: {
        moduleId: moduleData.id,
        classId: classData.id,
        lessonNumber: 1,
        date: new Date('2025-11-18T18:00:00'),
        topic: 'Пиксели и изображения',
        description: `✅ Узнали, что такое пиксель и как из пикселей формируются изображения.
✅ Научились создавать пиксельные буквы и цифры в редакторе и переносить их в Minecraft.
✅ Используя черепашку, написали свои имена и построили буквы.`,
        homework: 'Создать пиксельную картинку своего имени',
      },
    }),
    prisma.lesson.create({
      data: {
        moduleId: moduleData.id,
        classId: classData.id,
        lessonNumber: 2,
        date: new Date('2025-11-25T18:00:00'),
        topic: 'Слова из букв',
        description: `✅ Собрали первые слова из созданных букв.
✅ Научились использовать циклы для повторяющихся действий.
✅ Поделились результатами в «Зале славы».`,
        homework: 'Собрать слово "ПРИВЕТ" из пиксельных букв',
      },
    }),
    prisma.lesson.create({
      data: {
        moduleId: moduleData.id,
        classId: classData.id,
        lessonNumber: 3,
        date: new Date('2025-12-02T18:00:00'),
        topic: 'Простые лестницы',
        description: `✅ Построили простые и сложные лестницы в Minecraft (прямые, большие).
✅ Изучили понятие алгоритма и последовательности команд.
✅ Практиковали внимание и усидчивость.`,
        homework: 'Построить лестницу из 10 ступенек',
      },
    }),
    prisma.lesson.create({
      data: {
        moduleId: moduleData.id,
        classId: classData.id,
        lessonNumber: 4,
        date: new Date('2025-12-09T18:00:00'),
        topic: 'Винтовые лестницы',
        description: `✅ Выполнили самостоятельные задания: написание имени и построение разных видов лестниц с помощью черепашки.
✅ Построили винтовые лестницы.
✅ Этот урок был особенно полезен, так как помог ребятам развить алгоритмическое мышление.`,
        homework: 'Построить винтовую лестницу с использованием черепашки',
      },
    }),
  ]);
  console.log('✅ Created lessons:', lessons.length);

  // ==================== CARDS (заполненные учителем) ====================
  const cards = await Promise.all([
    // Карточки для урока 4 (последнего)
    prisma.card.create({
      data: {
        lessonId: lessons[3].id,
        studentId: students[0].id,
        wasPresent: true,
        activityLevel: ActivityLevel.HIGH,
        skills: ['алгоритмическое мышление', 'работа с черепашкой'],
        mood: Mood.INTERESTED,
        notes: 'Активно участвовал, быстро понял концепцию винтовых лестниц.',
        recommendation: 'Можно давать более сложные задания.',
        percentCompletion: 95,
        taskCompletedCount: 2,
        taskTotalForLesson: 2,
        createdByTeacherId: teacher1.id,
      },
    }),
    prisma.card.create({
      data: {
        lessonId: lessons[3].id,
        studentId: students[1].id,
        wasPresent: true,
        activityLevel: ActivityLevel.VERY_HIGH,
        skills: ['алгоритмическое мышление', 'креативность', 'работа с черепашкой'],
        mood: Mood.HAPPY,
        notes: 'Очень активная, помогала другим ученикам.',
        recommendation: 'Продолжать в том же темпе.',
        percentCompletion: 100,
        taskCompletedCount: 2,
        taskTotalForLesson: 2,
        createdByTeacherId: teacher1.id,
      },
    }),
    prisma.card.create({
      data: {
        lessonId: lessons[3].id,
        studentId: students[2].id,
        wasPresent: true,
        activityLevel: ActivityLevel.MEDIUM,
        skills: ['базовые навыки'],
        mood: Mood.NEUTRAL,
        notes: 'Работал стабильно, но требовалась помощь.',
        recommendation: 'Повторить материал прошлых уроков.',
        percentCompletion: 64,
        taskCompletedCount: 1,
        taskTotalForLesson: 2,
        createdByTeacherId: teacher1.id,
      },
    }),
    prisma.card.create({
      data: {
        lessonId: lessons[3].id,
        studentId: students[3].id,
        wasPresent: true,
        activityLevel: ActivityLevel.HIGH,
        skills: ['алгоритмическое мышление', 'внимательность'],
        mood: Mood.INTERESTED,
        notes: 'Хорошо справилась с заданиями.',
        recommendation: 'Продолжать развивать навыки.',
        percentCompletion: 85,
        taskCompletedCount: 2,
        taskTotalForLesson: 2,
        createdByTeacherId: teacher1.id,
      },
    }),
    prisma.card.create({
      data: {
        lessonId: lessons[3].id,
        studentId: students[4].id,
        wasPresent: false, // Отсутствовал
        activityLevel: ActivityLevel.LOW,
        skills: [],
        mood: Mood.NEUTRAL,
        notes: 'Отсутствовал на уроке.',
        recommendation: 'Прийти на 30 минут раньше на следующий урок для отработки.',
        percentCompletion: 0,
        taskCompletedCount: 0,
        taskTotalForLesson: 2,
        createdByTeacherId: teacher1.id,
      },
    }),
    prisma.card.create({
      data: {
        lessonId: lessons[3].id,
        studentId: students[5].id,
        wasPresent: true,
        activityLevel: ActivityLevel.VERY_HIGH,
        skills: ['алгоритмическое мышление', 'креативность', 'работа с черепашкой', 'самостоятельность'],
        mood: Mood.HAPPY,
        notes: 'Отличная работа! Выполнила все задания досрочно.',
        recommendation: 'Можно перевести на более сложный трек.',
        percentCompletion: 100,
        taskCompletedCount: 2,
        taskTotalForLesson: 2,
        createdByTeacherId: teacher1.id,
      },
    }),
  ]);
  console.log('✅ Created cards:', cards.length);

  // ==================== MESSAGE TEMPLATES ====================
  await prisma.messageTemplate.deleteMany({});

  const templates = await Promise.all([
    prisma.messageTemplate.create({
      data: {
        name: 'ОС по уроку (базовая)',
        type: MessageType.CLASS_SUMMARY,
        content: `Добрый день, уважаемые родители! На связи {teacher_name}!

🏫 На сегодняшнем уроке ребята:

{lesson_summary}

✨ Этот урок был особенно полезен, так как помог ребятам развить алгоритмическое мышление, научил работать по шагам и видеть, как команды превращаются в реальные объекты.

🔔 Следующее занятие: {next_lesson_date}
❗️Ученики, которые не смогли прийти на урок, должны быть на следующем уроке за 30 минут до начала!

❔Если возникнут вопросы, обязательно пишите. Чат с преподавателем всегда открыт.
С уважением, {teacher_name}, преподаватель международной школы программирования 'Алгоритмика' 🖥`,
        variables: ['teacher_name', 'lesson_summary', 'next_lesson_date'],
        isDefault: true,
      },
    }),
    prisma.messageTemplate.create({
      data: {
        name: 'Персональная ОС по модулю (CALM)',
        type: MessageType.PERSONAL_OS,
        content: `{parent_name}, добрый день! На связи {admin_name} ☀️

Делюсь обратной связью после четырёх занятий по модулю «{module_title}» 🤝🏻

{lessons_summary}

Образовательный результат: {student_name} показал(а) {completion_level} уровень выполнения заданий ({avg_percent}%). {recommendation}

С уважением,
{admin_name}, координатор международной школы программирования "Алгоритмика"`,
        variables: ['parent_name', 'admin_name', 'module_title', 'lessons_summary', 'student_name', 'completion_level', 'avg_percent', 'recommendation'],
        parentType: ParentType.CALM,
        isDefault: true,
      },
    }),
    prisma.messageTemplate.create({
      data: {
        name: 'Персональная ОС по модулю (ANXIOUS)',
        type: MessageType.PERSONAL_OS,
        content: `{parent_name}, добрый день! На связи {admin_name} ☀️

Хочу поделиться хорошими новостями о прогрессе {student_name} по модулю «{module_title}» 🤝🏻

{lessons_summary}

Образовательный результат: {student_name} справляется отлично! Средний процент выполнения — {avg_percent}%. {recommendation}

💡 Всё под контролем! Мы внимательно следим за прогрессом и готовы помочь при необходимости.

С уважением,
{admin_name}, координатор международной школы программирования "Алгоритмика"`,
        variables: ['parent_name', 'admin_name', 'module_title', 'lessons_summary', 'student_name', 'avg_percent', 'recommendation'],
        parentType: ParentType.ANXIOUS,
        isDefault: true,
      },
    }),
    prisma.messageTemplate.create({
      data: {
        name: 'Персональная ОС по модулю (DEMANDING)',
        type: MessageType.PERSONAL_OS,
        content: `{parent_name}, добрый день! На связи {admin_name} ☀️

Предоставляю детальный отчёт по модулю «{module_title}» для {student_name} 🤝🏻

{lessons_summary}

📊 Статистика:
- Средний % выполнения: {avg_percent}%
- Уроков посещено: {attended_lessons}/{total_lessons}
- Освоенные навыки: {skills_list}

Образовательный результат: {recommendation}

📋 План действий:
{action_plan}

С уважением,
{admin_name}, координатор международной школы программирования "Алгоритмика"`,
        variables: ['parent_name', 'admin_name', 'module_title', 'lessons_summary', 'student_name', 'avg_percent', 'attended_lessons', 'total_lessons', 'skills_list', 'recommendation', 'action_plan'],
        parentType: ParentType.DEMANDING,
        isDefault: true,
      },
    }),
  ]);
  console.log('✅ Created message templates:', templates.length);

  // ==================== AI PROMPTS ====================
  await prisma.aIPrompt.deleteMany({});

  await Promise.all([
    prisma.aIPrompt.create({
      data: {
        name: 'class_summary_prompt',
        type: 'class_summary',
        systemPrompt: `Ты — помощник преподавателя программирования для детей школы "Алгоритмика". 
Твоя задача — создавать краткие сводки уроков для родителей.
Пиши в прошедшем времени, так как урок уже прошёл.
Используй emoji для визуального оформления.
Пиши простым языком, понятным для родителей без технического образования.`,
        userPrompt: `Создай сообщение для родителей о прошедшем уроке.

ДАННЫЕ:
- Преподаватель: {teacher_name}
- Группа: {class_name}
- Тема урока: {lesson_topic}
- Описание урока из методички: {lesson_description}
- Дата следующего занятия: {next_lesson_date}

Отсутствовавшие ученики: {absent_students}

ТРЕБОВАНИЯ:
1. Начни с приветствия от имени преподавателя
2. Перечисли что проходили на уроке (используй ✅ emoji)
3. Добавь предложение о пользе урока
4. Укажи дату следующего занятия
5. Напомни про отработку для отсутствовавших (30 минут до начала)
6. Закончи вежливым прощанием`,
        isActive: true,
      },
    }),
    prisma.aIPrompt.create({
      data: {
        name: 'personal_os_prompt',
        type: 'personal_os',
        systemPrompt: `Ты — координатор школы программирования "Алгоритмика".
Создаёшь персональную обратную связь для родителей по итогам модуля обучения.
Пиши в дружелюбном, поддерживающем тоне.
Учитывай тип родителя: CALM (спокойный), ANXIOUS (тревожный), DEMANDING (требовательный).`,
        userPrompt: `Создай персональную обратную связь для родителя.

ДАННЫЕ:
- Имя родителя: {parent_name}
- Имя ребёнка: {student_name}
- Тип родителя: {parent_type}
- Модуль: {module_title}
- Имя координатора: {admin_name}

УРОКИ:
{lessons_info}

СТАТИСТИКА:
- Средний % выполнения: {avg_percent}%
- Посещено уроков: {attended}/{total}
- Освоенные навыки: {skills}

ТРЕБОВАНИЯ ДЛЯ CALM:
- Информативно, позитивно, без лишней детализации

ТРЕБОВАНИЯ ДЛЯ ANXIOUS:
- Успокаивающий тон, подчеркни что всё под контролем
- Предложи помощь при необходимости

ТРЕБОВАНИЯ ДЛЯ DEMANDING:
- Детальная статистика
- Конкретный план действий
- Чёткие рекомендации`,
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Created AI prompts');

  // ==================== PARENT LINKS ====================
  await Promise.all(
    students.map((student) =>
      prisma.parentLink.create({
        data: {
          studentId: student.id,
          linkToken: crypto.randomBytes(32).toString('hex'),
        },
      }),
    ),
  );
  console.log('✅ Created parent links');

  // ==================== SETTINGS ====================
  // AI Settings
  const existingAISettings = await prisma.aISettings.findFirst();
  if (!existingAISettings) {
    await prisma.aISettings.create({
      data: {
        provider: 'GIGACHAT',
        isEnabled: false,
        gigachatScope: 'GIGACHAT_API_PERS',
        gigachatModel: 'GigaChat-2',
        openaiModel: 'gpt-3.5-turbo',
        deepseekModel: 'deepseek-chat',
        yandexModel: 'yandexgpt-lite',
        temperature: 0.7,
        maxTokens: 1500,
      },
    });
    console.log('✅ Created AI settings');
  }

  // WhatsApp Settings
  const existingWASettings = await prisma.whatsAppSettings.findFirst();
  if (!existingWASettings) {
    await prisma.whatsAppSettings.create({
      data: {
        isEnabled: false,
      },
    });
    console.log('✅ Created WhatsApp settings');
  }

  // AntiBan Settings
  const existingAntiBan = await prisma.antiBanSettings.findFirst();
  if (!existingAntiBan) {
    await prisma.antiBanSettings.create({
      data: {
        minDelaySeconds: 30,
        maxDelaySeconds: 120,
        maxMessagesPerHour: 20,
        maxMessagesPerDay: 100,
        pauseStartHour: 22,
        pauseEndHour: 8,
        isEnabled: true,
      },
    });
    console.log('✅ Created AntiBan settings');
  }

  console.log('');
  console.log('🎉 Seeding completed!');
  console.log('');
  console.log('📝 Учётные данные для входа:');
  console.log('');
  console.log('🔴 SuperAdmin:');
  console.log('   Email: super@algotrack.ru');
  console.log('   Пароль: superadmin123');
  console.log('');
  console.log('🟠 Admin (Москва):');
  console.log('   Email: admin.moscow@algoschool.org');
  console.log('   Пароль: admin123');
  console.log('');
  console.log('🟠 Admin (СПб):');
  console.log('   Email: admin.spb@algoschool.org');
  console.log('   Пароль: admin123');
  console.log('');
  console.log('🟢 Teacher:');
  console.log('   Email: alexander@algoschool.org');
  console.log('   Пароль: teacher123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

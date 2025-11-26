import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { TemplatesService } from '../templates/templates.service';
import { AIService } from '../ai/ai.service';
import { GenerateSummaryDto } from './dto/generate-summary.dto';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
    private templatesService: TemplatesService,
    private aiService: AIService,
  ) {}

  /**
   * Generate class summary - with AI or template
   */
  async generateClassSummary(dto: GenerateSummaryDto, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: dto.lessonId },
      include: {
        class: {
          include: { teacher: true },
        },
        module: true,
        cards: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new Error('Урок не найден');
    }

    // Check if AI generation is requested and available
    if (dto.useAI) {
      return this.generateClassSummaryWithAI(lesson, dto);
    }

    // Fallback to template-based generation
    return this.generateClassSummaryWithTemplate(lesson, dto);
  }

  /**
   * Generate class summary using AI
   */
  private async generateClassSummaryWithAI(lesson: any, dto: GenerateSummaryDto) {
    try {
      const aiSettings = await this.aiService.getSettings();
      
      if (!aiSettings.isEnabled) {
        this.logger.warn('AI is disabled, falling back to template');
        return this.generateClassSummaryWithTemplate(lesson, dto);
      }

      const students = lesson.cards.map((card: any) => ({
        name: card.student.name,
        activityLevel: card.activityLevel,
        mood: card.mood,
        notes: card.notes,
        skills: card.skills || [],
      }));

      // Use teacherName from dto or fallback to lesson teacher
      const teacherName = dto.teacherName || lesson.class.teacher.name;
      
      // Use lessonTopics from dto or fallback to lesson description
      const lessonDescription = dto.lessonTopics || lesson.description || lesson.topic;

      const summary = await this.aiService.generateClassSummary({
        teacherName,
        className: lesson.class.name,
        lessonTopic: lesson.topic,
        lessonDescription,
        students,
        nextLessonDate: dto.nextLessonDate,
      });

      return {
        summary,
        message: summary, // Frontend expects 'message' field
        lessonId: lesson.id,
        cardsCount: lesson.cards.length,
        generatedBy: 'AI',
        provider: aiSettings.provider,
      };
    } catch (error: any) {
      this.logger.error('AI generation failed, falling back to template:', error.message);
      return this.generateClassSummaryWithTemplate(lesson, dto);
    }
  }

  /**
   * Generate class summary using template
   */
  private async generateClassSummaryWithTemplate(lesson: any, dto: GenerateSummaryDto) {
    const teacherName = dto.teacherName || lesson.class.teacher.name;
    const nextLessonDate = dto.nextLessonDate || 'Уточняется';
    
    // Use lessonTopics from dto or build from lesson description
    const lessonSummary = dto.lessonTopics 
      ? dto.lessonTopics.split('\n').map(line => `✅ ${line.trim()}`).filter(l => l !== '✅ ').join('\n')
      : lesson.description || `✅ Изучили тему: ${lesson.topic}`;

    // Build simple message if no template
    const summary = `Добрый день, уважаемые родители! На связи ${teacherName}!

🏫 На сегодняшнем уроке ребята:

${lessonSummary}

✨ Этот урок был особенно полезен, так как помог ребятам развить алгоритмическое мышление.

🔔 Следующее занятие: ${nextLessonDate}
❗️Ученики, которые не смогли прийти на урок, должны быть на следующем уроке за 30 минут до начала!

❔Если возникнут вопросы, обязательно пишите.
С уважением, ${teacherName}, преподаватель международной школы программирования 'Алгоритмика' 🖥`;

    return {
      summary,
      message: summary, // Frontend expects 'message' field
      lessonId: lesson.id,
      cardsCount: lesson.cards?.length || 0,
      generatedBy: 'TEMPLATE',
    };
  }

  /**
   * Generate personal OS for a student using AI
   */
  async generatePersonalOS(moduleId: string, studentId: string, userId: string) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        class: { 
          include: { 
            teacher: true,
            admin: true,
          } 
        },
        lessons: {
          include: {
            cards: {
              where: { studentId },
              include: { student: { include: { parent: true } } },
            },
          },
          orderBy: { lessonNumber: 'asc' },
        },
      },
    });

    if (!module) {
      throw new Error('Модуль не найден');
    }

    const cards = module.lessons.flatMap((l) => l.cards);
    const student = cards[0]?.student;
    const parent = student?.parent;

    if (!student || !parent) {
      throw new Error('Ученик или родитель не найден');
    }

    // Собираем данные по урокам
    const lessonsData = module.lessons.map((lesson) => {
      const card = lesson.cards[0];
      return {
        lessonNumber: lesson.lessonNumber,
        topic: lesson.topic,
        description: lesson.description || undefined,
        percentCompletion: card?.percentCompletion || 0,
        wasPresent: card?.wasPresent ?? false,
      };
    });

    // Считаем статистику
    const attendedLessons = lessonsData.filter(l => l.wasPresent);
    const avgCompletion = attendedLessons.length > 0
      ? Math.round(attendedLessons.reduce((sum, l) => sum + l.percentCompletion, 0) / attendedLessons.length)
      : 0;

    // Собираем навыки
    const allSkills = [...new Set(cards.flatMap((card) => (card.skills as string[]) || []))];

    // Try AI generation first
    try {
      const aiSettings = await this.aiService.getSettings();
      
      if (aiSettings.isEnabled) {
        const osText = await this.aiService.generatePersonalOS({
          adminName: module.class.admin.name,
          teacherName: module.class.teacher.name,
          studentName: student.name,
          parentName: parent.name,
          parentType: parent.parentType,
          moduleName: module.title,
          lessonsData,
          avgCompletion,
          totalLessons: module.lessons.length,
          attendedLessons: attendedLessons.length,
        });

        return {
          text: osText,
          studentId: student.id,
          studentName: student.name,
          parentName: parent.name,
          parentType: parent.parentType,
          moduleTitle: module.title,
          percentCompletion: avgCompletion,
          generatedBy: 'AI',
          provider: aiSettings.provider,
        };
      }
    } catch (error: any) {
      this.logger.error('AI generation failed:', error.message);
    }

    // Fallback to template-based generation
    return this.generatePersonalOSWithTemplate(module, student, parent, avgCompletion, allSkills, lessonsData);
  }

  /**
   * Generate personal OS using template (fallback)
   */
  private async generatePersonalOSWithTemplate(
    module: any,
    student: any,
    parent: any,
    avgCompletion: number,
    skills: string[],
    lessonsData: Array<{ lessonNumber: number; topic: string; percentCompletion: number; wasPresent: boolean }>,
  ) {
    const adminName = module.class.admin?.name || 'Координатор';
    const teacherName = module.class.teacher?.name || 'Преподаватель';
    const attendedCount = lessonsData.filter(l => l.wasPresent).length;

    // Формируем текст по урокам
    const ordinals: Record<number, string> = {
      1: 'первом', 2: 'втором', 3: 'третьем', 4: 'четвёртом',
      5: 'пятом', 6: 'шестом', 7: 'седьмом', 8: 'восьмом',
    };

    const lessonsText = lessonsData
      .map((l) => {
        const ord = ordinals[l.lessonNumber] || `${l.lessonNumber}-м`;
        if (!l.wasPresent) {
          return `— На ${ord} уроке ${student.name} отсутствовал - тема занятия: ${l.topic}`;
        }
        return `— На ${ord} уроке ${student.name} изучал тему "${l.topic}". ${l.percentCompletion}% выполнения практических заданий`;
      })
      .join('\n\n');

    // Формируем рекомендации
    let result = '';
    let recommendations = '';
    
    if (avgCompletion >= 95) {
      result = `${student.name} показал высокий уровень выполнения заданий`;
      recommendations = `Планируем перевод на более сложный трек обучения для поддержания высокого уровня мотивации`;
    } else if (avgCompletion >= 80) {
      result = `${student.name} активно работает на уроках и показывает хорошие результаты`;
      recommendations = `Продолжать в том же духе`;
    } else {
      const lowLessons = lessonsData.filter(l => l.wasPresent && l.percentCompletion < 80);
      if (lowLessons.length > 0) {
        result = `${student.name} активно работает на уроках, однако есть пробелы по некоторым темам`;
        recommendations = `Рекомендую самостоятельно повторить теорию и доделать практику по урокам с низким процентом выполнения`;
      } else {
        result = `${student.name} работает на уроках`;
        recommendations = `Рекомендую уделять больше времени практическим заданиям`;
      }
    }

    const missedLessons = lessonsData.filter(l => !l.wasPresent);
    if (missedLessons.length > 0) {
      recommendations += `. Приглашаю ${student.name} на отработку пропущенных уроков`;
    }

    const text = `${parent.name}, доброе утро, на связи ${adminName} ☀

Делюсь обратной связью после ${module.lessons.length} занятий по модулю «${module.title}» от педагога ${teacherName} 💻

Средний процент выполнения заданий ${student.name} на образовательной платформе за ${attendedCount} занятия — ${avgCompletion}%

${lessonsText}

Образовательный результат: ${result}

Рекомендации: ${recommendations}

Желаем ${student.name} успехов в дальнейшем обучении и всегда рады вашей обратной связи 🤝🏻`;

    return {
      text,
      studentId: student.id,
      studentName: student.name,
      parentName: parent.name,
      parentType: parent.parentType,
      moduleTitle: module.title,
      percentCompletion: avgCompletion,
      generatedBy: 'TEMPLATE',
    };
  }

  // Удаляем старую логику с шаблонами - теперь используем прямую генерацию
  private async generatePersonalOSWithTemplateOld(
    module: any,
    student: any,
    parent: any,
    progress: number,
    skills: string[],
    lessonsInfo: string,
  ) {
    const templates = await this.templatesService.findByParentType(parent.parentType);
    const template = templates[0];

    if (!template) {
      // Simple fallback text
      const text = `Итоговый отчёт по модулю «${module.title}» для ${student.name}`;

      return {
        text,
        studentId: student.id,
        studentName: student.name,
        parentName: parent.name,
        parentType: parent.parentType,
        moduleTitle: module.title,
        percentCompletion: progress,
        generatedBy: 'TEMPLATE',
      };
    }

    const text = template.content
      .replace(/{module_title}/g, module.title)
      .replace(/{student_name}/g, student.name)
      .replace(/{module_topics_summary}/g, lessonsInfo)
      .replace(/{achievements_list}/g, skills.join(', ') || 'базовые навыки')
      .replace(/{student_percent}/g, String(progress))
      .replace(/{teacher_name}/g, module.class.teacher.name);

    return {
      text,
      studentId: student.id,
      studentName: student.name,
      parentName: parent.name,
      parentType: parent.parentType,
      moduleTitle: module.title,
      percentCompletion: progress,
      generatedBy: 'TEMPLATE',
      templateId: template.id,
    };
  }

  /**
   * Send class summary to WhatsApp
   */
  async sendClassSummary(lessonId: string, chatId: string, teacherId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { class: { include: { teacher: true } } },
    });

    if (!lesson || lesson.class.teacherId !== teacherId) {
      throw new Error('Урок не найден');
    }

    // Generate summary with AI if available
    const summaryData = await this.generateClassSummary(
      { lessonId, useAI: true },
      teacherId,
    );

    // Add to queue
    await this.queueService.addMessage({
      type: 'CLASS_SUMMARY',
      chatId,
      payload: {
        message: summaryData.summary,
        lessonId,
      },
      teacherId,
      lessonId,
    });

    // Mark lesson as sent
    await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { osSentAt: new Date() },
    });

    return { 
      message: 'Сообщение добавлено в очередь отправки',
      generatedBy: summaryData.generatedBy,
    };
  }

  private getActivityText(activityLevel: string): string {
    const map: Record<string, string> = {
      LOW: 'низкая активность',
      MEDIUM: 'средняя активность',
      HIGH: 'высокая активность',
      VERY_HIGH: 'очень высокая активность',
    };
    return map[activityLevel] || activityLevel;
  }
}

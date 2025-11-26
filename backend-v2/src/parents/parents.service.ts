import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Получение данных ученика по токену родителя
   * БЕЗ авторизации! Публичный доступ.
   */
  async getByToken(token: string) {
    // Валидация токена (должен быть UUID/cuid формата)
    if (!token || token.length < 10) {
      throw new NotFoundException('Неверный формат токена');
    }

    const student = await this.prisma.student.findUnique({
      where: { parentToken: token },
      include: {
        classes: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                teacher: {
                  select: { name: true },
                },
              },
            },
          },
        },
        lessonCards: {
          include: {
            lesson: {
              select: {
                lessonNumber: true,
                lessonDate: true,
                topic: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20, // Последние 20 уроков
        },
        personalReports: {
          where: { status: 'SENT' },
          orderBy: { sentAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Ученик не найден');
    }

    // Вычисляем статистику
    const cards = student.lessonCards;
    const avgCompletion = cards.length > 0
      ? cards.reduce((sum, card) => sum + card.completionPercent, 0) / cards.length
      : 0;

    return {
      student: {
        id: student.id,
        name: student.name,
        avatar: student.avatar,
      },
      parent: {
        name: student.parentName,
        phone: student.parentPhone,
        type: student.parentType,
      },
      classes: student.classes.map((cs) => cs.class),
      statistics: {
        totalLessons: cards.length,
        avgCompletion: Math.round(avgCompletion),
        lastLessonDate: cards[0]?.lesson.lessonDate,
      },
      recentLessons: cards.slice(0, 10).map((card) => ({
        lessonNumber: card.lesson.lessonNumber,
        lessonDate: card.lesson.lessonDate,
        topic: card.lesson.topic,
        completionPercent: card.completionPercent,
        activityLevel: card.activityLevel,
        mood: card.mood,
        whatWorked: card.whatWorked,
        toImprove: card.toImprove,
        homework: card.homework,
      })),
      reports: student.personalReports.map((report) => ({
        id: report.id,
        fromLesson: report.fromLesson,
        toLesson: report.toLesson,
        avgCompletion: report.avgCompletion,
        pdfUrl: report.pdfUrl,
        sentAt: report.sentAt,
      })),
    };
  }
}


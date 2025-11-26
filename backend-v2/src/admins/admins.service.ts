import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  /**
   * Создание учителя (только админ своей школы)
   */
  async createTeacher(schoolId: string, data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return this.prisma.teacher.create({
      data: {
        ...data,
        password: hashedPassword,
        schoolId,
      },
    });
  }

  /**
   * Список готовых ОС по 4 урокам
   */
  async getReadyReports(schoolId: string) {
    return this.prisma.personalReport.findMany({
      where: {
        student: { schoolId },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            parentName: true,
            parentPhone: true,
            parentType: true,
            classes: {
              include: {
                class: {
                  select: {
                    id: true,
                    name: true,
                    teacher: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            lessonCards: {
              orderBy: { createdAt: 'desc' },
              take: 4,
              include: {
                lesson: {
                  select: {
                    id: true,
                    lessonNumber: true,
                    lessonDate: true,
                    topic: true,
                    class: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { updatedAt: 'desc' },
      ],
    });
  }

  /**
   * Генерация персональной ОС
   */
  async generateReport(schoolId: string, reportId: string, managerName: string) {
    const report = await this.prisma.personalReport.findUnique({
      where: { id: reportId },
      include: {
        student: {
          include: {
            lessonCards: {
              include: { 
                lesson: {
                  include: {
                    class: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 4,
            },
          },
        },
      },
    });

    if (!report) {
      throw new Error('Отчёт не найден');
    }

    if (report.student.lessonCards.length < 4) {
      throw new Error('Для генерации ОС необходимо минимум 4 урока');
    }

    // Берём последние 4 карточки и сортируем по возрастанию даты урока/номера
    const sortedCards = [...report.student.lessonCards].sort((a, b) => {
      const aDate = a.lesson?.lessonDate ? new Date(a.lesson.lessonDate).getTime() : 0;
      const bDate = b.lesson?.lessonDate ? new Date(b.lesson.lessonDate).getTime() : 0;

      if (aDate === bDate) {
        return (a.lesson?.lessonNumber || 0) - (b.lesson?.lessonNumber || 0);
      }

      return aDate - bDate;
    });

    const lessons = sortedCards.map((card, index) => ({
      number: card.lesson?.lessonNumber || index + 1,
      topic: card.lesson?.topic || 'Урок программирования',
      percent: card.completionPercent,
    }));

    const absences = sortedCards
      .filter((card) => card.completionPercent === 0)
      .map((card) => card.lesson?.lessonNumber || 0);

    const moduleName =
      sortedCards[0]?.lesson?.class?.name || 'Модуль программирования';

    const content = await this.aiService.generatePersonalReport(schoolId, {
      parentName: report.student.parentName,
      studentName: report.student.name,
      managerName,
      moduleName,
      lessons,
      absences,
    });

    // Обновляем отчёт
    return this.prisma.personalReport.update({
      where: { id: reportId },
      data: {
        content,
        status: 'GENERATED',
        generatedAt: new Date(),
      },
    });
  }

  /**
   * Отправка персональной ОС
   */
  async sendReport(schoolId: string, reportId: string, whatsappService: any) {
    const report = await this.prisma.personalReport.findUnique({
      where: { id: reportId },
      include: { student: true },
    });

    if (!report) {
      throw new Error('Отчёт не найден');
    }

    if (!report.content) {
      throw new Error('Сначала сгенерируйте текст ОС');
    }

    if (report.status !== 'GENERATED') {
      throw new Error('Отправлять можно только сгенерированные отчёты');
    }

    const rawPhone = report.student.parentPhone?.replace(/\D/g, '') || '';
    if (!rawPhone) {
      throw new Error('У родителя не указан номер телефона');
    }

    const chatId = rawPhone.endsWith('@c.us') ? rawPhone : `${rawPhone}@c.us`;

    // Добавляем в очередь WhatsApp
    await whatsappService.queueMessage({
      schoolId,
      type: 'PERSONAL_REPORT',
      recipientType: 'personal',
      recipientId: chatId,
      content: report.content,
      fileUrl: report.pdfUrl,
      personalReportId: reportId,
    });

    // Обновляем статус
    return this.prisma.personalReport.update({
      where: { id: reportId },
      data: { status: 'SENT' },
    });
  }

  /**
   * Обновление настроек школы
   */
  async updateSettings(schoolId: string, data: any) {
    return this.prisma.school.update({
      where: { id: schoolId },
      data,
    });
  }
}


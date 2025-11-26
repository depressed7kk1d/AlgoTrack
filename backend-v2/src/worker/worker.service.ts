import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Injectable()
export class WorkerService implements OnModuleInit {
  private isRunning = false;

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsAppService,
  ) {}

  /**
   * Запуск Worker при старте приложения
   */
  async onModuleInit() {
    console.log('🚀 Worker запущен');
    this.startProcessing();
    this.startCronJobs();
  }

  /**
   * Основной цикл обработки очереди
   */
  private async startProcessing() {
    if (this.isRunning) return;
    this.isRunning = true;

    const processMessages = async () => {
      try {
        // Проверяем подключение к БД
        await this.prisma.$queryRaw`SELECT 1`;
        
        // Получаем все школы
        const schools = await this.prisma.school.findMany({
          where: { isActive: true },
        });

        for (const school of schools) {
          // Получаем следующее сообщение для каждой школы
          const message = await this.whatsappService.getNextMessage(school.id);

          if (message) {
            console.log(`📤 Обработка сообщения ${message.id} для школы ${school.name}`);
            
            try {
              await this.whatsappService.sendMessage(message.id);
              console.log(`✅ Сообщение ${message.id} отправлено`);
            } catch (error) {
              console.error(`❌ Ошибка отправки ${message.id}:`, error.message);
            }
          }
        }
      } catch (error: any) {
        // Игнорируем ошибки подключения к БД - просто ждём следующей итерации
        if (error?.code === 'P1001' || error?.message?.includes('database')) {
          // БД недоступна, ждём следующей попытки
          console.warn('⚠️ БД временно недоступна, повтор через 30 секунд...');
          setTimeout(processMessages, 30000);
          return;
        }
        console.error('❌ Ошибка в Worker:', error.message || error);
      }

      // Повторяем через 5 секунд
      setTimeout(processMessages, 5000);
    };

    // Запускаем
    processMessages();
  }

  /**
   * Cron задачи
   */
  private async startCronJobs() {
    // Проверка запланированных сообщений каждую минуту
    setInterval(async () => {
      await this.checkScheduledMessages();
    }, 60 * 1000); // Каждую минуту

    console.log('⏰ Cron задачи запущены');
  }

  /**
   * Проверка запланированных ОС
   */
  private async checkScheduledMessages() {
    try {
      // Находим запланированные ОС которые пора отправить
      const summaries = await this.prisma.lessonSummary.findMany({
        where: {
          status: 'PENDING',
          scheduledAt: {
            lte: new Date(),
          },
        },
        include: {
          lesson: {
            include: {
              class: true,
            },
          },
        },
      });

      for (const summary of summaries) {
        // Добавляем в очередь WhatsApp
        await this.whatsappService.queueMessage({
          schoolId: summary.lesson.class.schoolId,
          type: 'LESSON_SUMMARY',
          recipientType: 'group',
          recipientId: summary.lesson.class.whatsappGroupId || '',
          content: summary.content,
          lessonSummaryId: summary.id,
        });

        // Обновляем статус
        await this.prisma.lessonSummary.update({
          where: { id: summary.id },
          data: { status: 'QUEUED' },
        });

        console.log(`✅ ОС ${summary.id} добавлена в очередь`);
      }
    } catch (error) {
      console.error('❌ Ошибка проверки запланированных:', error);
    }
  }

  /**
   * Проверка готовности ОС по 4 урокам
   */
  async checkPersonalReportsReady() {
    try {
      // Находим всех учеников
      const students = await this.prisma.student.findMany({
        include: {
          lessonCards: {
            orderBy: { createdAt: 'desc' },
            take: 4,
          },
        },
      });

      for (const student of students) {
        // Проверяем: есть ли 4 карточки подряд
        if (student.lessonCards.length === 4) {
          // Проверяем: нет ли уже отчёта
          const existingReport = await this.prisma.personalReport.findFirst({
            where: {
              studentId: student.id,
              status: 'DRAFT',
            },
          });

          if (!existingReport) {
            // Создаём черновик отчёта
            const avgCompletion = student.lessonCards.reduce((sum, card) => sum + card.completionPercent, 0) / 4;

            await this.prisma.personalReport.create({
              data: {
                studentId: student.id,
                fromLesson: 1, // TODO: определять автоматически
                toLesson: 4,
                content: '', // Будет сгенерирован позже
                avgCompletion,
                status: 'DRAFT',
              },
            });

            console.log(`✅ Создан черновик ОС для ученика ${student.name}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Ошибка проверки готовности ОС:', error);
    }
  }
}


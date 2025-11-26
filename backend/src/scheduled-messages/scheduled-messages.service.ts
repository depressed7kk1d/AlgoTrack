import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ScheduledMessagesService {
  private readonly logger = new Logger(ScheduledMessagesService.name);

  constructor(
    private prisma: PrismaService,
    private whatsAppService: WhatsAppService,
  ) {}

  /**
   * Создать запланированное сообщение
   */
  async scheduleMessage(data: {
    chatId: string;
    chatName: string;
    message: string;
    scheduledFor: Date;
    lessonId?: string;
    teacherId: string;
  }) {
    // Проверяем что дата в будущем
    if (new Date(data.scheduledFor) <= new Date()) {
      throw new ForbiddenException('Дата отправки должна быть в будущем');
    }

    // Максимум 4 дня вперёд
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 4);
    if (new Date(data.scheduledFor) > maxDate) {
      throw new ForbiddenException('Максимум 4 дня вперёд');
    }

    const scheduled = await this.prisma.messageQueue.create({
      data: {
        type: 'CLASS_SUMMARY',
        chatId: data.chatId,
        payload: {
          message: data.message,
          chatName: data.chatName,
        },
        status: 'SCHEDULED',
        scheduledFor: new Date(data.scheduledFor),
        teacherId: data.teacherId,
        lessonId: data.lessonId,
      },
    });

    this.logger.log(`Message scheduled for ${data.scheduledFor}: ${scheduled.id}`);

    return {
      id: scheduled.id,
      scheduledFor: scheduled.scheduledFor,
      chatId: data.chatId,
      chatName: data.chatName,
      status: 'SCHEDULED',
    };
  }

  /**
   * Получить запланированные сообщения учителя
   */
  async getTeacherScheduledMessages(teacherId: string) {
    return this.prisma.messageQueue.findMany({
      where: {
        teacherId,
        status: { in: ['SCHEDULED', 'PENDING'] },
      },
      orderBy: { scheduledFor: 'asc' },
      select: {
        id: true,
        chatId: true,
        payload: true,
        status: true,
        scheduledFor: true,
        createdAt: true,
      },
    });
  }

  /**
   * Отменить запланированное сообщение
   */
  async cancelScheduledMessage(messageId: string, teacherId: string) {
    const message = await this.prisma.messageQueue.findFirst({
      where: { id: messageId, teacherId },
    });

    if (!message) {
      throw new NotFoundException('Сообщение не найдено');
    }

    if (message.status !== 'SCHEDULED') {
      throw new ForbiddenException('Можно отменить только запланированные сообщения');
    }

    await this.prisma.messageQueue.update({
      where: { id: messageId },
      data: { status: 'CANCELLED' },
    });

    return { success: true, message: 'Сообщение отменено' };
  }

  /**
   * Cron job - проверяем и отправляем запланированные сообщения
   * Запускается каждую минуту
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledMessages() {
    const now = new Date();

    // Получаем сообщения для отправки
    const messages = await this.prisma.messageQueue.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: { lte: now },
      },
      orderBy: { scheduledFor: 'asc' },
      take: 5, // Максимум 5 за раз (антибан)
    });

    if (messages.length === 0) return;

    this.logger.log(`Processing ${messages.length} scheduled messages`);

    // Получаем настройки антибана
    const antiBanSettings = await this.prisma.antiBanSettings.findFirst();
    const minDelay = (antiBanSettings?.minDelaySeconds || 30) * 1000;
    const maxDelay = (antiBanSettings?.maxDelaySeconds || 120) * 1000;

    for (const msg of messages) {
      try {
        // Отмечаем как "в процессе"
        await this.prisma.messageQueue.update({
          where: { id: msg.id },
          data: { status: 'PROCESSING' },
        });

        const payload = msg.payload as any;
        
        // Получаем учителя чтобы узнать его админа
        const teacher = msg.teacherId 
          ? await this.prisma.teacher.findUnique({ 
              where: { id: msg.teacherId },
              select: { id: true, adminId: true },
            })
          : null;
        
        // Отправляем через GreenAPI (используем настройки админа учителя)
        const userId = teacher?.id || msg.teacherId || '';
        const role = 'TEACHER';
        await this.whatsAppService.sendMessage(msg.chatId, payload.message, userId, role);

        // Отмечаем как отправленное
        await this.prisma.messageQueue.update({
          where: { id: msg.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            processedAt: new Date(),
          },
        });

        this.logger.log(`Message ${msg.id} sent successfully`);

        // Случайная задержка между сообщениями (антибан)
        const delay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (error: any) {
        this.logger.error(`Failed to send message ${msg.id}:`, error.message);

        const newAttempts = msg.attempts + 1;
        await this.prisma.messageQueue.update({
          where: { id: msg.id },
          data: {
            status: newAttempts >= msg.maxAttempts ? 'FAILED' : 'SCHEDULED',
            attempts: newAttempts,
            lastError: error.message,
          },
        });
      }
    }
  }

  /**
   * Немедленная отправка (без планирования)
   */
  async sendNow(data: {
    chatId: string;
    message: string;
    teacherId: string;
    lessonId?: string;
    role?: string;
  }) {
    // Отправляем сразу
    const result = await this.whatsAppService.sendMessage(
      data.chatId, 
      data.message, 
      data.teacherId,
      data.role || 'TEACHER'
    );

    // Сохраняем в историю
    await this.prisma.messageQueue.create({
      data: {
        type: 'CLASS_SUMMARY',
        chatId: data.chatId,
        payload: { message: data.message },
        status: 'SENT',
        sentAt: new Date(),
        processedAt: new Date(),
        teacherId: data.teacherId,
        lessonId: data.lessonId,
      },
    });

    return result;
  }
}


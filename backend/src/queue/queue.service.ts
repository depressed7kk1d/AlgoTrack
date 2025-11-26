import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface AddMessageData {
  type: 'CLASS_SUMMARY' | 'PERSONAL_OS';
  chatId: string; // WhatsApp ID (группа или личка)
  payload: any;
  scheduledFor?: Date;
  teacherId?: string;
  adminId?: string;
  lessonId?: string;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async addMessage(data: AddMessageData) {
    this.logger.log(`Adding message to queue: ${data.type} -> ${data.chatId}`);

    // Проверяем антибан настройки
    const antiBanSettings = await this.prisma.antiBanSettings.findFirst();
    
    // Определяем время отправки
    let scheduledFor = data.scheduledFor;
    
    if (!scheduledFor && antiBanSettings?.isEnabled) {
      // Рассчитываем время с учётом антибана
      scheduledFor = await this.calculateSendTime(antiBanSettings);
    }

    // Сохраняем в базу
    const messageQueue = await this.prisma.messageQueue.create({
      data: {
        type: data.type,
        chatId: data.chatId,
        payload: data.payload,
        status: scheduledFor ? 'SCHEDULED' : 'PENDING',
        scheduledFor,
        teacherId: data.teacherId,
        adminId: data.adminId,
        lessonId: data.lessonId,
      },
    });

    this.logger.log(`Message queued: ${messageQueue.id}`);
    return messageQueue;
  }

  /**
   * Рассчитать время отправки с учётом антибана
   */
  private async calculateSendTime(settings: any): Promise<Date> {
    const now = new Date();
    const currentHour = now.getHours();

    // Проверяем "тихие часы"
    if (currentHour >= settings.pauseStartHour || currentHour < settings.pauseEndHour) {
      // Отправим утром после pauseEndHour
      const tomorrow = new Date(now);
      if (currentHour >= settings.pauseStartHour) {
        tomorrow.setDate(tomorrow.getDate() + 1);
      }
      tomorrow.setHours(settings.pauseEndHour, Math.floor(Math.random() * 30), 0, 0);
      return tomorrow;
    }

    // Получаем последнее отправленное сообщение
    const lastSent = await this.prisma.messageQueue.findFirst({
      where: {
        status: { in: ['SENT', 'SCHEDULED', 'PROCESSING'] },
      },
      orderBy: { scheduledFor: 'desc' },
    });

    // Рассчитываем задержку
    const minDelay = settings.minDelaySeconds * 1000;
    const maxDelay = settings.maxDelaySeconds * 1000;
    const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;

    if (lastSent?.scheduledFor && lastSent.scheduledFor > now) {
      // Если есть запланированные сообщения, добавляем после них
      return new Date(lastSent.scheduledFor.getTime() + randomDelay);
    }

    // Отправляем с небольшой задержкой
    return new Date(now.getTime() + randomDelay);
  }

  /**
   * Получить сообщения для отправки
   */
  async getMessagesToSend(limit = 10) {
    const now = new Date();
    
    return this.prisma.messageQueue.findMany({
      where: {
        OR: [
          { status: 'PENDING' },
          {
            status: 'SCHEDULED',
            scheduledFor: { lte: now },
          },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledFor: 'asc' },
        { createdAt: 'asc' },
      ],
      take: limit,
    });
  }

  /**
   * Отметить сообщение как отправленное
   */
  async markAsSent(id: string) {
    return this.prisma.messageQueue.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        processedAt: new Date(),
      },
    });
  }

  /**
   * Отметить сообщение как ошибочное
   */
  async markAsFailed(id: string, error: string) {
    const message = await this.prisma.messageQueue.findUnique({ where: { id } });
    
    if (!message) return;

    const newAttempts = message.attempts + 1;
    
    return this.prisma.messageQueue.update({
      where: { id },
      data: {
        status: newAttempts >= message.maxAttempts ? 'FAILED' : 'PENDING',
        attempts: newAttempts,
        lastError: error,
        processedAt: new Date(),
      },
    });
  }

  /**
   * Обновить статистику отправки
   */
  async updateMessageStats() {
    const now = new Date();
    const dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hour = now.getHours();

    await this.prisma.messageStats.upsert({
      where: {
        date_hour: {
          date: dateOnly,
          hour,
        },
      },
      update: {
        messagesSent: { increment: 1 },
      },
      create: {
        date: dateOnly,
        hour,
        messagesSent: 1,
      },
    });
  }

  /**
   * Проверить лимиты отправки
   */
  async checkSendLimits(): Promise<{ canSend: boolean; reason?: string }> {
    const settings = await this.prisma.antiBanSettings.findFirst();
    if (!settings?.isEnabled) {
      return { canSend: true };
    }

    const now = new Date();
    const currentHour = now.getHours();

    // Проверка тихих часов
    if (currentHour >= settings.pauseStartHour || currentHour < settings.pauseEndHour) {
      return { canSend: false, reason: 'Тихие часы' };
    }

    // Проверка лимита в час
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const sentThisHour = await this.prisma.messageQueue.count({
      where: {
        status: 'SENT',
        sentAt: { gte: hourAgo },
      },
    });

    if (sentThisHour >= settings.maxMessagesPerHour) {
      return { canSend: false, reason: `Превышен лимит ${settings.maxMessagesPerHour} сообщений в час` };
    }

    // Проверка лимита в день
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sentToday = await this.prisma.messageQueue.count({
      where: {
        status: 'SENT',
        sentAt: { gte: today },
      },
    });

    if (sentToday >= settings.maxMessagesPerDay) {
      return { canSend: false, reason: `Превышен лимит ${settings.maxMessagesPerDay} сообщений в день` };
    }

    return { canSend: true };
  }
}

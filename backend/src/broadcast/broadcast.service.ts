import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { Cron, CronExpression } from '@nestjs/schedule';

interface BroadcastMessage {
  text: string;
  imageUrl?: string;
}

@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);

  constructor(
    private prisma: PrismaService,
    private whatsAppService: WhatsAppService,
  ) {}

  /**
   * Создать рассылку
   */
  async createBroadcast(data: {
    name: string;
    messages: BroadcastMessage[]; // Несколько вариантов сообщений для антибана
    targetType: 'ALL_GROUPS' | 'SELECTED_GROUPS' | 'ALL_PARENTS';
    targetIds?: string[]; // ID групп если SELECTED_GROUPS
    scheduledFor?: Date;
    adminId: string;
  }) {
    if (!data.messages || data.messages.length === 0) {
      throw new BadRequestException('Нужен хотя бы один вариант сообщения');
    }

    // Создаём рассылку
    const broadcast = await this.prisma.broadcast.create({
      data: {
        name: data.name,
        messages: data.messages as any,
        targetType: data.targetType,
        targetIds: data.targetIds || [],
        status: data.scheduledFor ? 'SCHEDULED' : 'PENDING',
        scheduledFor: data.scheduledFor,
        adminId: data.adminId,
        totalRecipients: 0,
        sentCount: 0,
        failedCount: 0,
      },
    });

    this.logger.log(`Broadcast created: ${broadcast.id}`);
    return broadcast;
  }

  /**
   * Получить рассылки админа
   */
  async getAdminBroadcasts(adminId: string) {
    return this.prisma.broadcast.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Получить детали рассылки
   */
  async getBroadcastDetails(broadcastId: string, adminId: string) {
    const broadcast = await this.prisma.broadcast.findFirst({
      where: { id: broadcastId, adminId },
      include: {
        recipients: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!broadcast) {
      throw new BadRequestException('Рассылка не найдена');
    }

    return broadcast;
  }

  /**
   * Запустить рассылку
   */
  async startBroadcast(broadcastId: string, adminId: string) {
    const broadcast = await this.prisma.broadcast.findFirst({
      where: { id: broadcastId, adminId },
    });

    if (!broadcast) {
      throw new BadRequestException('Рассылка не найдена');
    }

    if (broadcast.status !== 'PENDING' && broadcast.status !== 'SCHEDULED') {
      throw new BadRequestException('Рассылка уже запущена или завершена');
    }

    // Получаем список получателей
    let recipients: Array<{ chatId: string; name: string }> = [];

    if (broadcast.targetType === 'ALL_GROUPS' || broadcast.targetType === 'SELECTED_GROUPS') {
      // Получаем группы WhatsApp
      try {
        const groups = await this.whatsAppService.getGroups(adminId, 'ADMIN');
        
        if (broadcast.targetType === 'SELECTED_GROUPS' && broadcast.targetIds.length > 0) {
          recipients = groups
            .filter(g => broadcast.targetIds.includes(g.id))
            .map(g => ({ chatId: g.id, name: g.name }));
        } else {
          recipients = groups.map(g => ({ chatId: g.id, name: g.name }));
        }
      } catch (error) {
        this.logger.error('Failed to get groups:', error);
        throw new BadRequestException('Не удалось получить список групп');
      }
    } else if (broadcast.targetType === 'ALL_PARENTS') {
      // Получаем родителей из классов этого админа
      const parents = await this.prisma.parent.findMany({
        where: {
          students: {
            some: {
              classStudents: {
                some: {
                  class: { adminId },
                },
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          phone: true,
        },
      });

      recipients = parents
        .filter(p => p.phone)
        .map(p => ({
          chatId: p.phone!.replace(/[^0-9]/g, '') + '@c.us',
          name: p.name,
        }));
    }

    if (recipients.length === 0) {
      throw new BadRequestException('Нет получателей для рассылки');
    }

    // Создаём записи получателей
    const messages = broadcast.messages as unknown as BroadcastMessage[];
    
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      // Выбираем случайный вариант сообщения (антибан)
      const messageIndex = i % messages.length;
      
      await this.prisma.broadcastRecipient.create({
        data: {
          broadcastId,
          chatId: recipient.chatId,
          recipientName: recipient.name,
          messageVariant: messageIndex,
          status: 'PENDING',
        },
      });
    }

    // Обновляем статус рассылки
    await this.prisma.broadcast.update({
      where: { id: broadcastId },
      data: {
        status: 'IN_PROGRESS',
        totalRecipients: recipients.length,
        startedAt: new Date(),
      },
    });

    this.logger.log(`Broadcast ${broadcastId} started with ${recipients.length} recipients`);

    return {
      success: true,
      totalRecipients: recipients.length,
    };
  }

  /**
   * Отменить рассылку
   */
  async cancelBroadcast(broadcastId: string, adminId: string) {
    const broadcast = await this.prisma.broadcast.findFirst({
      where: { id: broadcastId, adminId },
    });

    if (!broadcast) {
      throw new BadRequestException('Рассылка не найдена');
    }

    await this.prisma.broadcast.update({
      where: { id: broadcastId },
      data: { status: 'CANCELLED' },
    });

    return { success: true };
  }

  /**
   * Cron job - обрабатываем рассылки
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processBroadcasts() {
    // Находим активные рассылки
    const broadcasts = await this.prisma.broadcast.findMany({
      where: {
        status: 'IN_PROGRESS',
      },
      include: {
        admin: true,
      },
    });

    for (const broadcast of broadcasts) {
      await this.processSingleBroadcast(broadcast);
    }

    // Запускаем запланированные рассылки
    const scheduledBroadcasts = await this.prisma.broadcast.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: { lte: new Date() },
      },
    });

    for (const broadcast of scheduledBroadcasts) {
      await this.startBroadcast(broadcast.id, broadcast.adminId);
    }
  }

  /**
   * Обработать одну рассылку
   */
  private async processSingleBroadcast(broadcast: any) {
    // Получаем антибан настройки
    const antiBanSettings = await this.prisma.antiBanSettings.findFirst();
    const minDelay = (antiBanSettings?.minDelaySeconds || 30) * 1000;
    const maxDelay = (antiBanSettings?.maxDelaySeconds || 120) * 1000;
    const maxPerHour = antiBanSettings?.maxMessagesPerHour || 20;

    // Проверяем лимит сообщений в час
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const sentThisHour = await this.prisma.broadcastRecipient.count({
      where: {
        broadcastId: broadcast.id,
        status: 'SENT',
        sentAt: { gte: hourAgo },
      },
    });

    if (sentThisHour >= maxPerHour) {
      this.logger.log(`Broadcast ${broadcast.id}: hourly limit reached (${sentThisHour}/${maxPerHour})`);
      return;
    }

    // Берём следующего получателя
    const recipient = await this.prisma.broadcastRecipient.findFirst({
      where: {
        broadcastId: broadcast.id,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!recipient) {
      // Все отправлены - завершаем рассылку
      await this.prisma.broadcast.update({
        where: { id: broadcast.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
      this.logger.log(`Broadcast ${broadcast.id} completed`);
      return;
    }

    // Отмечаем как "в процессе"
    await this.prisma.broadcastRecipient.update({
      where: { id: recipient.id },
      data: { status: 'SENDING' },
    });

    try {
      const messages = broadcast.messages as unknown as BroadcastMessage[];
      const message = messages[recipient.messageVariant];

      // Отправляем через WhatsApp
      if (message.imageUrl) {
        // TODO: Отправка с изображением
        await this.whatsAppService.sendMessage(
          recipient.chatId,
          message.text,
          broadcast.adminId,
          'ADMIN'
        );
      } else {
        await this.whatsAppService.sendMessage(
          recipient.chatId,
          message.text,
          broadcast.adminId,
          'ADMIN'
        );
      }

      // Успешно отправлено
      await this.prisma.broadcastRecipient.update({
        where: { id: recipient.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      await this.prisma.broadcast.update({
        where: { id: broadcast.id },
        data: { sentCount: { increment: 1 } },
      });

      this.logger.log(`Broadcast ${broadcast.id}: sent to ${recipient.chatId}`);

    } catch (error: any) {
      this.logger.error(`Broadcast ${broadcast.id}: failed to send to ${recipient.chatId}:`, error.message);

      await this.prisma.broadcastRecipient.update({
        where: { id: recipient.id },
        data: {
          status: 'FAILED',
          error: error.message,
        },
      });

      await this.prisma.broadcast.update({
        where: { id: broadcast.id },
        data: { failedCount: { increment: 1 } },
      });
    }

    // Случайная задержка перед следующим (антибан)
    const delay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}


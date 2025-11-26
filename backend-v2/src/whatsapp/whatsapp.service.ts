import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
  ) {}

  /**
   * Получение списка чатов/групп через GreenAPI
   */
  async getChats(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school?.greenApiInstanceId || !school?.greenApiToken) {
      throw new Error('GreenAPI не настроен для школы');
    }

    // Расшифровываем токен
    const apiToken = this.crypto.decrypt(school.greenApiToken);

    const url = `https://api.green-api.com/waInstance${school.greenApiInstanceId}/getChats/${apiToken}`;
    
    try {
      const response = await axios.get(url);
      
      // Фильтруем только группы
      const groups = response.data.filter((chat: any) => chat.id.includes('@g.us'));
      
      return groups.map((group: any) => ({
        chatId: group.id,
        name: group.name,
        type: 'group',
      }));
    } catch (error) {
      console.error('Ошибка получения чатов:', error);
      throw error;
    }
  }

  /**
   * Парсинг WhatsApp группы по ссылке
   * Ссылка может быть в формате: https://chat.whatsapp.com/INVITE_CODE
   * Или прямой ID группы: 79991234567-1234567890@g.us
   */
  async parseGroupFromLink(schoolId: string, groupLink: string): Promise<{
    groupId: string;
    groupName: string;
  }> {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school?.greenApiInstanceId || !school?.greenApiToken) {
      throw new Error('GreenAPI не настроен для школы');
    }

    // Расшифровываем токен
    const apiToken = this.crypto.decrypt(school.greenApiToken);

    // Если это уже ID группы (содержит @g.us)
    if (groupLink.includes('@g.us')) {
      // Получаем информацию о группе
      try {
        const url = `https://api.green-api.com/waInstance${school.greenApiInstanceId}/getGroupInfo/${apiToken}`;
        const response = await axios.post(url, {
          groupId: groupLink,
        });

        return {
          groupId: groupLink,
          groupName: response.data.name || 'Группа WhatsApp',
        };
      } catch (error) {
        // Если не удалось получить информацию, возвращаем ID и дефолтное имя
        return {
          groupId: groupLink,
          groupName: 'Группа WhatsApp',
        };
      }
    }

    // Если это ссылка вида https://chat.whatsapp.com/INVITE_CODE
    // Извлекаем invite код
    const inviteMatch = groupLink.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/);
    if (!inviteMatch) {
      throw new Error('Неверный формат ссылки на WhatsApp группу');
    }

    const inviteCode = inviteMatch[1];

    try {
      // Получаем информацию о группе по invite коду
      // GreenAPI может не поддерживать прямое получение по invite, поэтому
      // попробуем получить список всех групп и найти нужную
      const chats = await this.getChats(schoolId);
      
      // Если не нашли в списке, возвращаем дефолтные значения
      // Пользователь должен будет указать ID группы вручную
      return {
        groupId: '', // Будет заполнено вручную
        groupName: 'Группа WhatsApp',
      };
    } catch (error) {
      console.error('Ошибка парсинга группы:', error);
      throw new Error('Не удалось получить информацию о группе. Укажите ID группы вручную.');
    }
  }

  /**
   * Проверка состояния WhatsApp инстанса
   */
  async checkConnection(instanceId: string, apiToken: string): Promise<boolean> {
    try {
      const url = `https://api.green-api.com/waInstance${instanceId}/getStateInstance/${apiToken}`;
      const response = await axios.get(url);
      
      return response.data.stateInstance === 'authorized';
    } catch (error) {
      return false;
    }
  }

  /**
   * Добавление сообщения в очередь (для антибана)
   */
  async queueMessage(data: {
    schoolId: string;
    type: 'LESSON_SUMMARY' | 'PERSONAL_REPORT';
    recipientType: 'group' | 'personal';
    recipientId: string;
    content: string;
    fileUrl?: string;
    scheduledAt?: Date;
    lessonSummaryId?: string;
    personalReportId?: string;
  }) {
    return this.prisma.messageQueue.create({
      data: {
        schoolId: data.schoolId,
        type: data.type,
        recipientType: data.recipientType,
        recipientId: data.recipientId,
        content: data.content,
        fileUrl: data.fileUrl,
        scheduledAt: data.scheduledAt || new Date(),
        lessonSummaryId: data.lessonSummaryId,
        personalReportId: data.personalReportId,
      },
    });
  }

  /**
   * Получение следующего сообщения из очереди
   */
  async getNextMessage(schoolId: string) {
    // Проверяем rate limit
    const canSend = await this.checkRateLimit(schoolId);
    
    if (!canSend) {
      return null;
    }

    // Получаем следующее сообщение
    return this.prisma.messageQueue.findFirst({
      where: {
        schoolId,
        status: 'PENDING',
        scheduledAt: {
          lte: new Date(),
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });
  }

  /**
   * Отправка сообщения через GreenAPI
   */
  async sendMessage(messageId: string) {
    const message = await this.prisma.messageQueue.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Сообщение не найдено');
    }

    const school = await this.prisma.school.findUnique({
      where: { id: message.schoolId },
    });

    if (!school?.greenApiInstanceId || !school?.greenApiToken) {
      throw new Error('GreenAPI не настроен');
    }

    // Расшифровываем токен
    const apiToken = this.crypto.decrypt(school.greenApiToken);

    // Обновляем статус
    await this.prisma.messageQueue.update({
      where: { id: messageId },
      data: { status: 'PROCESSING' },
    });

    try {
      // Случайная задержка для имитации человека (10-30 сек)
      await this.randomDelay(10000, 30000);

      // Показываем "набор текста" (если API поддерживает)
      await this.sendTyping(school, message.recipientId);
      
      // Ещё небольшая задержка
      await this.randomDelay(3000, 7000);

      // Отправляем сообщение
      const url = `https://api.green-api.com/waInstance${school.greenApiInstanceId}/sendMessage/${apiToken}`;
      
      const response = await axios.post(url, {
        chatId: message.recipientId,
        message: message.content,
      });

      // Если есть файл - отправляем отдельно
      if (message.fileUrl) {
        await this.sendFile(school, message.recipientId, message.fileUrl);
      }

      // Обновляем статус
      await this.prisma.messageQueue.update({
        where: { id: messageId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      // Обновляем статус LessonSummary, если есть
      if (message.lessonSummaryId) {
        await this.prisma.lessonSummary.update({
          where: { id: message.lessonSummaryId },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            whatsappMessageId: response.data.idMessage,
          },
        });
      }

      // Обновляем статус PersonalReport, если есть
      if (message.personalReportId) {
        await this.prisma.personalReport.update({
          where: { id: message.personalReportId },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            whatsappMessageId: response.data.idMessage,
          },
        });
      }

      // Увеличиваем счётчик отправленных сообщений
      await this.incrementSentCount(message.schoolId);

      return response.data;
    } catch (error) {
      // Логируем ошибку
      await this.prisma.messageQueue.update({
        where: { id: messageId },
        data: {
          status: 'FAILED',
          attempts: message.attempts + 1,
          lastError: error.message,
        },
      });

      // Обновляем статус LessonSummary при ошибке
      if (message.lessonSummaryId) {
        await this.prisma.lessonSummary.update({
          where: { id: message.lessonSummaryId },
          data: {
            whatsappError: error.message,
          },
        });
      }

      // Обновляем статус PersonalReport при ошибке
      if (message.personalReportId) {
        await this.prisma.personalReport.update({
          where: { id: message.personalReportId },
          data: {
            whatsappError: error.message,
          },
        });
      }

      // Логируем в error_logs
      await this.prisma.errorLog.create({
        data: {
          schoolId: message.schoolId,
          type: 'WHATSAPP_SEND_ERROR',
          error: error.message,
          metadata: { messageId },
        },
      });

      throw error;
    }
  }

  /**
   * Отправка файла через GreenAPI
   */
  private async sendFile(school: any, chatId: string, fileUrl: string) {
    const apiToken = this.crypto.decrypt(school.greenApiToken);
    const url = `https://api.green-api.com/waInstance${school.greenApiInstanceId}/sendFileByUrl/${apiToken}`;
    
    await axios.post(url, {
      chatId,
      urlFile: fileUrl,
      fileName: 'Отчет.pdf',
    });
  }

  /**
   * Показ "набор текста" через GreenAPI
   */
  private async sendTyping(school: any, chatId: string) {
    try {
      // GreenAPI не поддерживает typing, пропускаем
      return;
    } catch (error) {
      // Игнорируем ошибки typing
    }
  }

  /**
   * Проверка rate limit (антибан)
   */
  private async checkRateLimit(schoolId: string): Promise<boolean> {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) return false;

    // Подсчитываем сколько отправлено за последний час
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const sentLastHour = await this.prisma.messageQueue.count({
      where: {
        schoolId,
        status: 'SENT',
        sentAt: {
          gte: oneHourAgo,
        },
      },
    });

    // Проверяем лимиты
    if (sentLastHour >= school.maxMessagesPerHour) {
      console.log(`⚠️ Rate limit превышен для школы ${schoolId}: ${sentLastHour}/${school.maxMessagesPerHour}`);
      return false;
    }

    return true;
  }

  /**
   * Увеличение счётчика отправленных сообщений
   */
  private async incrementSentCount(schoolId: string) {
    // Можно добавить Redis для более точного подсчёта
    // Пока просто логируем
    console.log(`✅ Сообщение отправлено для школы ${schoolId}`);
  }

  /**
   * Случайная задержка (имитация человека)
   */
  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}


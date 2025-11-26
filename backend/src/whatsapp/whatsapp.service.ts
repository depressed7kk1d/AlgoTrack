import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface GreenApiSettings {
  idInstance: string;
  apiTokenInstance: string;
  apiUrl?: string;
}

export interface WhatsAppGroup {
  id: string;
  name: string;
  owner?: string;
  participantsCount?: number;
}

// GreenAPI Response types
interface StateInstanceResponse {
  stateInstance: 'authorized' | 'notAuthorized' | 'blocked' | 'sleepMode' | 'starting';
}

interface QrCodeResponse {
  type: 'qrCode' | 'alreadyLogged' | 'error';
  message: string;
}

interface ChatItem {
  id: string;
  name: string;
  archive: boolean;
}

interface SendMessageResponse {
  idMessage: string;
}

interface CheckWhatsappResponse {
  existsWhatsapp: boolean;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  /**
   * Получить настройки GreenAPI для конкретного админа
   * Если adminId не указан - возвращает глобальные настройки (SuperAdmin)
   */
  async getSettings(adminId?: string) {
    let settings;
    
    if (adminId) {
      // Ищем настройки для конкретного админа
      settings = await this.prisma.whatsAppSettings.findUnique({
        where: { adminId },
      });
    }
    
    // Если нет настроек админа - ищем глобальные (adminId = null)
    if (!settings) {
      settings = await this.prisma.whatsAppSettings.findFirst({
        where: { adminId: null },
      });
    }
    
    return {
      isEnabled: settings?.isEnabled || false,
      idInstance: settings?.greenApiId || '',
      apiTokenInstance: settings?.greenApiToken ? '***скрыто***' : '',
      hasCredentials: !!(settings?.greenApiId && settings?.greenApiToken),
      isOwnSettings: adminId ? !!settings?.adminId : true,
    };
  }

  /**
   * Сохранить настройки GreenAPI
   * Админ сохраняет свои настройки, SuperAdmin - глобальные
   */
  async updateSettings(data: { 
    idInstance?: string; 
    apiTokenInstance?: string; 
    isEnabled?: boolean;
  }, adminId?: string) {
    // Для админа - ищем/создаём его личные настройки
    if (adminId) {
      const existing = await this.prisma.whatsAppSettings.findUnique({
        where: { adminId },
      });
      
      if (existing) {
        return this.prisma.whatsAppSettings.update({
          where: { adminId },
          data: {
            greenApiId: data.idInstance ?? existing.greenApiId,
            greenApiToken: data.apiTokenInstance ?? existing.greenApiToken,
            isEnabled: data.isEnabled ?? existing.isEnabled,
          },
        });
      }
      
      return this.prisma.whatsAppSettings.create({
        data: {
          adminId,
          greenApiId: data.idInstance,
          greenApiToken: data.apiTokenInstance,
          isEnabled: data.isEnabled ?? false,
        },
      });
    }
    
    // Для SuperAdmin - глобальные настройки (adminId = null)
    const existing = await this.prisma.whatsAppSettings.findFirst({
      where: { adminId: null },
    });
    
    if (existing) {
      return this.prisma.whatsAppSettings.update({
        where: { id: existing.id },
        data: {
          greenApiId: data.idInstance ?? existing.greenApiId,
          greenApiToken: data.apiTokenInstance ?? existing.greenApiToken,
          isEnabled: data.isEnabled ?? existing.isEnabled,
        },
      });
    }
    
    return this.prisma.whatsAppSettings.create({
      data: {
        greenApiId: data.idInstance,
        greenApiToken: data.apiTokenInstance,
        isEnabled: data.isEnabled ?? false,
      },
    });
  }

  /**
   * Получить credentials для админа или учителя
   * Учитель использует настройки своего админа
   */
  async getCredentialsForUser(userId: string, role: string): Promise<GreenApiSettings | null> {
    let adminId: string | null = null;
    
    if (role === 'ADMIN') {
      adminId = userId;
    } else if (role === 'TEACHER') {
      // Учитель - получаем его админа
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: userId },
        select: { adminId: true },
      });
      adminId = teacher?.adminId || null;
    }
    // SUPER_ADMIN использует глобальные настройки (adminId = null)
    
    // Ищем настройки
    let settings;
    
    if (adminId) {
      settings = await this.prisma.whatsAppSettings.findUnique({
        where: { adminId },
      });
    }
    
    // Fallback на глобальные настройки
    if (!settings) {
      settings = await this.prisma.whatsAppSettings.findFirst({
        where: { adminId: null },
      });
    }
    
    if (!settings?.greenApiId || !settings?.greenApiToken) {
      return null;
    }
    
    return {
      idInstance: settings.greenApiId,
      apiTokenInstance: settings.greenApiToken,
      apiUrl: 'https://api.green-api.com',
    };
  }

  /**
   * Получить состояние инстанса
   */
  async getInstanceState(userId?: string, role?: string) {
    const creds = userId && role 
      ? await this.getCredentialsForUser(userId, role)
      : await this.getCredentialsForUser('', 'SUPER_ADMIN');
      
    if (!creds) {
      return { authorized: false, error: 'Не настроены учётные данные GreenAPI' };
    }

    try {
      const url = `${creds.apiUrl}/waInstance${creds.idInstance}/getStateInstance/${creds.apiTokenInstance}`;
      const response = await firstValueFrom(
        this.httpService.get<StateInstanceResponse>(url)
      );
      
      return {
        authorized: response.data.stateInstance === 'authorized',
        stateInstance: response.data.stateInstance,
      };
    } catch (error: any) {
      this.logger.error('GreenAPI getStateInstance error:', error.message);
      return { authorized: false, error: error.message };
    }
  }

  /**
   * Получить QR-код для авторизации
   */
  async getQrCode(userId?: string, role?: string) {
    const creds = userId && role 
      ? await this.getCredentialsForUser(userId, role)
      : await this.getCredentialsForUser('', 'SUPER_ADMIN');
      
    if (!creds) {
      throw new BadRequestException('Не настроены учётные данные GreenAPI');
    }

    try {
      const url = `${creds.apiUrl}/waInstance${creds.idInstance}/qr/${creds.apiTokenInstance}`;
      const response = await firstValueFrom(
        this.httpService.get<QrCodeResponse>(url)
      );
      
      if (response.data.type === 'qrCode') {
        return {
          qrCode: response.data.message,
          type: 'qrCode',
        };
      } else if (response.data.type === 'alreadyLogged') {
        return {
          type: 'alreadyLogged',
          message: 'Инстанс уже авторизован',
        };
      }
      
      return response.data;
    } catch (error: any) {
      this.logger.error('GreenAPI QR error:', error.message);
      throw new BadRequestException('Ошибка получения QR-кода: ' + error.message);
    }
  }

  /**
   * Разлогинить инстанс
   */
  async logout(userId?: string, role?: string) {
    const creds = userId && role 
      ? await this.getCredentialsForUser(userId, role)
      : await this.getCredentialsForUser('', 'SUPER_ADMIN');
      
    if (!creds) {
      throw new BadRequestException('Не настроены учётные данные GreenAPI');
    }

    try {
      const url = `${creds.apiUrl}/waInstance${creds.idInstance}/logout/${creds.apiTokenInstance}`;
      const response = await firstValueFrom(
        this.httpService.get<{ isLogout: boolean }>(url)
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('GreenAPI logout error:', error.message);
      throw new BadRequestException('Ошибка выхода: ' + error.message);
    }
  }

  /**
   * Получить список групп
   */
  async getGroups(userId: string, role: string): Promise<WhatsAppGroup[]> {
    const creds = await this.getCredentialsForUser(userId, role);
    if (!creds) {
      throw new BadRequestException('Не настроены учётные данные GreenAPI');
    }

    // Сначала проверим авторизацию
    const state = await this.getInstanceState(userId, role);
    if (!state.authorized) {
      throw new BadRequestException('Инстанс не авторизован. Отсканируйте QR-код.');
    }

    try {
      const url = `${creds.apiUrl}/waInstance${creds.idInstance}/getChats/${creds.apiTokenInstance}`;
      const response = await firstValueFrom(
        this.httpService.get<ChatItem[]>(url)
      );
      
      // Фильтруем только группы (id содержит @g.us)
      const groups = response.data
        .filter((chat) => chat.id.includes('@g.us'))
        .map((chat) => ({
          id: chat.id,
          name: chat.name || 'Без названия',
        }));

      return groups;
    } catch (error: any) {
      this.logger.error('GreenAPI getChats error:', error.message);
      throw new BadRequestException('Ошибка получения списка групп: ' + error.message);
    }
  }

  /**
   * Отправить сообщение в группу
   */
  async sendMessage(chatId: string, message: string, userId: string, role: string) {
    const creds = await this.getCredentialsForUser(userId, role);
    if (!creds) {
      throw new BadRequestException('Не настроены учётные данные GreenAPI');
    }

    // Проверяем авторизацию
    const state = await this.getInstanceState(userId, role);
    if (!state.authorized) {
      throw new BadRequestException('Инстанс не авторизован');
    }

    try {
      const url = `${creds.apiUrl}/waInstance${creds.idInstance}/sendMessage/${creds.apiTokenInstance}`;
      const response = await firstValueFrom(
        this.httpService.post<SendMessageResponse>(url, {
          chatId,
          message,
        })
      );

      this.logger.log(`Message sent to ${chatId}: ${response.data.idMessage}`);
      
      return {
        success: true,
        idMessage: response.data.idMessage,
      };
    } catch (error: any) {
      this.logger.error('GreenAPI sendMessage error:', error.message);
      throw new BadRequestException('Ошибка отправки сообщения: ' + error.message);
    }
  }

  /**
   * Проверить есть ли номер в WhatsApp
   */
  async checkWhatsApp(phoneNumber: string, userId: string, role: string) {
    const creds = await this.getCredentialsForUser(userId, role);
    if (!creds) {
      throw new BadRequestException('Не настроены учётные данные GreenAPI');
    }

    try {
      const formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
      
      const url = `${creds.apiUrl}/waInstance${creds.idInstance}/checkWhatsapp/${creds.apiTokenInstance}`;
      const response = await firstValueFrom(
        this.httpService.post<CheckWhatsappResponse>(url, {
          phoneNumber: formattedNumber,
        })
      );

      return {
        exists: response.data.existsWhatsapp,
        phoneNumber: formattedNumber,
      };
    } catch (error: any) {
      this.logger.error('GreenAPI checkWhatsApp error:', error.message);
      throw new BadRequestException('Ошибка проверки номера: ' + error.message);
    }
  }
}

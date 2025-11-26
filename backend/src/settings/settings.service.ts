import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get WhatsApp settings
   */
  async getWhatsAppSettings() {
    let settings = await this.prisma.whatsAppSettings.findFirst();
    
    if (!settings) {
      settings = await this.prisma.whatsAppSettings.create({
        data: {
          isEnabled: false,
        },
      });
    }
    
    return settings;
  }

  /**
   * Update WhatsApp settings
   */
  async updateWhatsAppSettings(data: {
    isEnabled?: boolean;
    greenApiId?: string;
    greenApiToken?: string;
  }) {
    const settings = await this.getWhatsAppSettings();
    
    return this.prisma.whatsAppSettings.update({
      where: { id: settings.id },
      data,
    });
  }

  /**
   * Test WhatsApp connection
   */
  async testWhatsAppConnection(): Promise<{ success: boolean; message: string }> {
    const settings = await this.getWhatsAppSettings();
    
    if (!settings.isEnabled) {
      return { success: false, message: 'WhatsApp integration is disabled' };
    }
    
    if (!settings.greenApiId || !settings.greenApiToken) {
      return { success: false, message: 'GreenAPI credentials not configured' };
    }

    try {
      const axios = require('axios');
      const response = await axios.get(
        `https://api.green-api.com/waInstance${settings.greenApiId}/getStateInstance/${settings.greenApiToken}`,
        { timeout: 10000 },
      );
      
      if (response.data.stateInstance === 'authorized') {
        return { success: true, message: 'WhatsApp connected successfully' };
      } else {
        return { success: false, message: `WhatsApp state: ${response.data.stateInstance}` };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Connection failed' };
    }
  }
}


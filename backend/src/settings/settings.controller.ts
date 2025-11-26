import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateWhatsAppSettingsDto } from './dto/update-whatsapp-settings.dto';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('whatsapp')
  @ApiOperation({ summary: 'Получить настройки WhatsApp' })
  async getWhatsAppSettings() {
    const settings = await this.settingsService.getWhatsAppSettings();
    return {
      ...settings,
      greenApiId: settings.greenApiId ? '***configured***' : null,
      greenApiToken: settings.greenApiToken ? '***configured***' : null,
    };
  }

  @Patch('whatsapp')
  @ApiOperation({ summary: 'Обновить настройки WhatsApp' })
  async updateWhatsAppSettings(@Body() dto: UpdateWhatsAppSettingsDto) {
    const settings = await this.settingsService.updateWhatsAppSettings(dto);
    return {
      ...settings,
      greenApiId: settings.greenApiId ? '***configured***' : null,
      greenApiToken: settings.greenApiToken ? '***configured***' : null,
    };
  }

  @Post('whatsapp/test')
  @ApiOperation({ summary: 'Тест подключения WhatsApp' })
  async testWhatsAppConnection() {
    return this.settingsService.testWhatsAppConnection();
  }
}


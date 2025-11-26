import { Controller, Get, Post, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsAppService, WhatsAppGroup } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('WhatsApp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private whatsAppService: WhatsAppService) {}

  @Get('settings')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Получить настройки GreenAPI' })
  getSettings(@Request() req) {
    // ADMIN получает свои настройки, SUPER_ADMIN - глобальные
    const adminId = req.user.role === 'ADMIN' ? req.user.id : undefined;
    return this.whatsAppService.getSettings(adminId);
  }

  @Patch('settings')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Обновить настройки GreenAPI' })
  updateSettings(
    @Request() req,
    @Body() dto: { idInstance?: string; apiTokenInstance?: string; isEnabled?: boolean }
  ) {
    // ADMIN сохраняет свои настройки, SUPER_ADMIN - глобальные
    const adminId = req.user.role === 'ADMIN' ? req.user.id : undefined;
    return this.whatsAppService.updateSettings(dto, adminId);
  }

  @Get('status')
  @Roles('SUPER_ADMIN', 'ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Получить статус инстанса' })
  getStatus(@Request() req) {
    return this.whatsAppService.getInstanceState(req.user.id, req.user.role);
  }

  @Get('qr')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Получить QR-код для авторизации' })
  getQrCode(@Request() req) {
    return this.whatsAppService.getQrCode(req.user.id, req.user.role);
  }

  @Post('logout')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Разлогинить инстанс' })
  logout(@Request() req) {
    return this.whatsAppService.logout(req.user.id, req.user.role);
  }

  @Get('groups')
  @Roles('SUPER_ADMIN', 'ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Получить список групп WhatsApp' })
  getGroups(@Request() req): Promise<WhatsAppGroup[]> {
    return this.whatsAppService.getGroups(req.user.id, req.user.role);
  }

  @Post('send')
  @Roles('SUPER_ADMIN', 'ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Отправить сообщение' })
  sendMessage(@Request() req, @Body() dto: { chatId: string; message: string }) {
    return this.whatsAppService.sendMessage(dto.chatId, dto.message, req.user.id, req.user.role);
  }

  @Post('check')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Проверить номер в WhatsApp' })
  checkWhatsApp(@Request() req, @Body() dto: { phoneNumber: string }) {
    return this.whatsAppService.checkWhatsApp(dto.phoneNumber, req.user.id, req.user.role);
  }
}

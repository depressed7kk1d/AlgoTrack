import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('WhatsApp')
@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WhatsAppController {
  constructor(private whatsappService: WhatsAppService) {}

  @Get('chats')
  @ApiOperation({ summary: 'Получить список чатов/групп WhatsApp' })
  async getChats(@Request() req) {
    return this.whatsappService.getChats(req.user.schoolId);
  }

  @Post('check-connection')
  @ApiOperation({ summary: 'Проверить подключение GreenAPI' })
  async checkConnection(@Body() data: { instanceId: string; apiToken: string }) {
    const isConnected = await this.whatsappService.checkConnection(data.instanceId, data.apiToken);
    return { connected: isConnected };
  }

  @Post('queue-message')
  @ApiOperation({ summary: 'Добавить сообщение в очередь' })
  async queueMessage(@Request() req, @Body() data: any) {
    return this.whatsappService.queueMessage({
      ...data,
      schoolId: req.user.schoolId,
    });
  }

  @Post('send/:id')
  @ApiOperation({ summary: 'Отправить сообщение из очереди (для Worker)' })
  async sendMessage(@Request() req) {
    return this.whatsappService.sendMessage(req.params.id);
  }

  @Post('parse-group')
  @ApiOperation({ summary: 'Парсинг WhatsApp группы по ссылке' })
  async parseGroup(@Request() req, @Body() data: { groupLink: string }) {
    return this.whatsappService.parseGroupFromLink(req.user.schoolId, data.groupLink);
  }
}


import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ScheduledMessagesService } from './scheduled-messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Scheduled Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scheduled-messages')
export class ScheduledMessagesController {
  constructor(private scheduledMessagesService: ScheduledMessagesService) {}

  @Post()
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Запланировать отправку сообщения' })
  scheduleMessage(
    @Request() req,
    @Body() dto: {
      chatId: string;
      chatName: string;
      message: string;
      scheduledFor: string; // ISO date string
      lessonId?: string;
    },
  ) {
    return this.scheduledMessagesService.scheduleMessage({
      ...dto,
      scheduledFor: new Date(dto.scheduledFor),
      teacherId: req.user.id,
    });
  }

  @Get()
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Получить запланированные сообщения' })
  getScheduledMessages(@Request() req) {
    return this.scheduledMessagesService.getTeacherScheduledMessages(req.user.id);
  }

  @Delete(':id')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Отменить запланированное сообщение' })
  cancelMessage(@Request() req, @Param('id') id: string) {
    return this.scheduledMessagesService.cancelScheduledMessage(id, req.user.id);
  }

  @Post('send-now')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Отправить сообщение сейчас' })
  sendNow(
    @Request() req,
    @Body() dto: {
      chatId: string;
      message: string;
      lessonId?: string;
    },
  ) {
    return this.scheduledMessagesService.sendNow({
      ...dto,
      teacherId: req.user.id,
      role: req.user.role,
    });
  }
}


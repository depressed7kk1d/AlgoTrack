import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { GenerateSummaryDto } from './dto/generate-summary.dto';
import { GeneratePersonalOSDto } from './dto/generate-personal-os.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post('generate-summary')
  @ApiOperation({ summary: 'Сгенерировать сводку класса (с AI или шаблоном)' })
  async generateSummary(
    @Body() dto: GenerateSummaryDto,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.generateClassSummary(dto, user.id);
  }

  @Post('generate-personal-os')
  @ApiOperation({ summary: 'Сгенерировать персональную ОС для ученика (с AI)' })
  async generatePersonalOS(
    @Body() dto: GeneratePersonalOSDto,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.generatePersonalOS(dto.moduleId, dto.studentId, user.id);
  }

  @Post('send')
  @ApiOperation({ summary: 'Отправить сообщение в WhatsApp' })
  async sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.sendClassSummary(
      dto.lessonId,
      dto.chatId,
      user.id,
    );
  }
}




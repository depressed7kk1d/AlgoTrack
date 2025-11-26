import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ParentsService } from './parents.service';

@ApiTags('Parents')
@Controller('parent')  // БЕЗ авторизации!
export class ParentsController {
  constructor(private parentsService: ParentsService) {}

  @Get(':token')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 запросов в минуту (строже чем глобальный лимит)
  @ApiOperation({ summary: 'Публичная страница родителя (без авторизации)' })
  async getByToken(@Param('token') token: string) {
    // Логируем попытку доступа (для безопасности)
    try {
      const result = await this.parentsService.getByToken(token);
      // Успешный доступ логируется в сервисе
      return result;
    } catch (error) {
      // Логируем неудачную попытку доступа
      console.warn(`⚠️ Неудачная попытка доступа к /parent/:token с токеном: ${token.substring(0, 10)}...`);
      throw error;
    }
  }
}


import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ParentsService } from './parents.service';

@ApiTags('Parents')
@Controller('parent')
export class ParentsController {
  constructor(private parentsService: ParentsService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Получить данные ученика по токену (публичный endpoint)' })
  async getStudentByToken(@Param('token') token: string) {
    return this.parentsService.getStudentByToken(token);
  }
}




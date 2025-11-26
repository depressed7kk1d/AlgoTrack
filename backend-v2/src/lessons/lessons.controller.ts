import { Controller, Get, Post, Patch, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LessonsService } from './lessons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Lessons')
@Controller('lessons')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Get()
  @ApiOperation({ summary: 'Список уроков класса' })
  async findByClass(@Query('classId') classId: string) {
    return this.lessonsService.findByClass(classId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить урок по ID' })
  async findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать урок' })
  async create(@Body() data: any) {
    return this.lessonsService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить урок' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.lessonsService.update(id, data);
  }
}


import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CardsService } from './cards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Cards')
@Controller('cards')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CardsController {
  constructor(private cardsService: CardsService) {}

  @Get()
  @ApiOperation({ summary: 'Карточки урока или ученика' })
  async find(@Query('lessonId') lessonId?: string, @Query('studentId') studentId?: string) {
    if (lessonId) {
      return this.cardsService.findByLesson(lessonId);
    }
    if (studentId) {
      return this.cardsService.findByStudent(studentId);
    }
    return [];
  }

  @Post()
  @ApiOperation({ summary: 'Создать карточку' })
  async create(@Body() data: any) {
    return this.cardsService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить карточку' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.cardsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить карточку' })
  async delete(@Param('id') id: string) {
    return this.cardsService.delete(id);
  }
}


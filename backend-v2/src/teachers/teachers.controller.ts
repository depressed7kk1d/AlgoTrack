import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Teachers')
@Controller('teachers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeachersController {
  constructor(private teachersService: TeachersService) {}

  @Get()
  @ApiOperation({ summary: 'Список учителей' })
  async findAll(@Request() req) {
    const schoolId = req.user.role === 'SUPER_ADMIN' ? undefined : req.user.schoolId;
    return this.teachersService.findAll(schoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить учителя по ID' })
  async findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать учителя (только Admin/SuperAdmin)' })
  async create(@Request() req, @Body() data: any) {
    return this.teachersService.create({
      ...data,
      schoolId: req.user.schoolId,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить учителя' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.teachersService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить учителя' })
  async delete(@Param('id') id: string) {
    return this.teachersService.delete(id);
  }
}


import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Students')
@Controller('students')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  @Get()
  @ApiOperation({ summary: 'Список учеников' })
  async findAll(@Request() req) {
    const schoolId = req.user.role === 'SUPER_ADMIN' ? undefined : req.user.schoolId;
    return this.studentsService.findAll(schoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить ученика по ID' })
  async findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать ученика' })
  async create(@Request() req, @Body() data: any) {
    return this.studentsService.create({
      ...data,
      schoolId: req.user.schoolId,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить ученика' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.studentsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить ученика' })
  async delete(@Param('id') id: string) {
    return this.studentsService.delete(id);
  }
}


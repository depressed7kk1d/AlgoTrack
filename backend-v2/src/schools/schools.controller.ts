import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SchoolsService } from './schools.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';

@ApiTags('Schools')
@Controller('schools')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SchoolsController {
  constructor(private schoolsService: SchoolsService) {}

  @Get()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Список школ (только SuperAdmin)' })
  async findAll() {
    return this.schoolsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить школу по ID' })
  async findOne(@Request() req, @Param('id') id: string) {
    // Админ может получить только свою школу
    if (req.user.role === 'ADMIN' && req.user.schoolId !== id) {
      throw new ForbiddenException('Нет доступа к этой школе');
    }
    return this.schoolsService.findOne(id);
  }

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Создать школу (только SuperAdmin)' })
  async create(@Body() data: any) {
    return this.schoolsService.create(data);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Обновить школу (только SuperAdmin)' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.schoolsService.update(id, data);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Удалить школу (только SuperAdmin)' })
  async delete(@Param('id') id: string) {
    return this.schoolsService.delete(id);
  }
}


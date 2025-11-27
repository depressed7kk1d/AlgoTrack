import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { CreateStudentDto } from './dto/create-student.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ==================== DASHBOARD ====================

  @Get('dashboard')
  @ApiOperation({ summary: 'Получить дашборд админа' })
  getDashboard(@Request() req) {
    return this.adminService.getDashboard(req.user.id);
  }

  // ==================== TEACHERS ====================

  @Post('teachers')
  @ApiOperation({ summary: 'Создать учителя' })
  createTeacher(@Request() req, @Body() dto: CreateTeacherDto) {
    return this.adminService.createTeacher(req.user.id, dto);
  }

  @Get('teachers')
  @ApiOperation({ summary: 'Получить всех учителей' })
  findAllTeachers(@Request() req) {
    return this.adminService.findAllTeachers(req.user.id);
  }

  @Get('teachers/:id')
  @ApiOperation({ summary: 'Получить учителя по ID' })
  findOneTeacher(@Request() req, @Param('id') id: string) {
    return this.adminService.findOneTeacher(req.user.id, id);
  }

  @Patch('teachers/:id')
  @ApiOperation({ summary: 'Обновить учителя' })
  updateTeacher(@Request() req, @Param('id') id: string, @Body() dto: UpdateTeacherDto) {
    return this.adminService.updateTeacher(req.user.id, id, dto);
  }

  @Delete('teachers/:id')
  @ApiOperation({ summary: 'Деактивировать учителя' })
  deleteTeacher(@Request() req, @Param('id') id: string) {
    return this.adminService.deleteTeacher(req.user.id, id);
  }

  @Patch('teachers/:id/activate')
  @ApiOperation({ summary: 'Активировать учителя' })
  activateTeacher(@Request() req, @Param('id') id: string) {
    return this.adminService.activateTeacher(req.user.id, id);
  }

  // ==================== CLASSES ====================

  @Post('classes')
  @ApiOperation({ summary: 'Создать класс/группу' })
  createClass(@Request() req, @Body() dto: CreateClassDto) {
    return this.adminService.createClass(req.user.id, dto);
  }

  @Get('classes')
  @ApiOperation({ summary: 'Получить все классы' })
  findAllClasses(@Request() req) {
    return this.adminService.findAllClasses(req.user.id);
  }

  @Get('classes/:id')
  @ApiOperation({ summary: 'Получить класс по ID' })
  findOneClass(@Request() req, @Param('id') id: string) {
    return this.adminService.findOneClass(req.user.id, id);
  }

  @Patch('classes/:id')
  @ApiOperation({ summary: 'Обновить класс' })
  updateClass(@Request() req, @Param('id') id: string, @Body() dto: UpdateClassDto) {
    return this.adminService.updateClass(req.user.id, id, dto);
  }

  @Delete('classes/:id')
  @ApiOperation({ summary: 'Удалить класс' })
  deleteClass(@Request() req, @Param('id') id: string) {
    return this.adminService.deleteClass(req.user.id, id);
  }

  // ==================== STUDENTS ====================

  @Post('classes/:classId/students')
  @ApiOperation({ summary: 'Добавить ученика в класс' })
  addStudentToClass(
    @Request() req,
    @Param('classId') classId: string,
    @Body() dto: CreateStudentDto,
  ) {
    return this.adminService.addStudentToClass(req.user.id, classId, dto);
  }

  @Delete('classes/:classId/students/:studentId')
  @ApiOperation({ summary: 'Удалить ученика из класса' })
  removeStudentFromClass(
    @Request() req,
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.adminService.removeStudentFromClass(req.user.id, classId, studentId);
  }

  // ==================== MODULES ====================

  @Post('classes/:classId/modules')
  @ApiOperation({ summary: 'Создать модуль для класса' })
  createModule(
    @Request() req,
    @Param('classId') classId: string,
    @Body() dto: { title: string; description?: string; lessonsCount?: number },
  ) {
    return this.adminService.createModule(req.user.id, classId, dto);
  }

  // ==================== PROFILE & SETTINGS ====================

  @Get('profile')
  @ApiOperation({ summary: 'Получить профиль админа' })
  getProfile(@Request() req) {
    return this.adminService.getProfile(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Обновить профиль админа' })
  updateProfile(@Request() req, @Body() dto: { name?: string; phone?: string; city?: string; schoolName?: string }) {
    return this.adminService.updateProfile(req.user.id, dto);
  }

  @Get('os-template')
  @ApiOperation({ summary: 'Получить персональный шаблон ОС' })
  getOsTemplate(@Request() req) {
    return this.adminService.getOsTemplate(req.user.id);
  }

  @Patch('os-template')
  @ApiOperation({ summary: 'Обновить персональный шаблон ОС' })
  updateOsTemplate(@Request() req, @Body() dto: { template: string }) {
    return this.adminService.updateOsTemplate(req.user.id, dto.template);
  }
}


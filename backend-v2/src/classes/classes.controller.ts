import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { AuthService } from '../auth/auth.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@ApiTags('Classes')
@Controller('classes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClassesController {
  constructor(
    private classesService: ClassesService,
    private authService: AuthService,
    private whatsappService: WhatsAppService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Список классов' })
  async findAll(@Request() req) {
    return this.classesService.findAll(req.user.sub, req.user.role, req.user.schoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить класс по ID' })
  async findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать класс (только для ADMIN и SUPER_ADMIN)' })
  @ApiBody({ type: CreateClassDto })
  async create(@Request() req, @Body() data: CreateClassDto) {
    // Только админ или супер-админ может создавать классы
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Только администратор может создавать классы');
    }

    // Если teacherId не указан, используем текущего пользователя (если он учитель)
    // Или берём из данных
    const teacherId = data.teacherId || (req.user.role === 'TEACHER' ? req.user.sub : null);
    
    if (!teacherId) {
      throw new ForbiddenException('Необходимо указать teacherId');
    }

    // Парсим WhatsApp группу, если указана ссылка
    let whatsappGroupId = data.whatsappGroupId;
    let whatsappGroupName = data.whatsappGroupName;

    if (data.whatsappGroupLink && !whatsappGroupId) {
      try {
        const parsed = await this.whatsappService.parseGroupFromLink(
          req.user.schoolId,
          data.whatsappGroupLink
        );
        whatsappGroupId = parsed.groupId || whatsappGroupId;
        whatsappGroupName = parsed.groupName || whatsappGroupName;
      } catch (error) {
        // Если парсинг не удался, продолжаем без ошибки
        // Пользователь может указать ID вручную
        console.warn('Не удалось распарсить WhatsApp группу:', error.message);
      }
    }

    return this.classesService.create({
      ...data,
      schoolId: req.user.schoolId,
      teacherId,
      whatsappGroupId,
      whatsappGroupName,
      createdBy: req.user.sub,
      createdByType: req.user.role === 'ADMIN' ? 'ADMIN' : 'SUPER_ADMIN',
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить класс' })
  @ApiBody({ type: UpdateClassDto })
  async update(@Request() req, @Param('id') id: string, @Body() data: UpdateClassDto) {
    // Проверяем права доступа
    const classData = await this.classesService.findOne(id);
    const canEdit = this.authService.canEditClass(req.user, {
      createdBy: classData.createdBy,
      createdByType: classData.createdByType,
    });
    
    if (!canEdit) {
      throw new ForbiddenException('Нет прав для редактирования этого класса');
    }
    
    return this.classesService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить класс' })
  async delete(@Request() req, @Param('id') id: string) {
    // Проверяем права доступа
    const classData = await this.classesService.findOne(id);
    const canEdit = this.authService.canEditClass(req.user, {
      createdBy: classData.createdBy,
      createdByType: classData.createdByType,
    });
    
    if (!canEdit) {
      throw new ForbiddenException('Нет прав для удаления этого класса');
    }
    
    return this.classesService.delete(id);
  }

  @Get(':id/students')
  @ApiOperation({ summary: 'Получить учеников класса' })
  async getStudents(@Param('id') classId: string) {
    const classData = await this.classesService.findOne(classId);
    
    // Преобразуем в формат который ожидает Frontend
    return classData.students.map((cs) => ({
      id: cs.student.id,
      name: cs.student.name,
      avatar: cs.student.avatar,
      parent: {
        name: cs.student.parentName,
        phone: cs.student.parentPhone,
        parentType: cs.student.parentType,
      },
      parentToken: cs.student.parentToken,
    }));
  }

  @Post(':id/students')
  @ApiOperation({ summary: 'Добавить ученика в класс' })
  async addStudent(@Param('id') classId: string, @Body() data: { studentId: string }) {
    return this.classesService.addStudent(classId, data.studentId);
  }
}


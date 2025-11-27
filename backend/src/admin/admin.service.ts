import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { CreateStudentDto } from './dto/create-student.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  // ==================== TEACHERS ====================

  async createTeacher(adminId: string, dto: CreateTeacherDto) {
    const existing = await this.prisma.teacher.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Учитель с таким email уже существует');
    }

    const hashedPassword = await this.authService.hashPassword(dto.password);

    return this.prisma.teacher.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        phone: dto.phone,
        adminId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findAllTeachers(adminId: string) {
    return this.prisma.teacher.findMany({
      where: { adminId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { classes: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOneTeacher(adminId: string, teacherId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, adminId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        classes: {
          select: {
            id: true,
            name: true,
            whatsappGroupName: true,
            _count: {
              select: { classStudents: true },
            },
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Учитель не найден');
    }

    return teacher;
  }

  async updateTeacher(adminId: string, teacherId: string, dto: UpdateTeacherDto) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, adminId },
    });
    if (!teacher) {
      throw new NotFoundException('Учитель не найден');
    }

    const data: any = { ...dto };
    if (dto.password) {
      data.password = await this.authService.hashPassword(dto.password);
    }

    return this.prisma.teacher.update({
      where: { id: teacherId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async deleteTeacher(adminId: string, teacherId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, adminId },
    });
    if (!teacher) {
      throw new NotFoundException('Учитель не найден');
    }

    return this.prisma.teacher.update({
      where: { id: teacherId },
      data: { isActive: false },
    });
  }

  async activateTeacher(adminId: string, teacherId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, adminId },
    });

    if (!teacher) {
      throw new NotFoundException('Учитель не найден');
    }

    return this.prisma.teacher.update({
      where: { id: teacherId },
      data: { isActive: true },
    });
  }

  // ==================== CLASSES ====================

  async createClass(adminId: string, dto: CreateClassDto) {
    // Проверяем что учитель принадлежит этому админу
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: dto.teacherId, adminId },
    });
    if (!teacher) {
      throw new ForbiddenException('Учитель не найден или не принадлежит вашей школе');
    }

    return this.prisma.class.create({
      data: {
        name: dto.name,
        teacherId: dto.teacherId,
        adminId,
        schedule: dto.schedule ? JSON.stringify(dto.schedule) : null,
        whatsappGroupId: dto.whatsappGroupId,
        whatsappGroupName: dto.whatsappGroupName,
      },
      include: {
        teacher: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async findAllClasses(adminId: string) {
    return this.prisma.class.findMany({
      where: { adminId },
      include: {
        teacher: {
          select: { id: true, name: true },
        },
        _count: {
          select: { 
            classStudents: true,
            modules: true,
            lessons: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOneClass(adminId: string, classId: string) {
    const classData = await this.prisma.class.findFirst({
      where: { id: classId, adminId },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        classStudents: {
          include: {
            student: {
              include: {
                parent: {
                  select: { id: true, name: true, phone: true, parentType: true },
                },
                parentLink: {
                  select: { linkToken: true },
                },
              },
            },
          },
        },
        modules: {
          include: {
            lessons: {
              orderBy: { lessonNumber: 'asc' },
              include: {
                cards: true,
              },
            },
            _count: {
              select: { osReports: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!classData) {
      throw new NotFoundException('Класс не найден');
    }

    return classData;
  }

  async updateClass(adminId: string, classId: string, dto: UpdateClassDto) {
    const classData = await this.prisma.class.findFirst({
      where: { id: classId, adminId },
    });
    if (!classData) {
      throw new NotFoundException('Класс не найден');
    }

    const data: any = { ...dto };
    if (dto.schedule) {
      data.schedule = JSON.stringify(dto.schedule);
    }

    return this.prisma.class.update({
      where: { id: classId },
      data,
      include: {
        teacher: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async deleteClass(adminId: string, classId: string) {
    const classData = await this.prisma.class.findFirst({
      where: { id: classId, adminId },
    });
    if (!classData) {
      throw new NotFoundException('Класс не найден');
    }

    // Удаляем связанные данные
    await this.prisma.$transaction([
      this.prisma.card.deleteMany({ where: { lesson: { classId } } }),
      this.prisma.lesson.deleteMany({ where: { classId } }),
      this.prisma.module.deleteMany({ where: { classId } }),
      this.prisma.classStudent.deleteMany({ where: { classId } }),
      this.prisma.class.delete({ where: { id: classId } }),
    ]);

    return { message: 'Класс удалён' };
  }

  // ==================== STUDENTS ====================

  async addStudentToClass(adminId: string, classId: string, dto: CreateStudentDto) {
    const classData = await this.prisma.class.findFirst({
      where: { id: classId, adminId },
    });
    if (!classData) {
      throw new NotFoundException('Класс не найден');
    }

    // Создаём или находим родителя
    let parent = await this.prisma.parent.findFirst({
      where: {
        OR: [
          { phone: dto.parentPhone },
          { email: dto.parentEmail },
        ].filter(Boolean) as any[],
      },
    });

    if (!parent) {
      parent = await this.prisma.parent.create({
        data: {
          name: dto.parentName,
          phone: dto.parentPhone,
          email: dto.parentEmail,
          parentType: dto.parentType || 'CALM',
        },
      });
    }

    // Создаём ученика
    const student = await this.prisma.student.create({
      data: {
        name: dto.studentName,
        dob: dto.studentDob ? new Date(dto.studentDob) : null,
        parentId: parent.id,
      },
    });

    // Добавляем в класс
    await this.prisma.classStudent.create({
      data: {
        classId,
        studentId: student.id,
      },
    });

    // Создаём ссылку для родителя
    const crypto = require('crypto');
    await this.prisma.parentLink.create({
      data: {
        studentId: student.id,
        linkToken: crypto.randomBytes(32).toString('hex'),
      },
    });

    return {
      student,
      parent,
      message: 'Ученик добавлен в класс',
    };
  }

  async removeStudentFromClass(adminId: string, classId: string, studentId: string) {
    const classData = await this.prisma.class.findFirst({
      where: { id: classId, adminId },
    });
    if (!classData) {
      throw new NotFoundException('Класс не найден');
    }

    await this.prisma.classStudent.deleteMany({
      where: { classId, studentId },
    });

    return { message: 'Ученик удалён из класса' };
  }

  // ==================== MODULES ====================

  async createModule(adminId: string, classId: string, dto: { title: string; description?: string; lessonsCount?: number }) {
    const classData = await this.prisma.class.findFirst({
      where: { id: classId, adminId },
    });
    if (!classData) {
      throw new NotFoundException('Класс не найден');
    }

    return this.prisma.module.create({
      data: {
        classId,
        title: dto.title,
        description: dto.description,
        lessonsCount: dto.lessonsCount || 4,
      },
    });
  }

  // ==================== DASHBOARD ====================

  async getDashboard(adminId: string) {
    const [
      teachersCount,
      classesCount,
      studentsCount,
      lessonsThisWeek,
      pendingReports,
      pendingMessages,
    ] = await Promise.all([
      this.prisma.teacher.count({ where: { adminId, isActive: true } }),
      this.prisma.class.count({ where: { adminId } }),
      this.prisma.classStudent.count({
        where: { class: { adminId } },
      }),
      this.prisma.lesson.count({
        where: {
          class: { adminId },
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.osReport.count({
        where: {
          status: 'GENERATED',
          module: { class: { adminId } },
        },
      }),
      this.prisma.messageQueue.count({
        where: {
          status: 'PENDING',
          adminId,
        },
      }),
    ]);

    // Классы с готовыми ОС (4 урока пройдено)
    const classesWithReadyOS = await this.prisma.class.findMany({
      where: { adminId },
      include: {
        modules: {
          include: {
            lessons: {
              include: {
                cards: true,
              },
            },
            osReports: true,
          },
        },
        teacher: {
          select: { name: true },
        },
      },
    });

    // Модули готовые к генерации ОС:
    // - Имеют 2+ уроков (больше 1)
    // - ОС ещё не сгенерированы
    const modulesReadyForOS = classesWithReadyOS.flatMap((cls) =>
      cls.modules
        .filter((mod) => {
          // Модуль готов если есть минимум 2 урока и ОС ещё не сгенерированы
          return mod.lessons.length >= 2 && mod.osReports.length === 0;
        })
        .map((mod) => {
          const lessonsWithCards = mod.lessons.filter((l) => l.cards.length > 0).length;
          return {
            moduleId: mod.id,
            moduleTitle: mod.title,
            className: cls.name,
            teacherName: cls.teacher.name,
            lessonsCompleted: lessonsWithCards,
            totalLessons: mod.lessons.length,
            isFullyCompleted: lessonsWithCards >= mod.lessonsCount,
          };
        }),
    );

    return {
      stats: {
        teachers: teachersCount,
        classes: classesCount,
        students: studentsCount,
        lessonsThisWeek,
        pendingReports,
        pendingMessages,
      },
      modulesReadyForOS,
    };
  }

  // ==================== PROFILE & SETTINGS ====================

  async getProfile(adminId: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        schoolName: true,
        osTemplateExample: true,
        createdAt: true,
      },
    });

    if (!admin) {
      throw new NotFoundException('Админ не найден');
    }

    return admin;
  }

  async updateProfile(adminId: string, dto: { name?: string; phone?: string; city?: string; schoolName?: string }) {
    return this.prisma.admin.update({
      where: { id: adminId },
      data: dto,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        schoolName: true,
      },
    });
  }

  async getOsTemplate(adminId: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        osTemplateExample: true,
        name: true,
      },
    });

    if (!admin) {
      throw new NotFoundException('Админ не найден');
    }

    // Возвращаем шаблон или дефолтный пример
    return {
      template: admin.osTemplateExample || this.getDefaultOsTemplate(admin.name),
      hasCustomTemplate: !!admin.osTemplateExample,
    };
  }

  async updateOsTemplate(adminId: string, template: string) {
    await this.prisma.admin.update({
      where: { id: adminId },
      data: { osTemplateExample: template },
    });

    return { success: true, message: 'Шаблон ОС обновлён' };
  }

  private getDefaultOsTemplate(adminName: string): string {
    return `[Имя родителя], доброе утро, на связи ${adminName} ☀

Делюсь обратной связью после [N] занятий по модулю «[Название модуля]» от педагога [Имя педагога] 💻

Средний процент выполнения заданий [Имя ребёнка] на образовательной платформе за [N] занятия — [X]%

— На первом уроке [Имя ребёнка] познакомился с основами..., [X]% выполнения практических заданий

— На втором уроке освоил работу с..., [X]% выполнения практических заданий

— На третьем уроке изучил..., [X]% выполнения практических заданий

— На четвёртом уроке [Имя ребёнка] отсутствовал - тема занятия: [тема]

Образовательный результат: [Имя ребёнка] активно работает на уроках, показывает хорошие результаты...

Рекомендации: Рекомендую самостоятельно повторить теорию и доделать практику по урокам с низким процентом...

Желаем [Имя ребёнка] успехов в дальнейшем обучении и всегда рады вашей обратной связи 🤝🏻`;
  }
}


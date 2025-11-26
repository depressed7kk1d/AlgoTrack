import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Получить классы пользователя
   * - SuperAdmin видит все
   * - Admin видит классы своей школы
   * - Teacher видит только свои классы
   */
  async findAll(userId: string, role: string, schoolId?: string) {
    if (role === 'SUPER_ADMIN') {
      return this.prisma.class.findMany({
        include: {
          teacher: { select: { id: true, name: true, email: true } },
          _count: { select: { students: true } },
        },
      });
    }

    if (role === 'ADMIN') {
      return this.prisma.class.findMany({
        where: { schoolId },
        include: {
          teacher: { select: { id: true, name: true, email: true } },
          _count: { select: { students: true } },
        },
      });
    }

    // Teacher - только свои классы
    return this.prisma.class.findMany({
      where: { teacherId: userId },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        _count: { select: { students: true } },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.class.findUnique({
      where: { id },
      include: {
        teacher: true,
        school: true,
        students: {
          include: {
            student: true,
          },
        },
      },
    });
  }

  async create(data: {
    schoolId: string;
    teacherId: string;
    name: string;
    description?: string;
    whatsappGroupId?: string;
    whatsappGroupName?: string;
    whatsappGroupLink?: string;
    createdBy: string;
    createdByType: 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';
  }) {
    // Если указана ссылка, но не указаны ID и название - парсим через WhatsApp service
    // Это будет сделано в контроллере перед вызовом этого метода
    
    return this.prisma.class.create({
      data,
      include: {
        teacher: true,
        _count: { select: { students: true } },
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.class.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.class.delete({
      where: { id },
    });
  }

  /**
   * Добавить ученика в класс
   */
  async addStudent(classId: string, studentId: string) {
    return this.prisma.classStudent.create({
      data: { classId, studentId },
    });
  }

  /**
   * Убрать ученика из класса
   */
  async removeStudent(classId: string, studentId: string) {
    return this.prisma.classStudent.deleteMany({
      where: { classId, studentId },
    });
  }
}


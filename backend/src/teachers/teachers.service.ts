import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        isActive: true,
        adminId: true,
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

  async getTeacherClasses(teacherId: string) {
    return this.prisma.class.findMany({
      where: { teacherId },
      include: {
        _count: {
          select: {
            classStudents: true,
            modules: true,
            lessons: true,
          },
        },
        modules: {
          include: {
            lessons: {
              orderBy: { lessonNumber: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getClassDetails(teacherId: string, classId: string) {
    const classData = await this.prisma.class.findFirst({
      where: { id: classId, teacherId },
      include: {
        classStudents: {
          include: {
            student: {
              include: {
                parent: {
                  select: { id: true, name: true, parentType: true },
                },
              },
            },
          },
        },
        modules: {
          include: {
            lessons: {
              include: {
                cards: true,
              },
              orderBy: { lessonNumber: 'asc' },
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

  async getLessonDetails(teacherId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId,
        class: { teacherId },
      },
      include: {
        module: true,
        class: {
          include: {
            classStudents: {
              include: {
                student: {
                  include: {
                    parent: true,
                  },
                },
              },
            },
          },
        },
        cards: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Урок не найден');
    }

    // Get students who don't have cards yet
    const studentsWithCards = new Set(lesson.cards.map((c) => c.studentId));
    const studentsWithoutCards = lesson.class.classStudents
      .map((cs) => cs.student)
      .filter((s) => !studentsWithCards.has(s.id));

    return {
      ...lesson,
      studentsWithoutCards,
    };
  }
}

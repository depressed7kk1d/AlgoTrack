import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async findAll(teacherId: string) {
    return this.prisma.class.findMany({
      where: { teacherId },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { classStudents: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, teacherId: string) {
    const classData = await this.prisma.class.findFirst({
      where: { id, teacherId },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        classStudents: {
          include: {
            student: {
              include: {
                parent: true,
              },
            },
          },
        },
        modules: {
          include: {
            _count: {
              select: { lessons: true },
            },
          },
        },
      },
    });

    if (!classData) {
      throw new NotFoundException('Класс не найден');
    }

    return classData;
  }

  async getStudentsWithProgress(classId: string, teacherId: string) {
    const classData = await this.findOne(classId, teacherId);

    const students = await Promise.all(
      classData.classStudents.map(async (cs) => {
        const student = cs.student;

        // Get latest module
        const latestModule = await this.prisma.module.findFirst({
          where: { classId },
          orderBy: { createdAt: 'desc' },
        });

        if (!latestModule) {
          return {
            ...student,
            progress: 0,
            cardsCount: 0,
          };
        }

        // Count cards for this module
        const cards = await this.prisma.card.findMany({
          where: {
            studentId: student.id,
            lesson: {
              moduleId: latestModule.id,
            },
          },
        });

        // Calculate progress
        const totalTasksCompleted = cards.reduce(
          (sum, card) => sum + (card.taskCompletedCount || 0),
          0,
        );
        const progress = latestModule.totalTasks > 0
          ? Math.min(100, (totalTasksCompleted / latestModule.totalTasks) * 100)
          : 0;

        return {
          ...student,
          progress: Math.round(progress),
          cardsCount: cards.length,
          latestCard: cards[cards.length - 1] || null,
        };
      }),
    );

    return students;
  }
}




import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async findOne(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: { id: true, title: true, classId: true },
        },
        class: {
          select: { id: true, name: true, teacherId: true },
        },
        cards: {
          include: {
            student: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Урок не найден');
    }

    return lesson;
  }
}


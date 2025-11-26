import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async findByClass(classId: string) {
    return this.prisma.lesson.findMany({
      where: { classId },
      include: {
        cards: {
          include: { student: { select: { id: true, name: true } } },
        },
        summary: true,
      },
      orderBy: { lessonNumber: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.lesson.findUnique({
      where: { id },
      include: {
        class: true,
        cards: {
          include: { student: true },
        },
        summary: true,
      },
    });
  }

  async create(data: {
    classId: string;
    lessonNumber: number;
    lessonDate: Date;
    topic?: string;
    topicForAi?: string;
  }) {
    return this.prisma.lesson.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return this.prisma.lesson.update({
      where: { id },
      data,
    });
  }
}


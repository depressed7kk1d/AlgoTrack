import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CardsService {
  constructor(private prisma: PrismaService) {}

  async findByLesson(lessonId: string) {
    return this.prisma.lessonCard.findMany({
      where: { lessonId },
      include: { student: true },
    });
  }

  async findByStudent(studentId: string) {
    return this.prisma.lessonCard.findMany({
      where: { studentId },
      include: { lesson: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    lessonId: string;
    studentId: string;
    completionPercent: number;
    activityLevel: string;
    mood: string;
    whatWorked?: string;
    toImprove?: string;
    homework?: string;
    notes?: string;
  }) {
    return this.prisma.lessonCard.create({
      data: {
        lessonId: data.lessonId,
        studentId: data.studentId,
        completionPercent: data.completionPercent,
        activityLevel: data.activityLevel as any,
        mood: data.mood as any,
        whatWorked: data.whatWorked,
        toImprove: data.toImprove,
        homework: data.homework,
        notes: data.notes,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.lessonCard.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.lessonCard.delete({
      where: { id },
    });
  }
}


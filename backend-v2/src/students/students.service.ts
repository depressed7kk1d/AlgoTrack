import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(schoolId?: string) {
    return this.prisma.student.findMany({
      where: schoolId ? { schoolId } : {},
      include: {
        classes: {
          include: { class: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.student.findUnique({
      where: { id },
      include: {
        classes: {
          include: { class: true },
        },
        lessonCards: {
          include: { lesson: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async create(data: {
    schoolId: string;
    name: string;
    parentName: string;
    parentPhone: string;
    parentType?: string;
  }) {
    return this.prisma.student.create({
      data: {
        schoolId: data.schoolId,
        name: data.name,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        parentType: data.parentType as any,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.student.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.student.delete({
      where: { id },
    });
  }
}


import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async findAll(schoolId?: string) {
    return this.prisma.teacher.findMany({
      where: schoolId ? { schoolId } : {},
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        school: { select: { id: true, name: true } },
        _count: { select: { classes: true } },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.teacher.findUnique({
      where: { id },
      include: {
        school: true,
        classes: true,
      },
    });
  }

  async create(data: {
    schoolId: string;
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return this.prisma.teacher.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  async update(id: string, data: any) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    
    return this.prisma.teacher.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.teacher.delete({
      where: { id },
    });
  }
}


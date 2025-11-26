import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    return this.prisma.student.findUnique({
      where: { id },
      include: {
        parent: true,
      },
    });
  }
}




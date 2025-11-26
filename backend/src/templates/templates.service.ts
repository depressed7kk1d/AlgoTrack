import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.messageTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    if (id === 'default') {
      return this.prisma.messageTemplate.findFirst({
        where: { name: { contains: 'Групповая сводка' } },
      });
    }

    const template = await this.prisma.messageTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Шаблон не найден');
    }

    return template;
  }

  async findByParentType(parentType: string) {
    return this.prisma.messageTemplate.findMany({
      where: { parentType: parentType as any },
    });
  }
}




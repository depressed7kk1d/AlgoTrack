import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';

@Injectable()
export class SchoolsService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
  ) {}

  async findAll() {
    return this.prisma.school.findMany({
      include: {
        _count: {
          select: {
            admins: true,
            teachers: true,
            classes: true,
            students: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.school.findUnique({
      where: { id },
      include: {
        admins: true,
        teachers: true,
        _count: {
          select: {
            classes: true,
            students: true,
          },
        },
      },
    });
  }

  async create(data: {
    name: string;
    city: string;
    timezone?: string;
    aiProvider?: string;
  }) {
    return this.prisma.school.create({
      data,
    });
  }

  async update(id: string, data: any) {
    // Шифруем API ключи перед сохранением
    if (data.aiApiKey) {
      data.aiApiKey = this.crypto.encrypt(data.aiApiKey);
    }
    if (data.greenApiToken) {
      data.greenApiToken = this.crypto.encrypt(data.greenApiToken);
    }
    if (data.greenApiToken2) {
      data.greenApiToken2 = this.crypto.encrypt(data.greenApiToken2);
    }

    return this.prisma.school.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.school.delete({
      where: { id },
    });
  }
}


import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Injectable()
export class SuperAdminService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  // ==================== ADMINS ====================

  async createAdmin(dto: CreateAdminDto) {
    // Проверка на существующий email
    const existing = await this.prisma.admin.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Админ с таким email уже существует');
    }

    const hashedPassword = await this.authService.hashPassword(dto.password);

    return this.prisma.admin.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        phone: dto.phone,
        city: dto.city,
        schoolName: dto.schoolName,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        schoolName: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findAllAdmins() {
    return this.prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        schoolName: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            teachers: true,
            classes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneAdmin(id: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        schoolName: true,
        isActive: true,
        createdAt: true,
        teachers: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          },
        },
        classes: {
          select: {
            id: true,
            name: true,
            whatsappGroupName: true,
          },
        },
      },
    });

    if (!admin) {
      throw new NotFoundException('Админ не найден');
    }

    return admin;
  }

  async updateAdmin(id: string, dto: UpdateAdminDto) {
    const admin = await this.prisma.admin.findUnique({ where: { id } });
    if (!admin) {
      throw new NotFoundException('Админ не найден');
    }

    const data: any = { ...dto };
    if (dto.password) {
      data.password = await this.authService.hashPassword(dto.password);
    }

    return this.prisma.admin.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        schoolName: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async deleteAdmin(id: string) {
    const admin = await this.prisma.admin.findUnique({ where: { id } });
    if (!admin) {
      throw new NotFoundException('Админ не найден');
    }

    // Soft delete - просто деактивируем
    return this.prisma.admin.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ==================== MONITORING ====================

  async getMonitoringOverview() {
    const [
      adminsCount,
      teachersCount,
      classesCount,
      studentsCount,
      lessonsCount,
      reportsCount,
      pendingMessages,
    ] = await Promise.all([
      this.prisma.admin.count({ where: { isActive: true } }),
      this.prisma.teacher.count({ where: { isActive: true } }),
      this.prisma.class.count(),
      this.prisma.student.count(),
      this.prisma.lesson.count(),
      this.prisma.osReport.count(),
      this.prisma.messageQueue.count({ where: { status: 'PENDING' } }),
    ]);

    // Сообщения за последние 24 часа
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const messagesSentToday = await this.prisma.messageQueue.count({
      where: {
        status: 'SENT',
        sentAt: { gte: oneDayAgo },
      },
    });

    return {
      admins: adminsCount,
      teachers: teachersCount,
      classes: classesCount,
      students: studentsCount,
      lessons: lessonsCount,
      reports: reportsCount,
      pendingMessages,
      messagesSentToday,
    };
  }

  async getSchoolsList() {
    return this.prisma.admin.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        city: true,
        schoolName: true,
        _count: {
          select: {
            teachers: true,
            classes: true,
          },
        },
      },
      orderBy: { city: 'asc' },
    });
  }
}


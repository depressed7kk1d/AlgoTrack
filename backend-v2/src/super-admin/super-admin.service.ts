import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
  ) {}

  async getSchools() {
    const schools = await this.prisma.school.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return schools.map((school) => {
      const {
        greenApiToken,
        greenApiToken2,
        aiApiKey,
        ...rest
      } = school;
      return {
        ...rest,
        hasGreenApiToken: Boolean(greenApiToken),
        hasGreenApiToken2: Boolean(greenApiToken2),
        hasAiApiKey: Boolean(aiApiKey),
      };
    });
  }

  async createSchool(data: {
    name: string;
    city: string;
    timezone?: string;
    aiProvider?: string;
    maxMessagesPerHour?: number;
    maxMessagesPerMinute?: number;
    delayBetweenMessages?: number;
  }) {
    return this.prisma.school.create({
      data: {
        ...data,
      },
    });
  }

  async updateSchool(id: string, data: any) {
    return this.prisma.school.update({
      where: { id },
      data,
    });
  }

  async updateIntegrations(id: string, data: {
    greenApiInstanceId?: string;
    greenApiToken?: string;
    greenApiInstanceId2?: string;
    greenApiToken2?: string;
    aiProvider?: string;
    aiApiKey?: string;
  }) {
    const payload: any = {};

    if (data.greenApiInstanceId !== undefined) {
      payload.greenApiInstanceId = data.greenApiInstanceId || null;
    }
    if (data.greenApiToken !== undefined) {
      payload.greenApiToken = data.greenApiToken ? this.crypto.encrypt(data.greenApiToken) : null;
    }
    if (data.greenApiInstanceId2 !== undefined) {
      payload.greenApiInstanceId2 = data.greenApiInstanceId2 || null;
    }
    if (data.greenApiToken2 !== undefined) {
      payload.greenApiToken2 = data.greenApiToken2 ? this.crypto.encrypt(data.greenApiToken2) : null;
    }
    if (data.aiProvider !== undefined) {
      payload.aiProvider = data.aiProvider || null;
    }
    if (data.aiApiKey !== undefined) {
      payload.aiApiKey = data.aiApiKey ? this.crypto.encrypt(data.aiApiKey) : null;
    }

    return this.prisma.school.update({
      where: { id },
      data: payload,
    });
  }

  async deleteSchool(id: string) {
    return this.prisma.school.delete({
      where: { id },
    });
  }

  async getAdmins() {
    return this.prisma.admin.findMany({
      include: {
        school: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createAdmin(data: {
    schoolId: string;
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.admin.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async updateAdmin(id: string, data: any) {
    const payload: any = { ...data };
    if (data.password) {
      payload.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.admin.update({
      where: { id },
      data: payload,
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async deleteAdmin(id: string) {
    return this.prisma.admin.delete({
      where: { id },
    });
  }

  async getMonitoringOverview() {
    const [schools, grouped, totals, errors] = await Promise.all([
      this.prisma.school.findMany({
        select: { id: true, name: true },
      }),
      this.prisma.messageQueue.groupBy({
        by: ['schoolId', 'status'],
        _count: { _all: true },
      }),
      this.prisma.messageQueue.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.errorLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const schoolMap = new Map(schools.map((s) => [s.id, s.name]));

    const queueStats = grouped.reduce<Record<string, any>>((acc, item) => {
      if (!acc[item.schoolId]) {
        acc[item.schoolId] = {
          schoolId: item.schoolId,
          schoolName: schoolMap.get(item.schoolId) || 'Неизвестная школа',
          pending: 0,
          processing: 0,
          sent: 0,
          failed: 0,
          cancelled: 0,
        };
      }
      acc[item.schoolId][item.status.toLowerCase()] = item._count._all;
      return acc;
    }, {});

    const totalsSnapshot = totals.reduce(
      (acc, item) => {
        acc[item.status.toLowerCase()] = item._count._all;
        return acc;
      },
      { pending: 0, processing: 0, sent: 0, failed: 0, cancelled: 0 },
    );

    const enhancedErrors = errors.map((log) => ({
      ...log,
      schoolName: log.schoolId ? schoolMap.get(log.schoolId) || '—' : '—',
    }));

    return {
      queues: Object.values(queueStats),
      totals: totalsSnapshot,
      errors: enhancedErrors,
    };
  }

  async getSchoolById(id: string) {
    const school = await this.prisma.school.findUnique({
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

    if (!school) {
      throw new NotFoundException('Школа не найдена');
    }

    const { greenApiToken, greenApiToken2, aiApiKey, ...rest } = school;
    return {
      ...rest,
      hasGreenApiToken: Boolean(greenApiToken),
      hasGreenApiToken2: Boolean(greenApiToken2),
      hasAiApiKey: Boolean(aiApiKey),
    };
  }
}



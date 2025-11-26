import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER';

export interface JwtPayload {
  email: string;
  sub: string;
  role: UserRole;
  name: string;
  adminId?: string; // Для учителей - ID их админа
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Единый метод входа - определяет роль автоматически
   */
  async login(email: string, password: string) {
    // 1. Проверяем SuperAdmin
    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { email },
    });

    if (superAdmin) {
      const isValid = await bcrypt.compare(password, superAdmin.password);
      if (!isValid) {
        throw new UnauthorizedException('Неверный email или пароль');
      }
      return this.generateToken(superAdmin, 'SUPER_ADMIN');
    }

    // 2. Проверяем Admin
    const admin = await this.prisma.admin.findUnique({
      where: { email },
    });

    if (admin) {
      if (!admin.isActive) {
        throw new UnauthorizedException('Аккаунт деактивирован');
      }
      const isValid = await bcrypt.compare(password, admin.password);
      if (!isValid) {
        throw new UnauthorizedException('Неверный email или пароль');
      }
      return this.generateToken(admin, 'ADMIN');
    }

    // 3. Проверяем Teacher
    const teacher = await this.prisma.teacher.findUnique({
      where: { email },
    });

    if (teacher) {
      if (!teacher.isActive) {
        throw new UnauthorizedException('Аккаунт деактивирован');
      }
      const isValid = await bcrypt.compare(password, teacher.password);
      if (!isValid) {
        throw new UnauthorizedException('Неверный email или пароль');
      }
      return this.generateToken(teacher, 'TEACHER', teacher.adminId);
    }

    throw new UnauthorizedException('Неверный email или пароль');
  }

  /**
   * Генерация JWT токена
   */
  private generateToken(user: any, role: UserRole, adminId?: string) {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      role,
      name: user.name,
      adminId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role,
        ...(role === 'ADMIN' && { city: user.city, schoolName: user.schoolName }),
        ...(role === 'TEACHER' && { adminId }),
      },
    };
  }

  /**
   * Валидация JWT payload (для Guards)
   */
  async validatePayload(payload: JwtPayload) {
    switch (payload.role) {
      case 'SUPER_ADMIN':
        return this.prisma.superAdmin.findUnique({ where: { id: payload.sub } });
      case 'ADMIN':
        return this.prisma.admin.findUnique({ where: { id: payload.sub } });
      case 'TEACHER':
        return this.prisma.teacher.findUnique({ where: { id: payload.sub } });
      default:
        return null;
    }
  }

  /**
   * Хэширование пароля
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Создание SuperAdmin (только один раз при инициализации)
   */
  async createSuperAdmin(email: string, password: string, name: string) {
    const existing = await this.prisma.superAdmin.findFirst();
    if (existing) {
      throw new Error('SuperAdmin уже существует');
    }

    const hashedPassword = await this.hashPassword(password);
    return this.prisma.superAdmin.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });
  }

  /**
   * Получить текущего пользователя по JWT payload
   */
  async getCurrentUser(payload: JwtPayload) {
    const user = await this.validatePayload(payload);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    const { password: _, ...result } = user as any;
    return { ...result, role: payload.role };
  }
}

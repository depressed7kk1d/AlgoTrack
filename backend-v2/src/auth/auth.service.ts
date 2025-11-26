import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER';
  schoolId?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Универсальная валидация пользователя
   * Проверяет во всех 3-х таблицах: super_admins, admins, teachers
   */
  async validateUser(email: string, password: string): Promise<AuthUser> {
    // 1. Проверяем SuperAdmin
    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { email },
    });

    if (superAdmin) {
      const isPasswordValid = await bcrypt.compare(password, superAdmin.password);
      
      if (!isPasswordValid) {
        // Логируем неудачную попытку
        await this.logFailedLogin(email, 'SUPER_ADMIN');
        throw new UnauthorizedException('Неверный email или пароль');
      }

      // Логируем успешный вход
      await this.logSuccessLogin(superAdmin.id, 'SUPER_ADMIN');

      return {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
        role: 'SUPER_ADMIN',
      };
    }

    // 2. Проверяем Admin
    const admin = await this.prisma.admin.findUnique({
      where: { email },
      include: { school: true },
    });

    if (admin) {
      if (!admin.isActive) {
        throw new UnauthorizedException('Аккаунт деактивирован');
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Неверный email или пароль');
      }

      return {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'ADMIN',
        schoolId: admin.schoolId,
      };
    }

    // 3. Проверяем Teacher
    const teacher = await this.prisma.teacher.findUnique({
      where: { email },
      include: { school: true },
    });

    if (teacher) {
      if (!teacher.isActive) {
        throw new UnauthorizedException('Аккаунт деактивирован');
      }

      const isPasswordValid = await bcrypt.compare(password, teacher.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Неверный email или пароль');
      }

      return {
        id: teacher.id,
        email: teacher.email,
        name: teacher.name,
        role: 'TEACHER',
        schoolId: teacher.schoolId,
      };
    }

    // Не найдено ни в одной таблице
    await this.logFailedLogin(email, 'UNKNOWN');
    throw new UnauthorizedException('Неверный email или пароль');
  }

  /**
   * Логирование успешного входа
   */
  private async logSuccessLogin(userId: string, userType: any) {
    try {
      await this.prisma.activityLog.create({
        data: {
          userId,
          userType,
          action: 'LOGIN_SUCCESS',
          entity: 'Auth',
        },
      });
    } catch (error) {
      console.error('Ошибка логирования:', error);
    }
  }

  /**
   * Логирование неудачной попытки входа
   */
  private async logFailedLogin(email: string, userType: any) {
    try {
      await this.prisma.activityLog.create({
        data: {
          userId: email, // Используем email как ID для неудачных попыток
          userType,
          action: 'LOGIN_FAILED',
          entity: 'Auth',
          metadata: { email, timestamp: new Date() },
        },
      });
    } catch (error) {
      console.error('Ошибка логирования:', error);
    }
  }

  /**
   * Вход в систему
   */
  async login(user: AuthUser) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      name: user.name,
      schoolId: user.schoolId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
      },
    };
  }

  /**
   * Проверка прав доступа
   */
  canAccessSchool(user: AuthUser, schoolId: string): boolean {
    if (user.role === 'SUPER_ADMIN') {
      return true; // SuperAdmin видит всё
    }
    return user.schoolId === schoolId;
  }

  canManageTeachers(user: AuthUser): boolean {
    return user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
  }

  canManageClasses(user: AuthUser): boolean {
    return true; // Все могут создавать классы (учителя - свои, админы - любые)
  }

  canEditClass(user: AuthUser, classData: { createdBy: string; createdByType: string }): boolean {
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.role === 'ADMIN') return true; // Админ видит все классы своей школы
    if (user.role === 'TEACHER' && classData.createdBy === user.id) return true;
    return false;
  }

  /**
   * Смена пароля
   */
  async changePassword(
    userId: string,
    role: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    let user: any;

    // Находим пользователя по роли
    switch (role) {
      case 'SUPER_ADMIN':
        user = await this.prisma.superAdmin.findUnique({ where: { id: userId } });
        break;
      case 'ADMIN':
        user = await this.prisma.admin.findUnique({ where: { id: userId } });
        break;
      case 'TEACHER':
        user = await this.prisma.teacher.findUnique({ where: { id: userId } });
        break;
      default:
        throw new UnauthorizedException('Неверная роль');
    }

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    // Проверяем текущий пароль
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный текущий пароль');
    }

    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Обновляем пароль
    switch (role) {
      case 'SUPER_ADMIN':
        await this.prisma.superAdmin.update({
          where: { id: userId },
          data: { password: hashedPassword },
        });
        break;
      case 'ADMIN':
        await this.prisma.admin.update({
          where: { id: userId },
          data: { password: hashedPassword },
        });
        break;
      case 'TEACHER':
        await this.prisma.teacher.update({
          where: { id: userId },
          data: { password: hashedPassword },
        });
        break;
    }

    // Логируем смену пароля
    await this.prisma.activityLog.create({
      data: {
        userId,
        userType: role as any,
        action: 'PASSWORD_CHANGED',
        entity: 'Auth',
      },
    });

    return true;
  }
}


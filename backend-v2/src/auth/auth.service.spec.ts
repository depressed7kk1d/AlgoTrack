import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  const mockPrisma = {
    superAdmin: {
      findUnique: jest.fn(),
    },
    admin: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    teacher: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
    },
  };

  const mockJwt = {
    sign: jest.fn(() => 'mock-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('должен валидировать SuperAdmin', async () => {
      const hashedPassword = await bcrypt.hash('testpass', 10);
      
      mockPrisma.superAdmin.findUnique.mockResolvedValue({
        id: '1',
        email: 'super@test.com',
        name: 'Super',
        password: hashedPassword,
      });

      const result = await service.validateUser('super@test.com', 'testpass');

      expect(result).toEqual({
        id: '1',
        email: 'super@test.com',
        name: 'Super',
        role: 'SUPER_ADMIN',
      });
    });

    it('должен выбросить ошибку при неверном пароле', async () => {
      const hashedPassword = await bcrypt.hash('correct', 10);
      
      mockPrisma.superAdmin.findUnique.mockResolvedValue({
        id: '1',
        email: 'super@test.com',
        password: hashedPassword,
      });

      await expect(
        service.validateUser('super@test.com', 'wrong')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('должен выбросить ошибку если пользователь не найден', async () => {
      mockPrisma.superAdmin.findUnique.mockResolvedValue(null);
      mockPrisma.admin.findUnique.mockResolvedValue(null);
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(
        service.validateUser('notexist@test.com', 'any')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('должен вернуть токен и данные пользователя', async () => {
      const user = {
        id: '1',
        email: 'test@test.com',
        name: 'Test User',
        role: 'TEACHER' as any,
        schoolId: 'school-1',
      };

      const result = await service.login(user);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user.role).toBe('TEACHER');
    });
  });

  describe('canAccessSchool', () => {
    it('SuperAdmin должен видеть любую школу', () => {
      const user = {
        id: '1',
        email: 'super@test.com',
        name: 'Super',
        role: 'SUPER_ADMIN' as any,
      };

      expect(service.canAccessSchool(user, 'any-school-id')).toBe(true);
    });

    it('Admin должен видеть только свою школу', () => {
      const user = {
        id: '1',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'ADMIN' as any,
        schoolId: 'school-1',
      };

      expect(service.canAccessSchool(user, 'school-1')).toBe(true);
      expect(service.canAccessSchool(user, 'school-2')).toBe(false);
    });
  });

  describe('changePassword', () => {
    it('должен изменить пароль Teacher', async () => {
      const hashedOld = await bcrypt.hash('oldpass', 10);
      
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        password: hashedOld,
      });

      mockPrisma.teacher.update.mockResolvedValue({});
      mockPrisma.activityLog.create.mockResolvedValue({});

      const result = await service.changePassword('teacher-1', 'TEACHER', 'oldpass', 'newpass123');

      expect(result).toBe(true);
      expect(mockPrisma.teacher.update).toHaveBeenCalled();
      expect(mockPrisma.activityLog.create).toHaveBeenCalled();
    });

    it('должен выбросить ошибку при неверном текущем пароле', async () => {
      const hashedOld = await bcrypt.hash('oldpass', 10);
      
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        password: hashedOld,
      });

      await expect(
        service.changePassword('teacher-1', 'TEACHER', 'wrongpass', 'newpass')
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});


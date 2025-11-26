import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/auth/login (POST)', () => {
    it('должен войти как SuperAdmin', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'super@algoschool.org',
          password: process.env.SUPER_PASSWORD || 'changeme',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body.user.role).toBe('SUPER_ADMIN');
        });
    });

    it('должен войти как Admin', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@algoschool.org',
          password: process.env.ADMIN_PASSWORD || 'changeme',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body.user.role).toBe('ADMIN');
        });
    });

    it('должен войти как Teacher', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'alexander@algoschool.org',
          password: process.env.TEACHER_PASSWORD || 'changeme',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body.user.role).toBe('TEACHER');
        });
    });

    it('должен отклонить неверный пароль', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'alexander@algoschool.org',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('должен отклонить несуществующего пользователя', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'notexist@example.com',
          password: 'anypassword',
        })
        .expect(401);
    });
  });

  describe('/api/auth/change-password (POST)', () => {
    let token: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'alexander@algoschool.org',
          password: process.env.TEACHER_PASSWORD || 'changeme',
        });
      token = res.body.access_token;
    });

    it('должен изменить пароль', () => {
      return request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: process.env.TEACHER_PASSWORD || 'changeme',
          newPassword: 'newpassword123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toContain('успешно');
        });
    });
  });

  describe('/api/auth/me (POST)', () => {
    it('должен вернуть профиль пользователя', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'alexander@algoschool.org',
          password: process.env.TEACHER_PASSWORD || 'changeme',
        });

      const token = loginRes.body.access_token;

      return request(app.getHttpServer())
        .post('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.email).toBe('alexander@algoschool.org');
          expect(res.body.role).toBe('TEACHER');
        });
    });
  });
});


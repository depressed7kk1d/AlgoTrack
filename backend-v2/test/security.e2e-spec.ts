import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Security (e2e)', () => {
  let app: INestApplication;
  let teacherToken: string;
  let superAdminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Получаем токены
    const teacherRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'alexander@algoschool.org',
        password: process.env.TEACHER_PASSWORD || 'changeme',
      });
    teacherToken = teacherRes.body.access_token;

    const superRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'super@algoschool.org',
        password: process.env.SUPER_PASSWORD || 'changeme',
      });
    superAdminToken = superRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('RolesGuard', () => {
    it('Teacher НЕ должен иметь доступ к /api/schools', () => {
      return request(app.getHttpServer())
        .get('/api/schools')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });

    it('SuperAdmin ДОЛЖЕН иметь доступ к /api/schools', () => {
      return request(app.getHttpServer())
        .get('/api/schools')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
    });

    it('Teacher НЕ должен создавать учителей', () => {
      return request(app.getHttpServer())
        .post('/api/admin/teachers')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          name: 'Test Teacher',
          email: 'test@test.com',
          password: 'test123',
        })
        .expect(403);
    });
  });

  describe('Public endpoints', () => {
    it('/api/parent/:token должен работать БЕЗ авторизации', () => {
      return request(app.getHttpServer())
        .get('/api/parent/a1b2c3d4-e5f6-4789-a012-34567890abcd')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('student');
          expect(res.body).toHaveProperty('parent');
        });
    });

    it('/api/parent/:token с неверным токеном должен вернуть 404', () => {
      return request(app.getHttpServer())
        .get('/api/parent/invalid-token-123')
        .expect(404);
    });
  });

  describe('Rate Limiting', () => {
    it('должен блокировать после 100 запросов', async () => {
      // Делаем 101 запрос
      for (let i = 0; i < 101; i++) {
        const res = await request(app.getHttpServer())
          .get('/api/health');
        
        if (i === 100) {
          expect(res.status).toBe(429); // Too Many Requests
        }
      }
    });
  });

  describe('CORS', () => {
    it('должен разрешать запросы с algoschool.org', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .set('Origin', 'https://algoschool.org')
        .expect(200)
        .expect((res) => {
          expect(res.headers['access-control-allow-origin']).toBeDefined();
        });
    });
  });
});


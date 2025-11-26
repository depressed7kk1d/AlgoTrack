import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { CryptoModule } from './crypto/crypto.module';
import { AuthModule } from './auth/auth.module';
import { SchoolsModule } from './schools/schools.module';
import { AdminsModule } from './admins/admins.module';
import { TeachersModule } from './teachers/teachers.module';
import { ClassesModule } from './classes/classes.module';
import { StudentsModule } from './students/students.module';
import { LessonsModule } from './lessons/lessons.module';
import { CardsModule } from './cards/cards.module';
import { ParentsModule } from './parents/parents.module';
import { AiModule } from './ai/ai.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { PdfModule } from './pdf/pdf.module';
import { WorkerModule } from './worker/worker.module';
import { HealthModule } from './health/health.module';
import { SuperAdminModule } from './super-admin/super-admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate limiting (защита от DDoS и brute force)
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 60 секунд
      limit: 100,  // Макс 100 запросов в минуту с одного IP
    }]),
    PrismaModule,
    CryptoModule,  // Глобальное шифрование
    AuthModule,
    SchoolsModule,
    AdminsModule,
    TeachersModule,
    ClassesModule,
    StudentsModule,
    LessonsModule,
    CardsModule,
    ParentsModule,
    AiModule,
    WhatsAppModule,
    PdfModule,
    WorkerModule,
    HealthModule,
    SuperAdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,  // Глобальная защита от DDoS
    },
  ],
})
export class AppModule {}




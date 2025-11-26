import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { AdminModule } from './admin/admin.module';
import { TeachersModule } from './teachers/teachers.module';
import { ClassesModule } from './classes/classes.module';
import { StudentsModule } from './students/students.module';
import { CardsModule } from './cards/cards.module';
import { MessagesModule } from './messages/messages.module';
import { ReportsModule } from './reports/reports.module';
import { ParentsModule } from './parents/parents.module';
import { TemplatesModule } from './templates/templates.module';
import { QueueModule } from './queue/queue.module';
import { HealthModule } from './health/health.module';
import { AIModule } from './ai/ai.module';
import { SettingsModule } from './settings/settings.module';
import { LessonsModule } from './lessons/lessons.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { ScheduledMessagesModule } from './scheduled-messages/scheduled-messages.module';
import { BroadcastModule } from './broadcast/broadcast.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    SuperAdminModule,
    AdminModule,
    TeachersModule,
    ClassesModule,
    StudentsModule,
    CardsModule,
    MessagesModule,
    ReportsModule,
    ParentsModule,
    TemplatesModule,
    QueueModule,
    HealthModule,
    AIModule,
    SettingsModule,
    LessonsModule,
    WhatsAppModule,
    ScheduledMessagesModule,
    BroadcastModule,
  ],
})
export class AppModule {}




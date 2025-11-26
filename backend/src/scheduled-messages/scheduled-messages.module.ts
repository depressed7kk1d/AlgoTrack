import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduledMessagesService } from './scheduled-messages.service';
import { ScheduledMessagesController } from './scheduled-messages.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    PrismaModule,
    WhatsAppModule,
    ScheduleModule.forRoot(),
  ],
  providers: [ScheduledMessagesService],
  controllers: [ScheduledMessagesController],
  exports: [ScheduledMessagesService],
})
export class ScheduledMessagesModule {}


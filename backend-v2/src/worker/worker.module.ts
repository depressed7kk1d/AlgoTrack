import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [PrismaModule, WhatsAppModule],
  providers: [WorkerService],
  exports: [WorkerService],
})
export class WorkerModule {}


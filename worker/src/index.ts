import 'dotenv/config';
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { sendWhatsAppGroupMessage } from './services/greenapi.service';
import { generatePdf } from './services/pdf.service';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisHost = redisUrl.includes('://') ? new URL(redisUrl).hostname : 'localhost';
const redisPort = redisUrl.includes('://') ? parseInt(new URL(redisUrl).port) : 6379;

console.log('🚀 Starting AlgoTrack Worker...');
console.log(`📡 Connecting to Redis at ${redisHost}:${redisPort}`);

// Worker for processing messages
const messageWorker = new Worker(
  'messages',
  async (job) => {
    console.log(`📨 Processing message job ${job.id}...`);

    const { messageQueueId, message, chatId } = job.data;

    try {
      // Update status to PROCESSING
      await prisma.messageQueue.update({
        where: { id: messageQueueId },
        data: { status: 'PROCESSING' },
      });

      // Send WhatsApp message via GreenAPI (group message)
      await sendWhatsAppGroupMessage(chatId, message);

      // Update status to SENT
      await prisma.messageQueue.update({
        where: { id: messageQueueId },
        data: {
          status: 'SENT',
          processedAt: new Date(),
        },
      });

      console.log(`✅ Message sent successfully (job ${job.id})`);
    } catch (error: any) {
      console.error(`❌ Error sending message (job ${job.id}):`, error.message);

      // Update status to FAILED
      const attempts = (job.attemptsMade || 0) + 1;
      await prisma.messageQueue.update({
        where: { id: messageQueueId },
        data: {
          status: attempts >= 3 ? 'FAILED' : 'PENDING',
          attempts,
          lastError: error.message,
        },
      });

      throw error; // Re-throw to trigger retry
    }
  },
  {
    connection: {
      host: redisHost,
      port: redisPort,
    },
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000, // 10 messages per second
    },
  },
);

// Worker for generating PDF reports
const pdfWorker = new Worker(
  'pdf-generation',
  async (job) => {
    console.log(`📄 Processing PDF generation job ${job.id}...`);

    const { reportId, html } = job.data;

    try {
      const pdfUrl = await generatePdf(html, reportId);

      // Update report with PDF URL
      await prisma.osReport.update({
        where: { id: reportId },
        data: {
          reportPdfUrl: pdfUrl,
          status: 'GENERATED',
        },
      });

      console.log(`✅ PDF generated successfully (job ${job.id})`);
    } catch (error: any) {
      console.error(`❌ Error generating PDF (job ${job.id}):`, error.message);
      throw error;
    }
  },
  {
    connection: {
      host: redisHost,
      port: redisPort,
    },
    concurrency: 2, // PDF generation is CPU intensive
  },
);

messageWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

messageWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

pdfWorker.on('completed', (job) => {
  console.log(`✅ PDF job ${job.id} completed`);
});

pdfWorker.on('failed', (job, err) => {
  console.error(`❌ PDF job ${job?.id} failed:`, err.message);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down workers...');
  await messageWorker.close();
  await pdfWorker.close();
  await prisma.$disconnect();
  process.exit(0);
});

console.log('✅ Workers started and listening for jobs');


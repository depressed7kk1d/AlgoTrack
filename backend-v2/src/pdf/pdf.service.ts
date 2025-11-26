import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  private uploadsDir = path.join(process.cwd(), 'uploads', 'pdfs');

  constructor(private prisma: PrismaService) {
    // Создаём директорию для PDF если её нет
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Генерация PDF отчёта
   */
  async generateReport(reportId: string): Promise<string> {
    const report = await this.prisma.personalReport.findUnique({
      where: { id: reportId },
      include: {
        student: {
          include: {
            lessonCards: {
              include: { lesson: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!report) {
      throw new Error('Отчёт не найден');
    }

    // Генерируем HTML для PDF
    const html = this.generateHtml(report);

    // Генерируем PDF через Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfPath = path.join(
        this.uploadsDir,
        `report_${report.studentId}_${Date.now()}.pdf`
      );

      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      await browser.close();

      // Обновляем отчёт
      const pdfUrl = `/reports/${path.basename(pdfPath)}`;
      
      await this.prisma.personalReport.update({
        where: { id: reportId },
        data: {
          pdfUrl,
          pdfGenerated: true,
        },
      });

      return pdfUrl;
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  /**
   * Генерация HTML для PDF
   */
  private generateHtml(report: any): string {
    const student = report.student;
    
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Отчёт - ${student.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      margin-bottom: 30px;
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header p {
      font-size: 16px;
      opacity: 0.9;
    }
    
    .content {
      padding: 0 30px;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .section h2 {
      color: #667eea;
      font-size: 20px;
      margin-bottom: 15px;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }
    
    .student-info {
      background: #f7f7f7;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 20px;
    }
    
    .student-info p {
      margin: 5px 0;
      font-size: 14px;
    }
    
    .lessons {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .lesson {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 15px;
    }
    
    .lesson-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .lesson-number {
      font-size: 18px;
      font-weight: bold;
      color: #667eea;
    }
    
    .lesson-percent {
      font-size: 20px;
      font-weight: bold;
      color: ${report.avgCompletion >= 80 ? '#10b981' : report.avgCompletion >= 60 ? '#f59e0b' : '#ef4444'};
    }
    
    .lesson-topic {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
    }
    
    .progress-bar {
      background: #e0e0e0;
      height: 10px;
      border-radius: 5px;
      overflow: hidden;
      margin-top: 10px;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s;
    }
    
    .summary {
      background: #f0f4ff;
      padding: 20px;
      border-radius: 10px;
      border-left: 4px solid #667eea;
    }
    
    .summary h3 {
      color: #667eea;
      margin-bottom: 10px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Отчёт об успеваемости</h1>
    <p>Алгоритмика - Международная школа программирования</p>
  </div>
  
  <div class="content">
    <div class="student-info">
      <p><strong>Ученик:</strong> ${student.name}</p>
      <p><strong>Период:</strong> Уроки ${report.fromLesson} - ${report.toLesson}</p>
      <p><strong>Средняя успеваемость:</strong> <strong style="color: ${report.avgCompletion >= 80 ? '#10b981' : report.avgCompletion >= 60 ? '#f59e0b' : '#ef4444'}">${report.avgCompletion.toFixed(0)}%</strong></p>
      <p><strong>Дата:</strong> ${new Date(report.createdAt).toLocaleDateString('ru-RU')}</p>
    </div>
    
    <div class="section">
      <h2>📚 Детализация по урокам</h2>
      <div class="lessons">
        ${student.lessonCards.slice(0, 4).map((card: any, index: number) => `
          <div class="lesson">
            <div class="lesson-header">
              <div class="lesson-number">Урок ${index + 1}</div>
              <div class="lesson-percent">${card.completionPercent}%</div>
            </div>
            <div class="lesson-topic">${card.lesson.topic || 'Тема урока'}</div>
            <p><strong>Что получилось:</strong> ${card.whatWorked || '-'}</p>
            <p><strong>Над чем поработать:</strong> ${card.toImprove || '-'}</p>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${card.completionPercent}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="section">
      <div class="summary">
        <h3>✨ Образовательный результат</h3>
        <div style="white-space: pre-line; line-height: 1.8;">${report.content}</div>
      </div>
    </div>
    
    <div class="footer">
      <p>Алгоритмика - Международная школа программирования</p>
      <p>Этот отчёт сгенерирован автоматически системой AlgoTrack</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}


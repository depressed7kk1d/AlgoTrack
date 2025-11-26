import { Controller, Post, Get, Param, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';
import * as path from 'path';

@ApiTags('PDF')
@Controller('pdf')
export class PdfController {
  constructor(private pdfService: PdfService) {}

  @Post('generate/:reportId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Генерация PDF отчёта' })
  async generateReport(@Param('reportId') reportId: string) {
    const pdfUrl = await this.pdfService.generateReport(reportId);
    return { pdfUrl };
  }

  @Get('reports/:filename')
  @ApiOperation({ summary: 'Скачать PDF отчёт' })
  async downloadReport(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = path.join(process.cwd(), 'uploads', 'pdfs', filename);
    res.sendFile(filePath);
  }
}


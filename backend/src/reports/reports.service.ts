import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AIService,
  ) {}

  async generateOsReport(moduleId: string, studentId: string, adminId?: string) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        lessons: {
          include: {
            cards: {
              where: { studentId },
            },
          },
          orderBy: { lessonNumber: 'asc' },
        },
        class: {
          include: {
            admin: true,
            teacher: true,
          },
        },
      },
    });

    if (!module) {
      throw new NotFoundException('Модуль не найден');
    }

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        parent: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Ученик не найден');
    }

    // Получаем админа если передан ID
    let admin = module.class.admin;
    if (adminId) {
      const foundAdmin = await this.prisma.admin.findUnique({ 
        where: { id: adminId },
        select: {
          id: true,
          name: true,
          osTemplateExample: true,
        },
      });
      if (foundAdmin) admin = foundAdmin as any;
    }

    // Собираем данные по урокам
    const lessonsData = module.lessons.map((lesson) => {
      const card = lesson.cards[0]; // карточка для этого ученика
      return {
        lessonNumber: lesson.lessonNumber,
        topic: lesson.topic,
        description: lesson.description,
        percentCompletion: card?.percentCompletion || 0,
        wasPresent: card?.wasPresent ?? false,
        notes: card?.notes,
      };
    });

    // Считаем статистику
    const attendedLessons = lessonsData.filter(l => l.wasPresent);
    const avgCompletion = attendedLessons.length > 0
      ? Math.round(attendedLessons.reduce((sum, l) => sum + l.percentCompletion, 0) / attendedLessons.length)
      : 0;

    // Собираем навыки из карточек
    const allSkills = new Set<string>();
    module.lessons.forEach((lesson) => {
      lesson.cards.forEach((card) => {
        const skills = card.skills as string[];
        skills?.forEach((skill) => allSkills.add(skill));
      });
    });

    // Генерируем текст через AI
    let reportText = '';
    try {
      reportText = await this.aiService.generatePersonalOS({
        adminName: admin.name,
        teacherName: module.class.teacher.name,
        studentName: student.name,
        parentName: student.parent.name,
        parentType: student.parent.parentType,
        moduleName: module.title,
        lessonsData: lessonsData.map(l => ({
          lessonNumber: l.lessonNumber,
          topic: l.topic,
          description: l.description || undefined,
          percentCompletion: l.percentCompletion,
          wasPresent: l.wasPresent,
        })),
        avgCompletion,
        totalLessons: module.lessons.length,
        attendedLessons: attendedLessons.length,
        // Передаём персональный шаблон админа если есть
        customTemplate: (admin as any).osTemplateExample || undefined,
      });
    } catch (error) {
      console.error('AI generation failed:', error);
      // Fallback template
      reportText = this.generateFallbackText(
        student,
        module,
        lessonsData,
        avgCompletion,
        admin.name,
        module.class.teacher.name,
      );
    }

    // Генерируем HTML для PDF
    const reportHtml = this.generateReportHtml(
      module,
      student,
      lessonsData,
      avgCompletion,
      Array.from(allSkills),
      admin.name,
      module.class.teacher.name,
    );

    // Сохраняем отчёт
    const report = await this.prisma.osReport.upsert({
      where: {
        moduleId_studentId: {
          moduleId,
          studentId,
        },
      },
      update: {
        reportText,
        reportHtml,
        avgCompletion,
        status: 'GENERATED',
        generatedAt: new Date(),
      },
      create: {
        module: { connect: { id: moduleId } },
        student: { connect: { id: studentId } },
        reportText,
        reportHtml,
        avgCompletion,
        status: 'GENERATED',
      },
    });

    // Обновляем время генерации модуля
    await this.prisma.module.update({
      where: { id: moduleId },
      data: { osGeneratedAt: new Date() },
    });

    return {
      report,
      text: reportText,
      avgCompletion,
      attendedLessons: attendedLessons.length,
      totalLessons: module.lessons.length,
      skills: Array.from(allSkills),
    };
  }

  async getStudentReports(studentId: string) {
    return this.prisma.osReport.findMany({
      where: { studentId },
      include: {
        module: true,
      },
      orderBy: { generatedAt: 'desc' },
    });
  }

  async getModuleReports(moduleId: string) {
    return this.prisma.osReport.findMany({
      where: { moduleId },
      include: {
        student: {
          include: {
            parent: true,
          },
        },
      },
      orderBy: { generatedAt: 'desc' },
    });
  }

  private generateFallbackText(
    student: any,
    module: any,
    lessonsData: any[],
    avgCompletion: number,
    adminName: string,
    teacherName: string,
  ): string {
    const attendedCount = lessonsData.filter(l => l.wasPresent).length;
    
    const lessonsText = lessonsData
      .map((l) => {
        const ordinal = this.getOrdinal(l.lessonNumber);
        if (!l.wasPresent) {
          return `— На ${ordinal} уроке ${student.name} отсутствовал - тема занятия: ${l.topic}`;
        }
        return `— На ${ordinal} уроке ${student.name} изучал тему "${l.topic}". ${l.percentCompletion}% выполнения практических заданий`;
      })
      .join('\n\n');

    let result = '';
    if (avgCompletion >= 90) {
      result = `${student.name} показал высокий уровень выполнения заданий. Планируем перевод на более сложный трек.`;
    } else if (avgCompletion >= 70) {
      result = `${student.name} активно работает на уроках и показывает хорошие результаты.`;
    } else {
      result = `${student.name} есть над чем поработать. Рекомендуем повторить материал.`;
    }

    return `${student.parent.name}, доброе утро, на связи ${adminName} ☀

Делюсь обратной связью после ${module.lessons.length} занятий по модулю «${module.title}» от педагога ${teacherName} 💻

Средний процент выполнения заданий ${student.name} на образовательной платформе за ${attendedCount} занятия — ${avgCompletion}%

${lessonsText}

Образовательный результат: ${result}

Желаем ${student.name} успехов в дальнейшем обучении и всегда рады вашей обратной связи 🤝🏻`;
  }

  private getOrdinal(num: number): string {
    const ordinals: Record<number, string> = {
      1: 'первом',
      2: 'втором',
      3: 'третьем',
      4: 'четвёртом',
      5: 'пятом',
      6: 'шестом',
      7: 'седьмом',
      8: 'восьмом',
    };
    return ordinals[num] || `${num}-м`;
  }

  private generateReportHtml(
    module: any,
    student: any,
    lessonsData: any[],
    avgCompletion: number,
    skills: string[],
    adminName: string,
    teacherName: string,
  ): string {
    const topics = lessonsData.map((l) => l.topic).filter(Boolean).join(', ');
    
    const lessonsRows = lessonsData
      .map((l) => `
        <tr>
          <td>Урок ${l.lessonNumber}</td>
          <td>${l.topic || '—'}</td>
          <td>${l.wasPresent ? '✅ Да' : '❌ Нет'}</td>
          <td><strong>${l.percentCompletion}%</strong></td>
        </tr>
      `)
      .join('');

    const progressColor = avgCompletion >= 80 ? '#22c55e' : avgCompletion >= 50 ? '#eab308' : '#ef4444';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Итоговый отчет - ${student.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 40px; 
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
          }
          .header h1 { font-size: 28px; margin-bottom: 10px; }
          .header p { opacity: 0.9; font-size: 16px; }
          .content { padding: 40px; }
          .student-info {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 15px;
          }
          .avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 32px;
            font-weight: bold;
          }
          .student-details h2 { font-size: 24px; color: #1e293b; }
          .student-details p { color: #64748b; }
          .progress-section {
            margin-bottom: 30px;
            text-align: center;
          }
          .progress-circle {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            background: conic-gradient(${progressColor} ${avgCompletion * 3.6}deg, #e2e8f0 0deg);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 20px auto;
            position: relative;
          }
          .progress-circle::before {
            content: '';
            width: 120px;
            height: 120px;
            background: white;
            border-radius: 50%;
            position: absolute;
          }
          .progress-circle span {
            position: relative;
            z-index: 1;
            font-size: 32px;
            font-weight: bold;
            color: ${progressColor};
          }
          .section { margin-bottom: 30px; }
          .section h3 { 
            font-size: 18px; 
            color: #334155; 
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e2e8f0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }
          th {
            background: #f8fafc;
            font-weight: 600;
            color: #475569;
          }
          tr:hover { background: #f8fafc; }
          .skills {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }
          .skill-tag {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            padding: 30px;
            background: #f8fafc;
            color: #64748b;
          }
          .teacher-info {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
          }
          .teacher-info p { color: #166534; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Отчёт по модулю</h1>
            <p>«${module.title}»</p>
          </div>
          
          <div class="content">
            <div class="student-info">
              <div class="avatar">${student.name.charAt(0)}</div>
              <div class="student-details">
                <h2>${student.name}</h2>
                <p>Родитель: ${student.parent.name}</p>
              </div>
            </div>

            <div class="teacher-info">
              <p>👨‍🏫 <strong>Педагог:</strong> ${teacherName}</p>
              <p>📚 <strong>Модуль:</strong> ${module.title}</p>
              <p>📅 <strong>Занятий:</strong> ${lessonsData.length}</p>
            </div>

            <div class="progress-section">
              <h3>📈 Средний результат</h3>
              <div class="progress-circle">
                <span>${avgCompletion}%</span>
              </div>
              <p style="color: #64748b;">выполнения практических заданий</p>
            </div>

            <div class="section">
              <h3>📋 Детализация по урокам</h3>
              <table>
                <thead>
                  <tr>
                    <th>Урок</th>
                    <th>Тема</th>
                    <th>Присутствие</th>
                    <th>Результат</th>
                  </tr>
                </thead>
                <tbody>
                  ${lessonsRows}
                </tbody>
              </table>
            </div>

            ${skills.length > 0 ? `
            <div class="section">
              <h3>🎯 Освоенные навыки</h3>
              <div class="skills">
                ${skills.map((s) => `<span class="skill-tag">${s}</span>`).join('')}
              </div>
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <p><strong>Международная школа программирования "Алгоритмика"</strong></p>
            <p>Подготовлено: ${adminName}</p>
            <p>Дата: ${new Date().toLocaleDateString('ru-RU')}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

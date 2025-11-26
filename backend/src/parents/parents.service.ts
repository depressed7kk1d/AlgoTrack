import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParentsService {
  constructor(private prisma: PrismaService) {}

  async getStudentByToken(token: string) {
    const parentLink = await this.prisma.parentLink.findUnique({
      where: { linkToken: token },
      include: {
        student: {
          include: {
            parent: true,
            classStudents: {
              include: {
                class: {
                  include: {
                    teacher: {
                      select: { id: true, name: true },
                    },
                    modules: {
                      include: {
                        lessons: {
                          orderBy: { lessonNumber: 'asc' },
                        },
                        osReports: {
                          where: {
                            studentId: undefined, // Will filter below
                          },
                        },
                      },
                      orderBy: { createdAt: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parentLink) {
      throw new NotFoundException('Ссылка не найдена');
    }

    // Check expiration
    if (parentLink.expiresAt && parentLink.expiresAt < new Date()) {
      throw new NotFoundException('Срок действия ссылки истёк');
    }

    const student = parentLink.student;
    const classStudent = student.classStudents[0];
    
    if (!classStudent) {
      throw new NotFoundException('Ученик не записан в класс');
    }

    const classData = classStudent.class;

    // Get cards for this student
    const cards = await this.prisma.card.findMany({
      where: { studentId: student.id },
      include: {
        lesson: {
          select: { id: true, moduleId: true },
        },
      },
    });

    // Get reports for this student
    const reports = await this.prisma.osReport.findMany({
      where: { studentId: student.id },
    });

    // Build card map for quick lookup
    const cardMap = new Map(cards.map((c) => [c.lessonId, c]));
    const reportMap = new Map(reports.map((r) => [r.moduleId, r]));

    // Process modules with lessons and cards
    const modules = classData.modules.map((module) => {
      const lessonsWithCards = module.lessons.map((lesson) => {
        const card = cardMap.get(lesson.id);
        return {
          id: lesson.id,
          lessonNumber: lesson.lessonNumber,
          topic: lesson.topic,
          date: lesson.date,
          card: card
            ? {
                taskCompletedCount: card.taskCompletedCount || 0,
                totalTasks: card.taskTotalForLesson || 1,
                activity: card.activityLevel,
                mood: card.mood,
              }
            : null,
        };
      });

      const report = reportMap.get(module.id);

      return {
        id: module.id,
        title: module.title,
        lessonsCount: module.lessonsCount,
        lessons: lessonsWithCards,
        report: report
          ? {
              reportText: report.reportText,
              avgCompletion: report.avgCompletion,
              status: report.status,
              createdAt: report.createdAt,
            }
          : null,
      };
    });

    // Calculate overall progress
    const allLessonsWithCards = cards.length;
    const totalLessons = classData.modules.reduce((sum, m) => sum + m.lessons.length, 0);
    
    const totalCompletion = cards.reduce((sum, c) => {
      const total = c.taskTotalForLesson || 1;
      const completed = c.taskCompletedCount || 0;
      return sum + (total > 0 ? (completed / total) * 100 : 0);
    }, 0);
    const overallProgress = cards.length > 0 ? totalCompletion / cards.length : 0;

    return {
      student: {
        id: student.id,
        name: student.name,
        avatar: student.avatar,
      },
      parent: {
        name: student.parent.name,
      },
      class: {
        name: classData.name,
        teacher: classData.teacher,
      },
      modules,
      overallProgress: Math.round(overallProgress),
      totalLessons,
      completedLessons: allLessonsWithCards,
    };
  }
}

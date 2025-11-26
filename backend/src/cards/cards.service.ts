import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { ActivityLevel, Mood } from '@prisma/client';

@Injectable()
export class CardsService {
  constructor(private prisma: PrismaService) {}

  async create(createCardDto: CreateCardDto, teacherId: string) {
    // Verify lesson exists and belongs to teacher's class
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: createCardDto.lessonId },
      include: { class: true },
    });

    if (!lesson) {
      throw new NotFoundException('Урок не найден');
    }

    // Check if teacher owns the class
    if (lesson.class.teacherId !== teacherId) {
      throw new BadRequestException('Нет доступа к этому классу');
    }

    // Check if card already exists
    const existingCard = await this.prisma.card.findFirst({
      where: {
        lessonId: createCardDto.lessonId,
        studentId: createCardDto.studentId,
      },
    });

    if (existingCard) {
      throw new BadRequestException('Карточка для этого ученика уже существует');
    }

    // Calculate percent completion if not provided
    let percentCompletion = createCardDto.percentCompletion;
    if (!percentCompletion && createCardDto.taskCompletedCount !== undefined) {
      const taskTotal = createCardDto.taskTotalForLesson || 1;
      percentCompletion = (createCardDto.taskCompletedCount / taskTotal) * 100;
    }

    const card = await this.prisma.card.create({
      data: {
        lessonId: createCardDto.lessonId,
        studentId: createCardDto.studentId,
        activityLevel: createCardDto.activityLevel as ActivityLevel,
        skills: createCardDto.skills || [],
        mood: createCardDto.mood as Mood,
        notes: createCardDto.notes,
        recommendation: createCardDto.recommendation,
        percentCompletion: percentCompletion || 0,
        taskCompletedCount: createCardDto.taskCompletedCount || 0,
        taskTotalForLesson: createCardDto.taskTotalForLesson || 1,
        externalProjectLink: createCardDto.externalProjectLink,
        createdByTeacherId: teacherId,
      },
      include: {
        student: {
          include: { parent: true },
        },
        lesson: true,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: teacherId,
        actorType: 'teacher',
        action: 'CREATE_CARD',
        details: {
          cardId: card.id,
          studentId: card.studentId,
          lessonId: card.lessonId,
        },
      },
    });

    return card;
  }

  async update(id: string, updateCardDto: UpdateCardDto, teacherId: string) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      include: { lesson: { include: { class: true } } },
    });

    if (!card) {
      throw new NotFoundException('Карточка не найдена');
    }

    // Check if teacher owns the class
    if (card.lesson.class.teacherId !== teacherId) {
      throw new BadRequestException('Нет доступа к этой карточке');
    }

    // Check if card can be edited (within 24 hours)
    const hoursSinceCreation = (Date.now() - card.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      throw new BadRequestException('Карточку можно редактировать только в течение 24 часов');
    }

    // Prepare update data - only allow specific fields to be updated
    const updatePayload: any = {
      editedAt: new Date(),
      editedByTeacherId: teacherId,
    };
    
    if (updateCardDto.notes !== undefined) {
      updatePayload.notes = updateCardDto.notes;
    }
    if (updateCardDto.recommendation !== undefined) {
      updatePayload.recommendation = updateCardDto.recommendation;
    }
    if (updateCardDto.percentCompletion !== undefined) {
      updatePayload.percentCompletion = updateCardDto.percentCompletion;
    }
    
    const updatedCard = await this.prisma.card.update({
      where: { id },
      data: updatePayload,
      include: {
        student: {
          include: { parent: true },
        },
        lesson: true,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: teacherId,
        actorType: 'teacher',
        action: 'UPDATE_CARD',
        details: {
          cardId: card.id,
          changes: updatePayload,
        } as any,
      },
    });

    return updatedCard;
  }

  async findByLesson(lessonId: string, teacherId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { class: true },
    });

    if (!lesson || lesson.class.teacherId !== teacherId) {
      throw new NotFoundException('Урок не найден');
    }

    return this.prisma.card.findMany({
      where: { lessonId },
      include: {
        student: {
          include: { parent: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, teacherId: string) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      include: {
        student: {
          include: { parent: true },
        },
        lesson: {
          include: { class: true },
        },
      },
    });

    if (!card || card.lesson.class.teacherId !== teacherId) {
      throw new NotFoundException('Карточка не найдена');
    }

    return card;
  }
}



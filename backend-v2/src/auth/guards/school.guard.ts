import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Проверяет что пользователь имеет доступ к ресурсу своей школы
 */
@Injectable()
export class SchoolGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // SuperAdmin видит всё
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Для Admin и Teacher проверяем schoolId
    const resourceId = request.params.id;
    const resourceType = this.getResourceType(request.url);

    if (!resourceType || !resourceId) {
      return true; // Нет проверки для этого endpoint
    }

    // Проверяем принадлежность ресурса к школе пользователя
    const resource = await this.getResource(resourceType, resourceId);

    if (!resource) {
      throw new ForbiddenException('Ресурс не найден');
    }

    const resourceSchoolId = resource.schoolId;

    if (resourceSchoolId && resourceSchoolId !== user.schoolId) {
      throw new ForbiddenException('Нет доступа к ресурсу другой школы');
    }

    return true;
  }

  private getResourceType(url: string): string | null {
    if (url.includes('/teachers/')) return 'teacher';
    if (url.includes('/classes/')) return 'class';
    if (url.includes('/students/')) return 'student';
    return null;
  }

  private async getResource(type: string, id: string) {
    switch (type) {
      case 'teacher':
        return this.prisma.teacher.findUnique({ where: { id } });
      case 'class':
        return this.prisma.class.findUnique({ where: { id } });
      case 'student':
        return this.prisma.student.findUnique({ where: { id } });
      default:
        return null;
    }
  }
}


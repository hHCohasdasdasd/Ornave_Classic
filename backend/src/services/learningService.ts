import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CourseData {
  title: string;
  instructor?: string;
  category?: string;
  level?: string;
  duration?: string;
  rating?: number;
  enrolled?: number;
  progress?: number | null;
  saved?: boolean;
  thumbnail?: string;
}

/**
 * Learning Service
 * Course catalog / saved learning items. Strictly scoped to a single
 * company — every read/write is filtered/verified by companyId, mirroring
 * JobService.
 */
export class LearningService {
  static async listForCompany(companyId: string) {
    return prisma.course.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async create(companyId: string, data: CourseData) {
    return prisma.course.create({
      data: {
        companyId,
        title: data.title,
        instructor: data.instructor,
        category: data.category,
        level: data.level,
        duration: data.duration,
        rating: typeof data.rating === 'number' ? data.rating : undefined,
        enrolled: typeof data.enrolled === 'number' ? data.enrolled : undefined,
        progress: typeof data.progress === 'number' ? data.progress : undefined,
        saved: typeof data.saved === 'boolean' ? data.saved : undefined,
        thumbnail: data.thumbnail,
      },
    });
  }

  static async update(companyId: string, courseId: string, data: Partial<CourseData>) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.companyId !== companyId) {
      throw new Error('Unauthorized or course not found');
    }

    return prisma.course.update({
      where: { id: courseId },
      data: {
        title: data.title,
        instructor: data.instructor,
        category: data.category,
        level: data.level,
        duration: data.duration,
        rating: data.rating,
        enrolled: data.enrolled,
        progress: data.progress === undefined ? undefined : data.progress,
        saved: data.saved,
        thumbnail: data.thumbnail,
      },
    });
  }

  static async delete(companyId: string, courseId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.companyId !== companyId) {
      throw new Error('Unauthorized or course not found');
    }
    await prisma.course.delete({ where: { id: courseId } });
    return true;
  }
}

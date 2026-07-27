import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateJobRequest {
  companyId: string;
  title: string;
  location?: string;
  type?: string;
  description?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  benefits?: string[];
  qualifications?: string[];
}

export class JobService {
  static async createJob(request: CreateJobRequest) {
    const job = await prisma.job.create({
      data: {
        companyId: request.companyId,
        title: request.title,
        location: request.location,
        type: request.type || 'Full-time',
        description: request.description,
        salaryMin: request.salaryMin,
        salaryMax: request.salaryMax,
        salaryCurrency: request.salaryCurrency || 'USD',
        salaryPeriod: request.salaryPeriod || 'year',
        benefits: JSON.stringify(request.benefits || []),
        qualifications: JSON.stringify(request.qualifications || []),
      },
    });
    return this.formatJob(job);
  }

  static async listJobsForCompany(companyId: string, activeOnly = true) {
    const jobs = await prisma.job.findMany({
      where: activeOnly ? { companyId, isActive: true } : { companyId },
      orderBy: { createdAt: 'desc' },
    });
    return jobs.map((j) => this.formatJob(j));
  }

  static async deleteJob(jobId: string, companyId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.companyId !== companyId) {
      throw new Error('Unauthorized or job not found');
    }
    await prisma.job.delete({ where: { id: jobId } });
    return true;
  }

  private static formatJob(job: any) {
    let benefits: string[] = [];
    try {
      benefits = JSON.parse(job.benefits || '[]');
    } catch {
      benefits = [];
    }

    let qualifications: string[] = [];
    try {
      qualifications = JSON.parse(job.qualifications || '[]');
    } catch {
      qualifications = [];
    }

    return {
      id: job.id,
      companyId: job.companyId,
      title: job.title,
      location: job.location,
      type: job.type,
      description: job.description,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      salaryPeriod: job.salaryPeriod,
      benefits,
      qualifications,
      isActive: job.isActive,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }
}

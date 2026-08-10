import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CandidateData {
  name: string;
  title?: string;
  location?: string;
  skills?: string[];
  experience?: string;
  availability?: string;
  saved?: boolean;
}

/**
 * Talent Service
 * Saved recruiting candidates. Strictly scoped to a single company — every
 * read/write is filtered/verified by companyId, mirroring JobService.
 */
export class TalentService {
  static async listForCompany(companyId: string) {
    const candidates = await prisma.candidate.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
    return candidates.map((c) => this.formatCandidate(c));
  }

  static async create(companyId: string, data: CandidateData) {
    const candidate = await prisma.candidate.create({
      data: {
        companyId,
        name: data.name,
        title: data.title,
        location: data.location,
        skills: JSON.stringify(data.skills || []),
        experience: data.experience,
        availability: data.availability,
        saved: typeof data.saved === 'boolean' ? data.saved : undefined,
      },
    });
    return this.formatCandidate(candidate);
  }

  static async update(companyId: string, candidateId: string, data: Partial<CandidateData>) {
    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate || candidate.companyId !== companyId) {
      throw new Error('Unauthorized or candidate not found');
    }

    const updated = await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        name: data.name,
        title: data.title,
        location: data.location,
        skills: data.skills ? JSON.stringify(data.skills) : undefined,
        experience: data.experience,
        availability: data.availability,
        saved: data.saved,
      },
    });
    return this.formatCandidate(updated);
  }

  static async delete(companyId: string, candidateId: string) {
    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate || candidate.companyId !== companyId) {
      throw new Error('Unauthorized or candidate not found');
    }
    await prisma.candidate.delete({ where: { id: candidateId } });
    return true;
  }

  private static formatCandidate(candidate: any) {
    let skills: string[] = [];
    try {
      skills = JSON.parse(candidate.skills || '[]');
    } catch {
      skills = [];
    }

    return {
      id: candidate.id,
      companyId: candidate.companyId,
      name: candidate.name,
      title: candidate.title,
      location: candidate.location,
      skills,
      experience: candidate.experience,
      availability: candidate.availability,
      saved: candidate.saved,
      createdAt: candidate.createdAt.toISOString(),
      updatedAt: candidate.updatedAt.toISOString(),
    };
  }
}

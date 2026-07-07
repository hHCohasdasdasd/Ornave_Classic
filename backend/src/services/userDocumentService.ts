import { PrismaClient } from '@prisma/client';
import { UserCompanyConnectionService } from './userCompanyConnectionService';

const prisma = new PrismaClient();

export interface CreateUserDocumentData {
  companyId: string;
  fileUrl: string;
  type: string;
  visibility?: string;
  uploadedBy?: string;
}

export class UserDocumentService {
  static async uploadDocument(userId: string, data: CreateUserDocumentData) {
    await UserCompanyConnectionService.validateActiveConnection(userId, data.companyId);

    return prisma.userDocument.create({
      data: {
        userId,
        companyId: data.companyId,
        fileUrl: data.fileUrl,
        type: data.type,
        visibility: data.visibility || 'PRIVATE',
        uploadedBy: data.uploadedBy || 'USER',
      },
    });
  }

  static async getDocuments(userId: string) {
    return prisma.userDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

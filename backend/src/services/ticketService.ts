import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const TicketStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export class TicketService {
  /** Always buyer-initiated — a ticket exists to ask the connected firm
   * something and track it to resolution, unlike the freeform message
   * thread either side can write into. */
  static async create(connectionId: string, subject: string, firstMessage: string) {
    return prisma.ticket.create({
      data: {
        connectionId,
        subject,
        messages: { create: { senderIsCompany: false, content: firstMessage } },
      },
      include: { messages: true },
    });
  }

  static async list(connectionId: string) {
    return prisma.ticket.findMany({
      where: { connectionId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async getById(ticketId: string) {
    return prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { connection: { include: { company: { select: { name: true } } } } },
    });
  }

  /** Guard for the buyer side of a ticket. */
  static async getOwned(userId: string, ticketId: string) {
    const ticket = await this.getById(ticketId);
    if (!ticket || ticket.connection.userId !== userId) throw new Error('Ticket not found');
    return ticket;
  }

  /** Guard for the company side of a ticket. */
  static async getOwnedByCompany(companyId: string, ticketId: string) {
    const ticket = await this.getById(ticketId);
    if (!ticket || ticket.connection.companyId !== companyId) throw new Error('Ticket not found');
    return ticket;
  }

  static async addMessage(ticketId: string, senderIsCompany: boolean, content: string) {
    const [message] = await prisma.$transaction([
      prisma.ticketMessage.create({ data: { ticketId, senderIsCompany, content } }),
      prisma.ticket.update({ where: { id: ticketId }, data: { updatedAt: new Date() } }),
    ]);
    return message;
  }

  static async listMessages(ticketId: string) {
    return prisma.ticketMessage.findMany({ where: { ticketId }, orderBy: { createdAt: 'asc' } });
  }

  static async updateStatus(ticketId: string, status: keyof typeof TicketStatus) {
    return prisma.ticket.update({ where: { id: ticketId }, data: { status } });
  }
}

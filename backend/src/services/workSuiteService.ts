import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Work Suite Service
 * A mini-ERP owned directly by the logged-in user — projects, tasks, a CRM
 * contact list, and invoicing. Works identically for personal (USER) and
 * company (COMPANY_USER) accounts since everything is scoped to userId
 * rather than companyId.
 */

export class ProjectService {
  static async list(userId: string) {
    return prisma.project.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  static async getById(userId: string, id: string) {
    const project = await prisma.project.findFirst({ where: { id, userId } });
    if (!project) throw new Error('Project not found');
    return project;
  }

  static async create(userId: string, data: { name: string; description?: string }) {
    return prisma.project.create({
      data: { userId, name: data.name, description: data.description },
    });
  }

  static async update(
    userId: string,
    id: string,
    data: { name?: string; description?: string; status?: string }
  ) {
    await this.getById(userId, id);
    return prisma.project.update({ where: { id }, data });
  }

  static async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await prisma.project.delete({ where: { id } });
  }
}

export class TaskService {
  static async list(userId: string, projectId?: string) {
    return prisma.task.findMany({
      where: { userId, ...(projectId ? { projectId } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { project: { select: { id: true, name: true } } },
    });
  }

  static async getById(userId: string, id: string) {
    const task = await prisma.task.findFirst({ where: { id, userId } });
    if (!task) throw new Error('Task not found');
    return task;
  }

  static async create(
    userId: string,
    data: { title: string; description?: string; priority?: string; projectId?: string; dueDate?: string }
  ) {
    if (data.projectId) {
      const project = await prisma.project.findFirst({ where: { id: data.projectId, userId } });
      if (!project) throw new Error('Project not found');
    }
    return prisma.task.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        projectId: data.projectId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });
  }

  static async update(
    userId: string,
    id: string,
    data: { title?: string; description?: string; priority?: string; projectId?: string | null; dueDate?: string | null }
  ) {
    await this.getById(userId, id);
    return prisma.task.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate === undefined ? undefined : data.dueDate ? new Date(data.dueDate) : null,
      },
    });
  }

  static async updateStatus(userId: string, id: string, status: string) {
    await this.getById(userId, id);
    const task = await prisma.task.update({ where: { id }, data: { status } });

    if (status === 'DONE') {
      const doneCount = await prisma.task.count({ where: { userId, status: 'DONE' } });
      const milestones: Record<number, string> = {
        1: 'Completed your first task',
        10: 'Completed 10 tasks',
        50: 'Completed 50 tasks',
        100: 'Completed 100 tasks',
      };
      if (milestones[doneCount]) {
        await AchievementService.unlockIfNew(userId, milestones[doneCount], `Reached ${doneCount} completed task${doneCount === 1 ? '' : 's'}.`);
      }
    }

    return task;
  }

  static async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await prisma.task.delete({ where: { id } });
  }
}

export class ClientService {
  static async list(userId: string) {
    return prisma.client.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  static async getById(userId: string, id: string) {
    const client = await prisma.client.findFirst({ where: { id, userId } });
    if (!client) throw new Error('Client not found');
    return client;
  }

  static async create(
    userId: string,
    data: { name: string; email?: string; phone?: string; company?: string; notes?: string }
  ) {
    return prisma.client.create({ data: { userId, ...data } });
  }

  static async update(
    userId: string,
    id: string,
    data: { name?: string; email?: string; phone?: string; company?: string; notes?: string }
  ) {
    await this.getById(userId, id);
    return prisma.client.update({ where: { id }, data });
  }

  static async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await prisma.client.delete({ where: { id } });
  }
}

export class InvoiceService {
  static async list(userId: string) {
    return prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { id: true, name: true } } },
    });
  }

  static async getById(userId: string, id: string) {
    const invoice = await prisma.invoice.findFirst({ where: { id, userId } });
    if (!invoice) throw new Error('Invoice not found');
    return invoice;
  }

  static async generateInvoiceNumber(userId: string): Promise<string> {
    const count = await prisma.invoice.count({ where: { userId } });
    return `INV-${String(count + 1).padStart(4, '0')}`;
  }

  static async create(
    userId: string,
    data: { title: string; amount: number; currency?: string; clientId?: string; dueDate?: string }
  ) {
    if (data.clientId) {
      const client = await prisma.client.findFirst({ where: { id: data.clientId, userId } });
      if (!client) throw new Error('Client not found');
    }
    const invoiceNumber = await this.generateInvoiceNumber(userId);
    return prisma.invoice.create({
      data: {
        userId,
        invoiceNumber,
        title: data.title,
        amount: data.amount,
        currency: data.currency || 'USD',
        clientId: data.clientId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });
  }

  static async update(
    userId: string,
    id: string,
    data: { title?: string; amount?: number; currency?: string; clientId?: string | null; dueDate?: string | null }
  ) {
    await this.getById(userId, id);
    return prisma.invoice.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate === undefined ? undefined : data.dueDate ? new Date(data.dueDate) : null,
      },
    });
  }

  static async updateStatus(userId: string, id: string, status: string) {
    await this.getById(userId, id);
    return prisma.invoice.update({ where: { id }, data: { status } });
  }

  static async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await prisma.invoice.delete({ where: { id } });
  }
}

export class GoalService {
  static async list(userId: string) {
    return prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  static async getById(userId: string, id: string) {
    const goal = await prisma.goal.findFirst({ where: { id, userId } });
    if (!goal) throw new Error('Goal not found');
    return goal;
  }

  static async create(
    userId: string,
    data: { title: string; description?: string; category?: string; targetDate?: string }
  ) {
    return prisma.goal.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        category: data.category,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      },
    });
  }

  static async update(
    userId: string,
    id: string,
    data: { title?: string; description?: string; category?: string; status?: string; progress?: number; targetDate?: string | null }
  ) {
    await this.getById(userId, id);
    return prisma.goal.update({
      where: { id },
      data: {
        ...data,
        targetDate: data.targetDate === undefined ? undefined : data.targetDate ? new Date(data.targetDate) : null,
      },
    });
  }

  static async updateProgress(userId: string, id: string, progress: number) {
    const existing = await this.getById(userId, id);
    const clamped = Math.max(0, Math.min(100, progress));
    const goal = await prisma.goal.update({
      where: { id },
      data: { progress: clamped, status: clamped >= 100 ? 'COMPLETED' : undefined },
    });

    if (clamped >= 100 && existing.status !== 'COMPLETED') {
      await AchievementService.unlockIfNew(userId, `Completed goal: ${existing.title}`, 'Reached 100% progress on this goal.');
    }

    return goal;
  }

  static async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await prisma.goal.delete({ where: { id } });
  }
}

export class AchievementService {
  static async list(userId: string) {
    return prisma.achievement.findMany({ where: { userId }, orderBy: { achievedAt: 'desc' } });
  }

  static async create(
    userId: string,
    data: { title: string; description?: string; category?: string; achievedAt?: string }
  ) {
    return prisma.achievement.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        category: data.category,
        achievedAt: data.achievedAt ? new Date(data.achievedAt) : undefined,
      },
    });
  }

  static async remove(userId: string, id: string) {
    const achievement = await prisma.achievement.findFirst({ where: { id, userId } });
    if (!achievement) throw new Error('Achievement not found');
    await prisma.achievement.delete({ where: { id } });
  }

  /**
   * Auto-unlocks a milestone achievement, skipping it if this exact title
   * was already logged for the user — keeps triggers (task-count checks,
   * goal completion) idempotent even if the underlying action fires more
   * than once (e.g. a task reopened and completed again).
   */
  static async unlockIfNew(userId: string, title: string, description?: string) {
    const existing = await prisma.achievement.findFirst({ where: { userId, title } });
    if (existing) return null;
    return prisma.achievement.create({
      data: { userId, title, description, category: 'Milestone' },
    });
  }
}

export class NoteService {
  static async list(userId: string) {
    return prisma.note.findMany({
      where: { userId },
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  static async getById(userId: string, id: string) {
    const note = await prisma.note.findFirst({ where: { id, userId } });
    if (!note) throw new Error('Note not found');
    return note;
  }

  static async create(
    userId: string,
    data: {
      type?: string;
      title?: string;
      content: string;
      color?: string;
      shape?: string;
      fontSize?: string;
      posX?: number;
      posY?: number;
      parentId?: string;
    }
  ) {
    // A branch must hang off a mind-map node the caller actually owns —
    // otherwise this would let one user silently attach notes onto another
    // user's mind map by guessing/reusing a parentId.
    if (data.parentId) {
      await this.getById(userId, data.parentId);
    }
    return prisma.note.create({
      data: {
        userId,
        type: data.type || 'NOTE',
        title: data.title,
        content: data.content,
        color: data.color,
        shape: data.shape,
        fontSize: data.fontSize,
        posX: data.posX,
        posY: data.posY,
        parentId: data.parentId,
      },
    });
  }

  static async update(
    userId: string,
    id: string,
    data: {
      title?: string | null;
      content?: string;
      pinned?: boolean;
      color?: string | null;
      shape?: string | null;
      fontSize?: string | null;
      posX?: number | null;
      posY?: number | null;
    }
  ) {
    await this.getById(userId, id);
    return prisma.note.update({ where: { id }, data });
  }

  static async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await prisma.note.delete({ where: { id } });
  }
}

export class FolderService {
  static async list(userId: string, parentId: string | null) {
    return prisma.userFolder.findMany({ where: { userId, parentId }, orderBy: { name: 'asc' } });
  }

  static async getById(userId: string, id: string) {
    const folder = await prisma.userFolder.findFirst({ where: { id, userId } });
    if (!folder) throw new Error('Folder not found');
    return folder;
  }

  static async create(userId: string, data: { name: string; parentId?: string | null }) {
    // A subfolder must hang off a folder the caller actually owns — otherwise
    // this would let one user nest folders inside another user's tree.
    if (data.parentId) {
      await this.getById(userId, data.parentId);
    }
    return prisma.userFolder.create({
      data: { userId, name: data.name, parentId: data.parentId || null },
    });
  }

  /** This folder's id plus every nested folder id beneath it, however deep. */
  static async getSubtreeIds(userId: string, id: string): Promise<string[]> {
    const ids = [id];
    let frontier = [id];
    while (frontier.length) {
      const children = await prisma.userFolder.findMany({
        where: { userId, parentId: { in: frontier } },
        select: { id: true },
      });
      frontier = children.map((c) => c.id);
      ids.push(...frontier);
    }
    return ids;
  }

  static async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await prisma.userFolder.delete({ where: { id } });
  }
}

export class FileService {
  static async list(userId: string, folderId: string | null) {
    return prisma.userFile.findMany({ where: { userId, folderId }, orderBy: { createdAt: 'desc' } });
  }

  static async listByFolderIds(userId: string, folderIds: string[]) {
    return prisma.userFile.findMany({ where: { userId, folderId: { in: folderIds } } });
  }

  static async getById(userId: string, id: string) {
    const file = await prisma.userFile.findFirst({ where: { id, userId } });
    if (!file) throw new Error('File not found');
    return file;
  }

  static async create(data: { userId: string; folderId?: string | null; name: string; size: number; mimeType: string; storageKey: string }) {
    if (data.folderId) {
      await FolderService.getById(data.userId, data.folderId);
    }
    return prisma.userFile.create({ data: { ...data, folderId: data.folderId || null } });
  }

  static async remove(userId: string, id: string) {
    const file = await this.getById(userId, id);
    await prisma.userFile.delete({ where: { id } });
    return file;
  }
}

export class WorkSuiteService {
  static async getSummary(userId: string) {
    const [activeProjects, openTasks, clients, openInvoices, activeGoals, achievements, recentAchievements] = await Promise.all([
      prisma.project.count({ where: { userId, status: 'ACTIVE' } }),
      prisma.task.count({ where: { userId, status: { not: 'DONE' } } }),
      prisma.client.count({ where: { userId } }),
      prisma.invoice.findMany({ where: { userId, status: { in: ['DRAFT', 'SENT', 'OVERDUE'] } } }),
      prisma.goal.count({ where: { userId, status: 'ACTIVE' } }),
      prisma.achievement.count({ where: { userId } }),
      prisma.achievement.findMany({ where: { userId }, orderBy: { achievedAt: 'desc' }, take: 3 }),
    ]);

    const outstandingAmount = openInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    return {
      activeProjects,
      openTasks,
      clients,
      outstandingInvoices: openInvoices.length,
      outstandingAmount,
      activeGoals,
      achievements,
      recentAchievements,
    };
  }

  /**
   * Assistant briefing: a short list of things worth surfacing right now —
   * overdue/due-soon tasks, goals nearing their target, and goals that
   * haven't moved in a while. Each insight carries an actionRoute so the UI
   * can render it as a one-click nudge rather than just a notice.
   */
  static async getInsights(userId: string) {
    const now = new Date();
    const soon = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const weekOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const staleCutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [overdueTasks, dueSoonTasks, goalsNearDeadline, staleGoals] = await Promise.all([
      prisma.task.findMany({ where: { userId, status: { not: 'DONE' }, dueDate: { lt: now } }, orderBy: { dueDate: 'asc' } }),
      prisma.task.findMany({ where: { userId, status: { not: 'DONE' }, dueDate: { gte: now, lte: soon } }, orderBy: { dueDate: 'asc' } }),
      prisma.goal.findMany({ where: { userId, status: 'ACTIVE', targetDate: { gte: now, lte: weekOut } } }),
      prisma.goal.findMany({ where: { userId, status: 'ACTIVE', updatedAt: { lt: staleCutoff } } }),
    ]);

    const insights: Array<{ id: string; icon: string; message: string; actionLabel: string; actionRoute: string }> = [];

    if (overdueTasks.length > 0) {
      insights.push({
        id: 'overdue-tasks',
        icon: '⏰',
        message: overdueTasks.length === 1
          ? `"${overdueTasks[0].title}" is overdue.`
          : `${overdueTasks.length} tasks are overdue, including "${overdueTasks[0].title}".`,
        actionLabel: 'Review tasks',
        actionRoute: '/work-suite/personal?tab=board',
      });
    }

    if (dueSoonTasks.length > 0) {
      insights.push({
        id: 'due-soon-tasks',
        icon: '📅',
        message: dueSoonTasks.length === 1
          ? `"${dueSoonTasks[0].title}" is due soon.`
          : `${dueSoonTasks.length} tasks are due in the next couple of days.`,
        actionLabel: 'View tasks',
        actionRoute: '/work-suite/personal?tab=board',
      });
    }

    if (goalsNearDeadline.length > 0) {
      const first = goalsNearDeadline[0];
      insights.push({
        id: 'goals-near-deadline',
        icon: '🎯',
        message: `"${first.title}" is at ${first.progress}% with its target date coming up.`,
        actionLabel: 'Update progress',
        actionRoute: '/work-suite/personal?tab=goals',
      });
    }

    if (staleGoals.length > 0) {
      const first = staleGoals[0];
      insights.push({
        id: 'stale-goals',
        icon: '💭',
        message: `You haven't touched "${first.title}" in a couple of weeks — still on track?`,
        actionLabel: 'Check in',
        actionRoute: '/work-suite/personal?tab=goals',
      });
    }

    return insights;
  }
}

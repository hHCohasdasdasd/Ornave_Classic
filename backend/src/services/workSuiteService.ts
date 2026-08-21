import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { supabaseAdmin, FILES_BUCKET } from '../utils/supabaseStorage';
import { NotificationService } from './notificationService';
import { TIER_RANK, MemberTier } from './membershipService';

const prisma = new PrismaClient();

/** Best-effort — a failed storage removal shouldn't block the DB delete the
 * user is actually waiting on; it's logged so an orphaned object can still
 * be tracked down manually. */
async function removeStorageObjects(storageKeys: string[]): Promise<void> {
  if (!storageKeys.length || !supabaseAdmin) return;
  const { error } = await supabaseAdmin.storage.from(FILES_BUCKET).remove(storageKeys);
  if (error) console.error('[FileService] Failed to remove storage object(s):', storageKeys, error);
}

// Every ownership-guard "not found" in this file used to throw a plain
// Error, which the global error handler defaults to a 500 — masking a
// routine "that's not yours" rejection as a server fault. Tag it 404 so it
// surfaces correctly without every route needing its own try/catch.
function notFound(message: string): Error {
  const error: any = new Error(message);
  error.statusCode = 404;
  return error;
}

function conflict(message: string): Error {
  const error: any = new Error(message);
  error.statusCode = 409;
  return error;
}

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
    if (!project) throw notFound('Project not found');
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
    if (!task) throw notFound('Task not found');
    return task;
  }

  static async create(
    userId: string,
    data: { title: string; description?: string; priority?: string; projectId?: string; dueDate?: string }
  ) {
    if (data.projectId) {
      const project = await prisma.project.findFirst({ where: { id: data.projectId, userId } });
      if (!project) throw notFound('Project not found');
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

export class GoalService {
  static async list(userId: string) {
    return prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  static async getById(userId: string, id: string) {
    const goal = await prisma.goal.findFirst({ where: { id, userId } });
    if (!goal) throw notFound('Goal not found');
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

export class JobApplicationService {
  static async list(userId: string) {
    return prisma.jobApplication.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  static async getById(userId: string, id: string) {
    const application = await prisma.jobApplication.findFirst({ where: { id, userId } });
    if (!application) throw notFound('Job application not found');
    return application;
  }

  static async create(
    userId: string,
    data: { company: string; role: string; url?: string; notes?: string; appliedDate?: string }
  ) {
    return prisma.jobApplication.create({
      data: {
        userId,
        company: data.company,
        role: data.role,
        url: data.url,
        notes: data.notes,
        appliedDate: data.appliedDate ? new Date(data.appliedDate) : undefined,
      },
    });
  }

  static async update(
    userId: string,
    id: string,
    data: { company?: string; role?: string; status?: string; url?: string; notes?: string; appliedDate?: string | null }
  ) {
    await this.getById(userId, id);
    return prisma.jobApplication.update({
      where: { id },
      data: {
        ...data,
        appliedDate: data.appliedDate === undefined ? undefined : data.appliedDate ? new Date(data.appliedDate) : null,
      },
    });
  }

  static async updateStatus(userId: string, id: string, status: string) {
    await this.getById(userId, id);
    return prisma.jobApplication.update({ where: { id }, data: { status } });
  }

  static async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await prisma.jobApplication.delete({ where: { id } });
  }
}

export class CalendarEventService {
  static async list(userId: string) {
    return prisma.calendarEvent.findMany({ where: { userId }, orderBy: { startDate: 'asc' } });
  }

  static async getById(userId: string, id: string) {
    const event = await prisma.calendarEvent.findFirst({ where: { id, userId } });
    if (!event) throw notFound('Calendar event not found');
    return event;
  }

  static async create(
    userId: string,
    data: { title: string; description?: string; startDate: string; endDate?: string; allDay?: boolean; startTime?: string; endTime?: string; tableReservationId?: string }
  ) {
    return prisma.calendarEvent.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        allDay: data.allDay ?? true,
        startTime: data.allDay === false ? data.startTime : undefined,
        endTime: data.allDay === false ? data.endTime : undefined,
        tableReservationId: data.tableReservationId,
      },
    });
  }

  static async update(
    userId: string,
    id: string,
    data: { title?: string; description?: string; startDate?: string; endDate?: string | null; allDay?: boolean; startTime?: string | null; endTime?: string | null }
  ) {
    await this.getById(userId, id);
    return prisma.calendarEvent.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate === undefined ? undefined : data.endDate ? new Date(data.endDate) : null,
        allDay: data.allDay,
        startTime: data.allDay === false ? data.startTime : data.allDay === true ? null : undefined,
        endTime: data.allDay === false ? data.endTime : data.allDay === true ? null : undefined,
      },
    });
  }

  static async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await prisma.calendarEvent.delete({ where: { id } });
  }
}

export class FinanceEntryService {
  static async list(userId: string) {
    return prisma.financeEntry.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  }

  static async getById(userId: string, id: string) {
    const entry = await prisma.financeEntry.findFirst({ where: { id, userId } });
    if (!entry) throw notFound('Finance entry not found');
    return entry;
  }

  static async create(
    userId: string,
    data: { type: string; amount: number; description: string; category?: string; status?: string; date: string; notes?: string }
  ) {
    return prisma.financeEntry.create({
      data: {
        userId,
        type: data.type,
        amount: data.amount,
        description: data.description,
        category: data.category,
        status: data.status || 'PAID',
        date: new Date(data.date),
        notes: data.notes,
      },
    });
  }

  static async update(
    userId: string,
    id: string,
    data: { type?: string; amount?: number; description?: string; category?: string; status?: string; date?: string; notes?: string }
  ) {
    await this.getById(userId, id);
    return prisma.financeEntry.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
    });
  }

  static async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await prisma.financeEntry.delete({ where: { id } });
  }
}

export class ManualOrderService {
  static async list(userId: string) {
    return prisma.manualOrder.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  }

  static async getById(userId: string, id: string) {
    const order = await prisma.manualOrder.findFirst({ where: { id, userId } });
    if (!order) throw notFound('Manual order not found');
    return order;
  }

  static async create(
    userId: string,
    data: { type: string; vendor: string; description?: string; amount: number; currency?: string; status?: string; date: string; trackingNumber?: string; notes?: string }
  ) {
    return prisma.manualOrder.create({
      data: {
        userId,
        type: data.type,
        vendor: data.vendor,
        description: data.description,
        amount: data.amount,
        currency: data.currency || 'USD',
        status: data.status || 'PENDING',
        date: new Date(data.date),
        trackingNumber: data.trackingNumber,
        notes: data.notes,
      },
    });
  }

  static async update(
    userId: string,
    id: string,
    data: { type?: string; vendor?: string; description?: string; amount?: number; currency?: string; status?: string; date?: string; trackingNumber?: string; notes?: string }
  ) {
    await this.getById(userId, id);
    return prisma.manualOrder.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
    });
  }

  static async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await prisma.manualOrder.delete({ where: { id } });
  }
}

export interface WorkExperienceEntry {
  title: string;
  company: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface WorkEducationEntry {
  school: string;
  degree?: string;
  startDate?: string;
  endDate?: string;
}

export class WorkProfileService {
  /** Lazily returns an empty shape rather than 404ing — a work profile is
   * expected to not exist yet for most users, and the Jobs page always
   * wants something to render rather than special-casing "not found". */
  static async get(userId: string) {
    const profile = await prisma.workProfile.findUnique({ where: { userId } });
    if (!profile) {
      return { headline: null, summary: null, experience: [], education: [], skills: [] };
    }
    return {
      headline: profile.headline,
      summary: profile.summary,
      experience: JSON.parse(profile.experience || '[]'),
      education: JSON.parse(profile.education || '[]'),
      skills: JSON.parse(profile.skills || '[]'),
    };
  }

  static async upsert(
    userId: string,
    data: { headline?: string; summary?: string; experience?: WorkExperienceEntry[]; education?: WorkEducationEntry[]; skills?: string[] }
  ) {
    const stored = {
      headline: data.headline,
      summary: data.summary,
      experience: JSON.stringify(data.experience || []),
      education: JSON.stringify(data.education || []),
      skills: JSON.stringify(data.skills || []),
    };
    const profile = await prisma.workProfile.upsert({
      where: { userId },
      create: { userId, ...stored },
      update: stored,
    });
    return {
      headline: profile.headline,
      summary: profile.summary,
      experience: JSON.parse(profile.experience),
      education: JSON.parse(profile.education),
      skills: JSON.parse(profile.skills),
    };
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
    if (!achievement) throw notFound('Achievement not found');
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
    if (!note) throw notFound('Note not found');
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
    if (!folder) throw notFound('Folder not found');
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

  /** Deleting a folder cascades every file inside it (and any nested
   * subfolders) at the DB level — this removes their Supabase Storage
   * objects first so nothing gets orphaned there. */
  static async remove(userId: string, id: string) {
    await this.getById(userId, id);
    const subtreeIds = await this.getSubtreeIds(userId, id);
    const files = await prisma.userFile.findMany({
      where: { userId, folderId: { in: subtreeIds } },
      select: { storageKey: true },
    });
    await removeStorageObjects(files.map((f) => f.storageKey));
    await prisma.userFolder.delete({ where: { id } });
  }
}

export class FileService {
  static async list(userId: string, folderId: string | null) {
    return prisma.userFile.findMany({ where: { userId, folderId, category: null }, orderBy: { createdAt: 'desc' } });
  }

  static async listByCategory(userId: string, category: string) {
    return prisma.userFile.findMany({ where: { userId, category }, orderBy: { createdAt: 'desc' } });
  }

  static async listByFolderIds(userId: string, folderIds: string[]) {
    return prisma.userFile.findMany({ where: { userId, folderId: { in: folderIds } } });
  }

  static async listByConnection(userId: string, connectionId: string) {
    return prisma.userFile.findMany({ where: { userId, connectionId }, orderBy: { createdAt: 'desc' } });
  }

  /** Same file list, but for the company side of a connection — companies
   * have no personal Files/folders system of their own, so there's no
   * userId to scope by; the caller must have already checked connection
   * ownership before reaching here. */
  static async listByConnectionAnySide(connectionId: string) {
    return prisma.userFile.findMany({ where: { connectionId }, orderBy: { createdAt: 'desc' } });
  }

  static async getById(userId: string, id: string) {
    const file = await prisma.userFile.findFirst({ where: { id, userId } });
    if (!file) throw notFound('File not found');
    return file;
  }

  static async getByIdInConnection(connectionId: string, id: string) {
    const file = await prisma.userFile.findFirst({ where: { id, connectionId } });
    if (!file) throw notFound('File not found');
    return file;
  }

  static async create(data: { userId: string; folderId?: string | null; connectionId?: string | null; uploadedByCompany?: boolean; category?: string | null; name: string; size: number; mimeType: string; storageKey: string }) {
    if (data.folderId) {
      await FolderService.getById(data.userId, data.folderId);
    }
    return prisma.userFile.create({ data: { ...data, folderId: data.folderId || null, connectionId: data.connectionId || null, category: data.category || null } });
  }

  static async remove(userId: string, id: string) {
    const file = await this.getById(userId, id);
    await removeStorageObjects([file.storageKey]);
    await prisma.userFile.delete({ where: { id } });
    return file;
  }

  static async removeInConnection(connectionId: string, id: string) {
    const file = await this.getByIdInConnection(connectionId, id);
    await removeStorageObjects([file.storageKey]);
    await prisma.userFile.delete({ where: { id } });
    return file;
  }
}

export class WorkSuiteService {
  static async getSummary(userId: string) {
    const [activeProjects, openTasks, activeGoals, achievements, recentAchievements] = await Promise.all([
      prisma.project.count({ where: { userId, status: 'ACTIVE' } }),
      prisma.task.count({ where: { userId, status: { not: 'DONE' } } }),
      prisma.goal.count({ where: { userId, status: 'ACTIVE' } }),
      prisma.achievement.count({ where: { userId } }),
      prisma.achievement.findMany({ where: { userId }, orderBy: { achievedAt: 'desc' }, take: 3 }),
    ]);

    return {
      activeProjects,
      openTasks,
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

export class FocusService {
  static async getPrefs(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { focusWorkMinutes: true, focusBreakMinutes: true },
    });
    if (!user) throw new Error('User not found');
    return { workMinutes: user.focusWorkMinutes, breakMinutes: user.focusBreakMinutes };
  }

  static async updatePrefs(userId: string, data: { workMinutes?: number; breakMinutes?: number }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.workMinutes !== undefined ? { focusWorkMinutes: data.workMinutes } : {}),
        ...(data.breakMinutes !== undefined ? { focusBreakMinutes: data.breakMinutes } : {}),
      },
      select: { focusWorkMinutes: true, focusBreakMinutes: true },
    });
    return { workMinutes: user.focusWorkMinutes, breakMinutes: user.focusBreakMinutes };
  }

  static async logSession(userId: string, workMinutes: number, breakMinutes: number) {
    return prisma.focusSession.create({ data: { userId, workMinutes, breakMinutes } });
  }

  /** Today's completed session count, in the server's local sense of "today"
   * — good enough for a single-user stat, no timezone bookkeeping needed. */
  static async getTodaySessionCount(userId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return prisma.focusSession.count({ where: { userId, completedAt: { gte: startOfDay } } });
  }
}

/**
 * Menu items for restaurant-layout companies — managed from Work Suite,
 * and what actually populates the public profile's Menu tab (previously
 * hardcoded placeholder items identical for every restaurant).
 */
export class MenuItemService {
  static async listForCompany(companyId: string, options: { onlyAvailable?: boolean } = {}) {
    const items = await prisma.menuItem.findMany({
      where: { companyId, ...(options.onlyAvailable ? { isAvailable: true } : {}) },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return this.withImageUrls(items);
  }

  /** Mints a fresh signed URL for every item that has a photo — same
   * pattern as every other private file in this app, done here so both the
   * staff Menu page and the public/guest menu routes (which both call
   * listForCompany) get imageUrl for free. */
  static async withImageUrls<T extends { imageStorageKey: string | null }>(items: T[]): Promise<(T & { imageUrl: string | null })[]> {
    if (!supabaseAdmin) return items.map((item) => ({ ...item, imageUrl: null }));
    return Promise.all(
      items.map(async (item) => {
        if (!item.imageStorageKey) return { ...item, imageUrl: null };
        const { data } = await supabaseAdmin!.storage.from(FILES_BUCKET).createSignedUrl(item.imageStorageKey, 3600);
        return { ...item, imageUrl: data?.signedUrl || null };
      })
    );
  }

  static async create(companyId: string, data: { name: string; description?: string; price: string; category?: string; sortOrder?: number; station?: string }) {
    if (!data.name?.trim()) throw new Error('Item name is required');
    if (!data.price?.trim()) throw new Error('Price is required');
    return prisma.menuItem.create({
      data: {
        companyId,
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        price: data.price.trim(),
        category: data.category?.trim() || 'Mains',
        sortOrder: data.sortOrder ?? 0,
        station: data.station === 'BAR' ? 'BAR' : 'KITCHEN',
      },
    });
  }

  static async update(companyId: string, id: string, data: { name?: string; description?: string; price?: string; category?: string; isAvailable?: boolean; sortOrder?: number; station?: string }) {
    const existing = await prisma.menuItem.findFirst({ where: { id, companyId } });
    if (!existing) throw notFound('Menu item not found');
    return prisma.menuItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description.trim() || null } : {}),
        ...(data.price !== undefined ? { price: data.price.trim() } : {}),
        ...(data.category !== undefined ? { category: data.category.trim() || 'Mains' } : {}),
        ...(data.isAvailable !== undefined ? { isAvailable: data.isAvailable } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.station !== undefined ? { station: data.station === 'BAR' ? 'BAR' : 'KITCHEN' } : {}),
      },
    });
  }

  /** Replaces (or clears, when storageKey is null) the item's photo — the
   * old file is deleted from storage first so removed/replaced images
   * don't linger as orphaned blobs. */
  static async setImage(companyId: string, id: string, storageKey: string | null) {
    const existing = await prisma.menuItem.findFirst({ where: { id, companyId } });
    if (!existing) throw notFound('Menu item not found');
    if (existing.imageStorageKey) await removeStorageObjects([existing.imageStorageKey]);
    const updated = await prisma.menuItem.update({ where: { id }, data: { imageStorageKey: storageKey } });
    const [withUrl] = await this.withImageUrls([updated]);
    return withUrl;
  }

  static async remove(companyId: string, id: string) {
    const existing = await prisma.menuItem.findFirst({ where: { id, companyId } });
    if (!existing) throw notFound('Menu item not found');
    if (existing.imageStorageKey) await removeStorageObjects([existing.imageStorageKey]);
    await prisma.menuItem.delete({ where: { id } });
  }
}

// MenuItem.price is free-text ("$18", "18.50", "Market price") rather than a
// real numeric column — this pulls out whatever leading number it can find
// so the ordering page/staff view can total a bill. Un-parseable prices
// (e.g. "Market price") contribute 0 rather than breaking the total.
function parsePriceToNumber(price: string): number {
  const match = price.replace(/,/g, '').match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

// Voided items (Check Functions -> Void) are kept for the record but never
// count toward a bill or a table's running total.
function sumBillableItems(items: { price: string; quantity: number; status: string }[]): number {
  return items.filter((i) => i.status !== 'VOID').reduce((sum, i) => sum + parsePriceToNumber(i.price) * i.quantity, 0);
}

const DISCOUNT_TYPES = ['PERCENT', 'FIXED'];
const PAYMENT_METHODS = ['CASH', 'CARD', 'CARD_READER'];

/** Discount first, then service charge on what's left — the common
 * restaurant convention. Either can be a flat amount or a percent; a flat
 * discount is capped at the subtotal so a bill can't go negative. */
function computeBill(subtotal: number, discount: { discountType?: string | null; discountValue?: number | null }, serviceCharge: { serviceChargeType?: string | null; serviceChargeValue?: number | null }) {
  const discountAmount = discount.discountType === 'PERCENT'
    ? subtotal * ((discount.discountValue || 0) / 100)
    : discount.discountType === 'FIXED'
    ? Math.min(discount.discountValue || 0, subtotal)
    : 0;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const serviceChargeAmount = serviceCharge.serviceChargeType === 'PERCENT'
    ? afterDiscount * ((serviceCharge.serviceChargeValue || 0) / 100)
    : serviceCharge.serviceChargeType === 'FIXED'
    ? (serviceCharge.serviceChargeValue || 0)
    : 0;
  return { subtotal, discountAmount, serviceChargeAmount, total: afterDiscount + serviceChargeAmount };
}

// Same same-day arrival window as AutoCheckInService's guest-arrival lookup
// — a table order only ever needs to attach to whichever reservation is
// plausibly the one currently seated there, not any booking that ever
// existed for that table.
const TABLE_ORDER_WINDOW_MS = 3 * 60 * 60 * 1000;

/**
 * Table-side ordering — reached via the QR code on a physical table
 * (WorkSuiteFloorPlanPage generates it), fully public/no-login since
 * whoever's sitting at the table may not be the account that made the
 * reservation. Orders are just a flat list of TableOrderItem rows against
 * whichever reservation is active for that table right now — see the
 * TableOrderItem model comment in schema.prisma for why there's no
 * separate "order" header/open-close state.
 */
export class TableOrderService {
  /** Just enough for the ordering page's header — no verification gate,
   * same reasoning as MenuItemService.listForCompany. */
  static async getCompanyBasicInfo(companyId: string) {
    return prisma.company.findUnique({ where: { id: companyId }, select: { id: true, name: true } });
  }

  static async findActiveReservationForTable(companyId: string, tableId: string) {
    const now = new Date();
    return prisma.tableReservation.findFirst({
      where: {
        companyId,
        tableId,
        status: 'CONFIRMED',
        reservationTime: { gte: new Date(now.getTime() - TABLE_ORDER_WINDOW_MS), lte: new Date(now.getTime() + TABLE_ORDER_WINDOW_MS) },
      },
      orderBy: { reservationTime: 'asc' },
    });
  }

  /** The full order/bill view — shared by every read and every mutation
   * below, so "add an item" and "record a payment" return the exact same
   * shape the POS screen already renders. Takes the reservation row
   * directly (rather than re-querying via findActiveReservationForTable)
   * so it still works right after a mutation that closes/cancels it, when
   * it's no longer "active" by that lookup's own definition. */
  static async buildOrderView(reservation: { id: string; partySize: number; userId: string | null; walkInName: string | null; status: string; discountType: string | null; discountValue: number | null; discountLabel: string | null; serviceChargeType: string | null; serviceChargeValue: number | null; paymentStatus: string; paymentMethod: string | null; paidAt: Date | null }) {
    const [items, checks] = await Promise.all([
      prisma.tableOrderItem.findMany({ where: { reservationId: reservation.id }, orderBy: { createdAt: 'asc' } }),
      prisma.tableOrderCheck.findMany({ where: { reservationId: reservation.id }, orderBy: { createdAt: 'asc' } }),
    ]);

    let guestName: string | null = reservation.walkInName || null;
    if (reservation.userId && !guestName) {
      const user = await prisma.user.findUnique({ where: { id: reservation.userId }, select: { firstName: true, lastName: true } });
      guestName = user ? `${user.firstName} ${user.lastName}` : null;
    }

    const base = { reservationId: reservation.id, partySize: reservation.partySize, guestName, isWalkIn: !reservation.userId, status: reservation.status, items };

    if (checks.length) {
      const checkViews = checks.map((check) => {
        const checkItems = items.filter((i) => i.checkId === check.id);
        const bill = computeBill(sumBillableItems(checkItems), check, check);
        return {
          id: check.id, label: check.label, items: checkItems, ...bill,
          discountType: check.discountType, discountValue: check.discountValue, discountLabel: check.discountLabel,
          serviceChargeType: check.serviceChargeType, serviceChargeValue: check.serviceChargeValue,
          paymentStatus: check.paymentStatus, paymentMethod: check.paymentMethod, paidAt: check.paidAt,
        };
      });
      // Items that never got assigned to a check (shouldn't normally happen
      // — addItem defaults to the first check once a split exists) still
      // count toward the table's total so nothing silently disappears.
      const unassignedItems = items.filter((i) => !i.checkId);
      const unassignedTotal = sumBillableItems(unassignedItems);
      return {
        ...base,
        checks: checkViews,
        unassignedItems,
        subtotal: sumBillableItems(items),
        total: checkViews.reduce((sum, c) => sum + c.total, 0) + unassignedTotal,
      };
    }

    const subtotal = sumBillableItems(items);
    const bill = computeBill(subtotal, reservation, reservation);
    return {
      ...base,
      checks: null,
      discountType: reservation.discountType, discountValue: reservation.discountValue, discountLabel: reservation.discountLabel,
      serviceChargeType: reservation.serviceChargeType, serviceChargeValue: reservation.serviceChargeValue,
      paymentStatus: reservation.paymentStatus, paymentMethod: reservation.paymentMethod, paidAt: reservation.paidAt,
      ...bill,
    };
  }

  static async getOrderForTable(companyId: string, tableId: string) {
    const reservation = await this.findActiveReservationForTable(companyId, tableId);
    if (!reservation) return null;
    return this.buildOrderView(reservation);
  }

  static async addItem(companyId: string, tableId: string, data: { menuItemId: string; quantity?: number; note?: string; checkId?: string }) {
    const reservation = await this.findActiveReservationForTable(companyId, tableId);
    if (!reservation) throw notFound('No active reservation for this table right now');

    const menuItem = await prisma.menuItem.findFirst({ where: { id: data.menuItemId, companyId, isAvailable: true } });
    if (!menuItem) throw notFound('Menu item not found or unavailable');

    let checkId: string | null = null;
    if (data.checkId) {
      const check = await prisma.tableOrderCheck.findFirst({ where: { id: data.checkId, reservationId: reservation.id } });
      if (!check) throw notFound('Check not found');
      checkId = check.id;
    } else {
      // Once an order is split, a new item still needs to land somewhere —
      // default to the first check rather than leaving it unassigned.
      const firstCheck = await prisma.tableOrderCheck.findFirst({ where: { reservationId: reservation.id }, orderBy: { createdAt: 'asc' } });
      if (firstCheck) checkId = firstCheck.id;
    }

    return prisma.tableOrderItem.create({
      data: {
        reservationId: reservation.id,
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        station: menuItem.station,
        quantity: Math.max(1, Math.min(20, Math.round(data.quantity ?? 1))),
        note: data.note?.slice(0, 200),
        checkId,
      },
    });
  }

  static async removeItem(companyId: string, tableId: string, itemId: string) {
    const reservation = await this.findActiveReservationForTable(companyId, tableId);
    if (!reservation) throw notFound('No active reservation for this table right now');
    const item = await prisma.tableOrderItem.findFirst({ where: { id: itemId, reservationId: reservation.id } });
    if (!item) throw notFound('Order item not found');
    await prisma.tableOrderItem.delete({ where: { id: itemId } });
  }

  /** Check Functions -> Void — for an item that's already been sent
   * (unlike removeItem, which is a plain pre-send delete), kept on the
   * record with a reason but dropped from Kitchen/Bar and the bill. */
  static async voidItem(companyId: string, tableId: string, itemId: string, reason?: string) {
    const reservation = await this.findActiveReservationForTable(companyId, tableId);
    if (!reservation) throw notFound('No active reservation for this table right now');
    const item = await prisma.tableOrderItem.findFirst({ where: { id: itemId, reservationId: reservation.id } });
    if (!item) throw notFound('Order item not found');
    if (item.status === 'VOID') throw conflict('Item is already voided');
    await prisma.tableOrderItem.update({ where: { id: itemId }, data: { status: 'VOID', voidedAt: new Date(), voidReason: reason?.trim().slice(0, 200) || null } });
    return this.buildOrderView(reservation);
  }

  /** Check Functions -> Cancel Order — clears out whatever's still active
   * in the kitchen/bar queue (voided, not deleted, so the record survives)
   * and cancels the reservation, which is what actually frees the table.
   * Already-served items are left alone; they're history, not an in-flight
   * order to clear. */
  static async cancelOrder(companyId: string, tableId: string, reason?: string) {
    const reservation = await this.findActiveReservationForTable(companyId, tableId);
    if (!reservation) throw notFound('No active reservation for this table right now');
    await prisma.$transaction([
      prisma.tableOrderItem.updateMany({
        where: { reservationId: reservation.id, status: { in: ['NEW', 'PREPARING', 'READY'] } },
        data: { status: 'VOID', voidedAt: new Date(), voidReason: reason?.trim().slice(0, 200) || 'Order cancelled' },
      }),
      prisma.tableReservation.update({ where: { id: reservation.id }, data: { status: 'CANCELLED' } }),
    ]);
    const fresh = await prisma.tableReservation.findUniqueOrThrow({ where: { id: reservation.id } });
    return this.buildOrderView(fresh);
  }

  /** Check Functions -> Split Check — starts with two empty checks and
   * moves every not-yet-assigned item onto the first one; staff then move
   * items across with assignItemToCheck. Can only be done once per order —
   * addCheck below adds a third/fourth/etc. after that. */
  static async splitCheck(companyId: string, tableId: string) {
    const reservation = await this.findActiveReservationForTable(companyId, tableId);
    if (!reservation) throw notFound('No active reservation for this table right now');
    const existing = await prisma.tableOrderCheck.count({ where: { reservationId: reservation.id } });
    if (existing > 0) throw conflict('This order is already split — use Add Check to add another one');

    const check1 = await prisma.tableOrderCheck.create({ data: { reservationId: reservation.id, label: 'Check 1' } });
    await prisma.tableOrderCheck.create({ data: { reservationId: reservation.id, label: 'Check 2' } });
    await prisma.tableOrderItem.updateMany({ where: { reservationId: reservation.id, checkId: null }, data: { checkId: check1.id } });

    return this.buildOrderView(reservation);
  }

  static async addCheck(companyId: string, tableId: string) {
    const reservation = await this.findActiveReservationForTable(companyId, tableId);
    if (!reservation) throw notFound('No active reservation for this table right now');
    const count = await prisma.tableOrderCheck.count({ where: { reservationId: reservation.id } });
    if (count === 0) throw conflict('Split the check first before adding another one');
    await prisma.tableOrderCheck.create({ data: { reservationId: reservation.id, label: `Check ${count + 1}` } });
    return this.buildOrderView(reservation);
  }

  static async assignItemToCheck(companyId: string, tableId: string, itemId: string, checkId: string) {
    const reservation = await this.findActiveReservationForTable(companyId, tableId);
    if (!reservation) throw notFound('No active reservation for this table right now');
    const check = await prisma.tableOrderCheck.findFirst({ where: { id: checkId, reservationId: reservation.id } });
    if (!check) throw notFound('Check not found');
    const item = await prisma.tableOrderItem.findFirst({ where: { id: itemId, reservationId: reservation.id } });
    if (!item) throw notFound('Order item not found');
    await prisma.tableOrderItem.update({ where: { id: itemId }, data: { checkId } });
    return this.buildOrderView(reservation);
  }

  /** Check Functions -> Discount, ad-hoc at order time. Pass type: null to
   * clear an existing discount. Applies to the whole order unless checkId
   * is given (only valid once the order is split). */
  static async applyDiscount(companyId: string, tableId: string, data: { type: 'PERCENT' | 'FIXED' | null; value?: number; label?: string; checkId?: string }) {
    const reservation = await this.findActiveReservationForTable(companyId, tableId);
    if (!reservation) throw notFound('No active reservation for this table right now');
    if (data.type && !DISCOUNT_TYPES.includes(data.type)) throw conflict('Invalid discount type');
    if (!data.checkId) {
      const hasChecks = await prisma.tableOrderCheck.count({ where: { reservationId: reservation.id } });
      if (hasChecks) throw conflict('This order is split — apply the discount to a specific check instead');
    }

    const fields = {
      discountType: data.type,
      discountValue: data.type ? Math.max(0, data.value ?? 0) : null,
      discountLabel: data.type ? (data.label?.trim().slice(0, 100) || null) : null,
    };

    if (data.checkId) {
      const check = await prisma.tableOrderCheck.findFirst({ where: { id: data.checkId, reservationId: reservation.id } });
      if (!check) throw notFound('Check not found');
      await prisma.tableOrderCheck.update({ where: { id: data.checkId }, data: fields });
    } else {
      await prisma.tableReservation.update({ where: { id: reservation.id }, data: fields });
    }
    const fresh = await prisma.tableReservation.findUniqueOrThrow({ where: { id: reservation.id } });
    return this.buildOrderView(fresh);
  }

  /** Check Functions -> Service Charge — same ad-hoc/clear pattern as
   * applyDiscount, applied on top of whatever's left after the discount. */
  static async applyServiceCharge(companyId: string, tableId: string, data: { type: 'PERCENT' | 'FIXED' | null; value?: number; checkId?: string }) {
    const reservation = await this.findActiveReservationForTable(companyId, tableId);
    if (!reservation) throw notFound('No active reservation for this table right now');
    if (data.type && !DISCOUNT_TYPES.includes(data.type)) throw conflict('Invalid service charge type');
    if (!data.checkId) {
      const hasChecks = await prisma.tableOrderCheck.count({ where: { reservationId: reservation.id } });
      if (hasChecks) throw conflict('This order is split — apply the service charge to a specific check instead');
    }

    const fields = {
      serviceChargeType: data.type,
      serviceChargeValue: data.type ? Math.max(0, data.value ?? 0) : null,
    };

    if (data.checkId) {
      const check = await prisma.tableOrderCheck.findFirst({ where: { id: data.checkId, reservationId: reservation.id } });
      if (!check) throw notFound('Check not found');
      await prisma.tableOrderCheck.update({ where: { id: data.checkId }, data: fields });
    } else {
      await prisma.tableReservation.update({ where: { id: reservation.id }, data: fields });
    }
    const fresh = await prisma.tableReservation.findUniqueOrThrow({ where: { id: reservation.id } });
    return this.buildOrderView(fresh);
  }

  /** What's actually owed right now — the whole order's total, or one
   * check's if it's split. Computed the same way buildOrderView does, so a
   * Terminal charge always matches what the POS screen is showing rather
   * than trusting an amount the client could tamper with. */
  static async getAmountDue(companyId: string, tableId: string, checkId?: string): Promise<{ amount: number; currency: string }> {
    const reservation = await this.findActiveReservationForTable(companyId, tableId);
    if (!reservation) throw notFound('No active reservation for this table right now');
    const view: any = await this.buildOrderView(reservation);

    if (checkId) {
      const check = view.checks?.find((c: any) => c.id === checkId);
      if (!check) throw notFound('Check not found');
      if (check.paymentStatus === 'PAID') throw conflict('This check has already been paid');
      return { amount: check.total, currency: 'usd' };
    }
    if (view.checks?.length) throw conflict('This order is split — charge a specific check instead');
    if (view.paymentStatus === 'PAID') throw conflict('This order has already been paid');
    return { amount: view.total, currency: 'usd' };
  }

  /** Payments -> record that cash/card was actually collected (no real
   * card processing here — same as ringing a payment into a till). Marking
   * the whole order paid also closes it out, which is what frees the
   * table; marking one check paid only closes the table once every other
   * check for this order is paid too. */
  static async recordPayment(companyId: string, tableId: string, data: { method: string; checkId?: string }) {
    const reservation = await this.findActiveReservationForTable(companyId, tableId);
    if (!reservation) throw notFound('No active reservation for this table right now');
    if (!PAYMENT_METHODS.includes(data.method)) throw conflict('Invalid payment method');
    if (!data.checkId) {
      const hasChecks = await prisma.tableOrderCheck.count({ where: { reservationId: reservation.id } });
      if (hasChecks) throw conflict('This order is split — record payment against a specific check instead');
    }

    if (data.checkId) {
      const check = await prisma.tableOrderCheck.findFirst({ where: { id: data.checkId, reservationId: reservation.id } });
      if (!check) throw notFound('Check not found');
      if (check.paymentStatus === 'PAID') throw conflict('This check has already been paid');
      await prisma.tableOrderCheck.update({ where: { id: data.checkId }, data: { paymentStatus: 'PAID', paymentMethod: data.method, paidAt: new Date() } });

      const allChecks = await prisma.tableOrderCheck.findMany({ where: { reservationId: reservation.id } });
      const allPaid = allChecks.every((c) => c.id === data.checkId || c.paymentStatus === 'PAID');
      if (allPaid) await prisma.tableReservation.update({ where: { id: reservation.id }, data: { status: 'CLOSED' } });
    } else {
      if (reservation.paymentStatus === 'PAID') throw conflict('This order has already been paid');
      await prisma.tableReservation.update({ where: { id: reservation.id }, data: { paymentStatus: 'PAID', paymentMethod: data.method, paidAt: new Date(), status: 'CLOSED' } });
    }

    const fresh = await prisma.tableReservation.findUniqueOrThrow({ where: { id: reservation.id } });
    return this.buildOrderView(fresh);
  }

  static async updatePartySize(companyId: string, tableId: string, partySize: number) {
    const reservation = await this.findActiveReservationForTable(companyId, tableId);
    if (!reservation) throw notFound('No active reservation for this table right now');
    await prisma.tableReservation.update({ where: { id: reservation.id }, data: { partySize: Math.max(1, Math.min(20, Math.round(partySize))) } });
    const fresh = await prisma.tableReservation.findUniqueOrThrow({ where: { id: reservation.id } });
    return this.buildOrderView(fresh);
  }

  /** For the restaurant's own Reservations page — items + total for a
   * specific reservation, regardless of whether it's still in the active
   * ordering window (staff need to see the final bill after the fact too). */
  static async getOrderForReservation(reservationId: string) {
    const items = await prisma.tableOrderItem.findMany({ where: { reservationId }, orderBy: { createdAt: 'asc' } });
    return { items, total: sumBillableItems(items) };
  }

  /** Every table on the floor plan, each tagged with whatever's currently
   * active on it (if anything) — powers the server-ordering table picker,
   * where staff need to see at a glance which tables already have an open
   * tab (booked or walk-in) versus which are free to seat. */
  static async listTablesWithStatus(companyId: string) {
    const [tables, activeReservations] = await Promise.all([
      prisma.restaurantTable.findMany({ where: { companyId }, orderBy: { createdAt: 'asc' } }),
      prisma.tableReservation.findMany({
        where: {
          companyId,
          status: 'CONFIRMED',
          reservationTime: {
            gte: new Date(Date.now() - TABLE_ORDER_WINDOW_MS),
            lte: new Date(Date.now() + TABLE_ORDER_WINDOW_MS),
          },
        },
        orderBy: { reservationTime: 'asc' },
      }),
    ]);

    const activeByTableId = new Map<string, (typeof activeReservations)[number]>();
    for (const r of activeReservations) {
      if (!activeByTableId.has(r.tableId)) activeByTableId.set(r.tableId, r);
    }

    const reservationIds = activeReservations.map((r) => r.id);
    const [orderItems, users] = await Promise.all([
      reservationIds.length ? prisma.tableOrderItem.findMany({ where: { reservationId: { in: reservationIds } } }) : Promise.resolve([]),
      (() => {
        const userIds = [...new Set(activeReservations.map((r) => r.userId).filter((id): id is string => !!id))];
        return userIds.length ? prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, firstName: true, lastName: true } }) : Promise.resolve([]);
      })(),
    ]);
    const userById = new Map(users.map((u) => [u.id, u]));
    const totalsByReservationId = new Map<string, number>();
    const countsByReservationId = new Map<string, number>();
    for (const item of orderItems) {
      if (item.status === 'VOID') continue;
      totalsByReservationId.set(item.reservationId, (totalsByReservationId.get(item.reservationId) || 0) + parsePriceToNumber(item.price) * item.quantity);
      countsByReservationId.set(item.reservationId, (countsByReservationId.get(item.reservationId) || 0) + item.quantity);
    }

    return tables.map((table) => {
      const active = activeByTableId.get(table.id);
      if (!active) return { id: table.id, label: table.label, seats: table.seats, active: null };
      const user = active.userId ? userById.get(active.userId) : undefined;
      const guestName = active.walkInName || (user ? `${user.firstName} ${user.lastName}` : null);
      return {
        id: table.id,
        label: table.label,
        seats: table.seats,
        active: {
          reservationId: active.id,
          partySize: active.partySize,
          guestName,
          isWalkIn: !active.userId,
          itemCount: countsByReservationId.get(active.id) || 0,
          total: totalsByReservationId.get(active.id) || 0,
        },
      };
    });
  }
}

/**
 * Bar tabs — a walk-up bar counter isn't tied to a floor-plan table/seat,
 * unlike Server Orders' TableReservation-backed flow. A bartender starts a
 * tab under a name and orders drinks against it directly; billing (void,
 * discount, service charge, split check, payment) mirrors TableOrderService
 * exactly, just addressed by tabId instead of tableId. See BarTab/
 * BarTabCheck/BarTabItem in schema.prisma.
 */
export class BarTabService {
  static async findOpenTab(companyId: string, tabId: string) {
    return prisma.barTab.findFirst({ where: { id: tabId, companyId, status: 'OPEN' } });
  }

  /** Mirrors TableOrderService.buildOrderView — same shape (checks,
   * subtotal/discount/serviceCharge/total), just without the table/
   * party-size/guest fields that don't apply to a bar tab. */
  static async buildTabView(tab: { id: string; label: string; status: string; discountType: string | null; discountValue: number | null; discountLabel: string | null; serviceChargeType: string | null; serviceChargeValue: number | null; paymentStatus: string; paymentMethod: string | null; paidAt: Date | null }) {
    const [items, checks] = await Promise.all([
      prisma.barTabItem.findMany({ where: { tabId: tab.id }, orderBy: { createdAt: 'asc' } }),
      prisma.barTabCheck.findMany({ where: { tabId: tab.id }, orderBy: { createdAt: 'asc' } }),
    ]);

    const base = { tabId: tab.id, label: tab.label, status: tab.status, items };

    if (checks.length) {
      const checkViews = checks.map((check) => {
        const checkItems = items.filter((i) => i.checkId === check.id);
        const bill = computeBill(sumBillableItems(checkItems), check, check);
        return {
          id: check.id, label: check.label, items: checkItems, ...bill,
          discountType: check.discountType, discountValue: check.discountValue, discountLabel: check.discountLabel,
          serviceChargeType: check.serviceChargeType, serviceChargeValue: check.serviceChargeValue,
          paymentStatus: check.paymentStatus, paymentMethod: check.paymentMethod, paidAt: check.paidAt,
        };
      });
      const unassignedItems = items.filter((i) => !i.checkId);
      const unassignedTotal = sumBillableItems(unassignedItems);
      return {
        ...base,
        checks: checkViews,
        unassignedItems,
        subtotal: sumBillableItems(items),
        total: checkViews.reduce((sum, c) => sum + c.total, 0) + unassignedTotal,
      };
    }

    const subtotal = sumBillableItems(items);
    const bill = computeBill(subtotal, tab, tab);
    return {
      ...base,
      checks: null,
      discountType: tab.discountType, discountValue: tab.discountValue, discountLabel: tab.discountLabel,
      serviceChargeType: tab.serviceChargeType, serviceChargeValue: tab.serviceChargeValue,
      paymentStatus: tab.paymentStatus, paymentMethod: tab.paymentMethod, paidAt: tab.paidAt,
      ...bill,
    };
  }

  /** Every open tab, with item count + running total — powers the bar's tab
   * picker, same role listTablesWithStatus plays for Server Orders. */
  /** Walk-up tabs only — a tab started from a stool shows in the seating
   * grid instead (BarStoolService.listStoolsWithStatus), not duplicated
   * here too. */
  static async listOpenTabs(companyId: string) {
    const tabs = await prisma.barTab.findMany({ where: { companyId, status: 'OPEN', stoolId: null }, orderBy: { createdAt: 'asc' } });
    const tabIds = tabs.map((t) => t.id);
    const items = tabIds.length ? await prisma.barTabItem.findMany({ where: { tabId: { in: tabIds } } }) : [];
    const totalsByTabId = new Map<string, number>();
    const countsByTabId = new Map<string, number>();
    for (const item of items) {
      if (item.status === 'VOID') continue;
      totalsByTabId.set(item.tabId, (totalsByTabId.get(item.tabId) || 0) + parsePriceToNumber(item.price) * item.quantity);
      countsByTabId.set(item.tabId, (countsByTabId.get(item.tabId) || 0) + item.quantity);
    }
    return tabs.map((tab) => ({
      id: tab.id,
      label: tab.label,
      itemCount: countsByTabId.get(tab.id) || 0,
      total: totalsByTabId.get(tab.id) || 0,
    }));
  }

  static async startTab(companyId: string, label: string, stoolId?: string) {
    if (!label?.trim()) throw conflict('A tab needs a name');
    if (stoolId) {
      const stool = await prisma.barStool.findFirst({ where: { id: stoolId, companyId } });
      if (!stool) throw notFound('Stool not found');
      const existing = await prisma.barTab.findFirst({ where: { stoolId, status: 'OPEN' } });
      if (existing) throw conflict('This stool already has an open tab');
    }
    return prisma.barTab.create({ data: { companyId, label: label.trim().slice(0, 100), stoolId: stoolId || null } });
  }

  static async getTab(companyId: string, tabId: string) {
    const tab = await this.findOpenTab(companyId, tabId);
    if (!tab) return null;
    return this.buildTabView(tab);
  }

  static async addItem(companyId: string, tabId: string, data: { menuItemId: string; quantity?: number; note?: string; checkId?: string }) {
    const tab = await this.findOpenTab(companyId, tabId);
    if (!tab) throw notFound('Tab not found or already closed');

    const menuItem = await prisma.menuItem.findFirst({ where: { id: data.menuItemId, companyId, isAvailable: true } });
    if (!menuItem) throw notFound('Menu item not found or unavailable');

    let checkId: string | null = null;
    if (data.checkId) {
      const check = await prisma.barTabCheck.findFirst({ where: { id: data.checkId, tabId: tab.id } });
      if (!check) throw notFound('Check not found');
      checkId = check.id;
    } else {
      const firstCheck = await prisma.barTabCheck.findFirst({ where: { tabId: tab.id }, orderBy: { createdAt: 'asc' } });
      if (firstCheck) checkId = firstCheck.id;
    }

    return prisma.barTabItem.create({
      data: {
        tabId: tab.id,
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: Math.max(1, Math.min(20, Math.round(data.quantity ?? 1))),
        note: data.note?.slice(0, 200),
        checkId,
        // Explicit rather than relying on the column default — this is
        // what actually puts the item on the Bar ticket board.
        status: 'NEW',
      },
    });
  }

  static async removeItem(companyId: string, tabId: string, itemId: string) {
    const tab = await this.findOpenTab(companyId, tabId);
    if (!tab) throw notFound('Tab not found or already closed');
    const item = await prisma.barTabItem.findFirst({ where: { id: itemId, tabId: tab.id } });
    if (!item) throw notFound('Order item not found');
    await prisma.barTabItem.delete({ where: { id: itemId } });
  }

  static async voidItem(companyId: string, tabId: string, itemId: string, reason?: string) {
    const tab = await this.findOpenTab(companyId, tabId);
    if (!tab) throw notFound('Tab not found or already closed');
    const item = await prisma.barTabItem.findFirst({ where: { id: itemId, tabId: tab.id } });
    if (!item) throw notFound('Order item not found');
    if (item.status === 'VOID') throw conflict('Item is already voided');
    await prisma.barTabItem.update({ where: { id: itemId }, data: { status: 'VOID', voidedAt: new Date(), voidReason: reason?.trim().slice(0, 200) || null } });
    return this.buildTabView(tab);
  }

  /** Check Functions -> Cancel Tab — voids every still-open item and closes
   * the tab without recording payment, for a walk-out or mistaken tab. */
  static async cancelTab(companyId: string, tabId: string, reason?: string) {
    const tab = await this.findOpenTab(companyId, tabId);
    if (!tab) throw notFound('Tab not found or already closed');
    await prisma.$transaction([
      prisma.barTabItem.updateMany({
        where: { tabId: tab.id, status: { not: 'VOID' } },
        data: { status: 'VOID', voidedAt: new Date(), voidReason: reason?.trim().slice(0, 200) || 'Tab cancelled' },
      }),
      prisma.barTab.update({ where: { id: tab.id }, data: { status: 'CANCELLED' } }),
    ]);
    const fresh = await prisma.barTab.findUniqueOrThrow({ where: { id: tab.id } });
    return this.buildTabView(fresh);
  }

  static async splitCheck(companyId: string, tabId: string) {
    const tab = await this.findOpenTab(companyId, tabId);
    if (!tab) throw notFound('Tab not found or already closed');
    const existing = await prisma.barTabCheck.count({ where: { tabId: tab.id } });
    if (existing > 0) throw conflict('This tab is already split — use Add Check to add another one');

    const check1 = await prisma.barTabCheck.create({ data: { tabId: tab.id, label: 'Check 1' } });
    await prisma.barTabCheck.create({ data: { tabId: tab.id, label: 'Check 2' } });
    await prisma.barTabItem.updateMany({ where: { tabId: tab.id, checkId: null }, data: { checkId: check1.id } });

    return this.buildTabView(tab);
  }

  static async addCheck(companyId: string, tabId: string) {
    const tab = await this.findOpenTab(companyId, tabId);
    if (!tab) throw notFound('Tab not found or already closed');
    const count = await prisma.barTabCheck.count({ where: { tabId: tab.id } });
    if (count === 0) throw conflict('Split the check first before adding another one');
    await prisma.barTabCheck.create({ data: { tabId: tab.id, label: `Check ${count + 1}` } });
    return this.buildTabView(tab);
  }

  static async assignItemToCheck(companyId: string, tabId: string, itemId: string, checkId: string) {
    const tab = await this.findOpenTab(companyId, tabId);
    if (!tab) throw notFound('Tab not found or already closed');
    const check = await prisma.barTabCheck.findFirst({ where: { id: checkId, tabId: tab.id } });
    if (!check) throw notFound('Check not found');
    const item = await prisma.barTabItem.findFirst({ where: { id: itemId, tabId: tab.id } });
    if (!item) throw notFound('Order item not found');
    await prisma.barTabItem.update({ where: { id: itemId }, data: { checkId } });
    return this.buildTabView(tab);
  }

  static async applyDiscount(companyId: string, tabId: string, data: { type: 'PERCENT' | 'FIXED' | null; value?: number; label?: string; checkId?: string }) {
    const tab = await this.findOpenTab(companyId, tabId);
    if (!tab) throw notFound('Tab not found or already closed');
    if (data.type && !DISCOUNT_TYPES.includes(data.type)) throw conflict('Invalid discount type');
    if (!data.checkId) {
      const hasChecks = await prisma.barTabCheck.count({ where: { tabId: tab.id } });
      if (hasChecks) throw conflict('This tab is split — apply the discount to a specific check instead');
    }

    const fields = {
      discountType: data.type,
      discountValue: data.type ? Math.max(0, data.value ?? 0) : null,
      discountLabel: data.type ? (data.label?.trim().slice(0, 100) || null) : null,
    };

    if (data.checkId) {
      const check = await prisma.barTabCheck.findFirst({ where: { id: data.checkId, tabId: tab.id } });
      if (!check) throw notFound('Check not found');
      await prisma.barTabCheck.update({ where: { id: data.checkId }, data: fields });
    } else {
      await prisma.barTab.update({ where: { id: tab.id }, data: fields });
    }
    const fresh = await prisma.barTab.findUniqueOrThrow({ where: { id: tab.id } });
    return this.buildTabView(fresh);
  }

  static async applyServiceCharge(companyId: string, tabId: string, data: { type: 'PERCENT' | 'FIXED' | null; value?: number; checkId?: string }) {
    const tab = await this.findOpenTab(companyId, tabId);
    if (!tab) throw notFound('Tab not found or already closed');
    if (data.type && !DISCOUNT_TYPES.includes(data.type)) throw conflict('Invalid service charge type');
    if (!data.checkId) {
      const hasChecks = await prisma.barTabCheck.count({ where: { tabId: tab.id } });
      if (hasChecks) throw conflict('This tab is split — apply the service charge to a specific check instead');
    }

    const fields = {
      serviceChargeType: data.type,
      serviceChargeValue: data.type ? Math.max(0, data.value ?? 0) : null,
    };

    if (data.checkId) {
      const check = await prisma.barTabCheck.findFirst({ where: { id: data.checkId, tabId: tab.id } });
      if (!check) throw notFound('Check not found');
      await prisma.barTabCheck.update({ where: { id: data.checkId }, data: fields });
    } else {
      await prisma.barTab.update({ where: { id: tab.id }, data: fields });
    }
    const fresh = await prisma.barTab.findUniqueOrThrow({ where: { id: tab.id } });
    return this.buildTabView(fresh);
  }

  /** Mirrors TableOrderService.getAmountDue — what's actually owed on
   * this tab (or one of its split checks) right now, computed server-side
   * so a Terminal charge always matches the bill on screen. */
  static async getAmountDue(companyId: string, tabId: string, checkId?: string): Promise<{ amount: number; currency: string }> {
    const tab = await this.findOpenTab(companyId, tabId);
    if (!tab) throw notFound('Tab not found or already closed');
    const view: any = await this.buildTabView(tab);

    if (checkId) {
      const check = view.checks?.find((c: any) => c.id === checkId);
      if (!check) throw notFound('Check not found');
      if (check.paymentStatus === 'PAID') throw conflict('This check has already been paid');
      return { amount: check.total, currency: 'usd' };
    }
    if (view.checks?.length) throw conflict('This tab is split — charge a specific check instead');
    if (view.paymentStatus === 'PAID') throw conflict('This tab has already been paid');
    return { amount: view.total, currency: 'usd' };
  }

  /** Payments -> record cash/card collected. Marking the whole tab paid
   * also closes it; marking one check paid only closes the tab once every
   * other check is paid too. */
  static async recordPayment(companyId: string, tabId: string, data: { method: string; checkId?: string }) {
    const tab = await this.findOpenTab(companyId, tabId);
    if (!tab) throw notFound('Tab not found or already closed');
    if (!PAYMENT_METHODS.includes(data.method)) throw conflict('Invalid payment method');
    if (!data.checkId) {
      const hasChecks = await prisma.barTabCheck.count({ where: { tabId: tab.id } });
      if (hasChecks) throw conflict('This tab is split — record payment against a specific check instead');
    }

    if (data.checkId) {
      const check = await prisma.barTabCheck.findFirst({ where: { id: data.checkId, tabId: tab.id } });
      if (!check) throw notFound('Check not found');
      if (check.paymentStatus === 'PAID') throw conflict('This check has already been paid');
      await prisma.barTabCheck.update({ where: { id: data.checkId }, data: { paymentStatus: 'PAID', paymentMethod: data.method, paidAt: new Date() } });

      const allChecks = await prisma.barTabCheck.findMany({ where: { tabId: tab.id } });
      const allPaid = allChecks.every((c) => c.id === data.checkId || c.paymentStatus === 'PAID');
      if (allPaid) await prisma.barTab.update({ where: { id: tab.id }, data: { status: 'CLOSED' } });
    } else {
      if (tab.paymentStatus === 'PAID') throw conflict('This tab has already been paid');
      await prisma.barTab.update({ where: { id: tab.id }, data: { paymentStatus: 'PAID', paymentMethod: data.method, paidAt: new Date(), status: 'CLOSED' } });
    }

    const fresh = await prisma.barTab.findUniqueOrThrow({ where: { id: tab.id } });
    return this.buildTabView(fresh);
  }
}

const ORDER_ITEM_STATUSES = ['NEW', 'PREPARING', 'READY', 'SERVED'];

/**
 * Kitchen/Bar displays — the fullscreen, staff-facing view of incoming
 * TableOrderItem rows for one station. Each dish/drink is tagged with its
 * station at order time (see TableOrderService.addItem), so this is just a
 * filtered, table-labeled, oldest-first read of that same data plus a way
 * to advance an item's status as staff work through it.
 */
export class KitchenService {
  /** KITCHEN only ever has TableOrderItem rows (dine-in/QR orders) — BAR
   * also merges in BarTabItem rows (tab-based Bar Orders), since a drink
   * ordered against a tab needs to reach the same prep queue as one
   * ordered against a table. `source` tells the frontend which one each
   * ticket came from — a bar tab's label ("Stool 3", "Smith Party") isn't
   * a table label and shouldn't get "Table " prefixed onto it. */
  static async listForStation(companyId: string, station: 'KITCHEN' | 'BAR') {
    const tableItems = await prisma.tableOrderItem.findMany({
      where: {
        station,
        status: { notIn: ['SERVED', 'VOID'] },
        reservation: { companyId },
      },
      orderBy: { createdAt: 'asc' },
      include: { reservation: { include: { table: { select: { label: true } } } } },
    });
    const tableTickets = tableItems.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      note: item.note,
      status: item.status,
      printedAt: item.printedAt,
      createdAt: item.createdAt,
      tableLabel: item.reservation.table.label,
      partySize: item.reservation.partySize,
      source: 'table' as const,
    }));

    if (station !== 'BAR') return tableTickets;

    const tabItems = await prisma.barTabItem.findMany({
      where: {
        status: { notIn: ['SERVED', 'VOID'] },
        tab: { companyId },
      },
      orderBy: { createdAt: 'asc' },
      include: { tab: { select: { label: true } } },
    });
    const tabTickets = tabItems.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      note: item.note,
      status: item.status,
      printedAt: item.printedAt,
      createdAt: item.createdAt,
      tableLabel: item.tab.label,
      partySize: 1,
      source: 'bar-tab' as const,
    }));

    return [...tableTickets, ...tabTickets].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  static async updateStatus(companyId: string, itemId: string, status: string) {
    if (!ORDER_ITEM_STATUSES.includes(status)) throw conflict('Invalid status');
    const tableItem = await prisma.tableOrderItem.findFirst({ where: { id: itemId, reservation: { companyId } } });
    if (tableItem) return prisma.tableOrderItem.update({ where: { id: itemId }, data: { status } });
    const tabItem = await prisma.barTabItem.findFirst({ where: { id: itemId, tab: { companyId } } });
    if (tabItem) return prisma.barTabItem.update({ where: { id: itemId }, data: { status } });
    throw notFound('Order item not found');
  }

  /** Marks a ticket printed — called by the frontend right after it
   * successfully sends the print job (either method), so Auto-Print knows
   * not to print it again on the next poll, and staff can see what's
   * already gone to the printer. */
  static async markPrinted(companyId: string, itemId: string) {
    const tableItem = await prisma.tableOrderItem.findFirst({ where: { id: itemId, reservation: { companyId } } });
    if (tableItem) return prisma.tableOrderItem.update({ where: { id: itemId }, data: { printedAt: new Date() } });
    const tabItem = await prisma.barTabItem.findFirst({ where: { id: itemId, tab: { companyId } } });
    if (tabItem) return prisma.barTabItem.update({ where: { id: itemId }, data: { printedAt: new Date() } });
    throw notFound('Order item not found');
  }
}

const PRINT_METHODS = ['USB', 'BROWSER'];
const PRINTER_STATIONS = ['KITCHEN', 'BAR', 'RESERVATIONS'];

/** Per-company, per-station printer preferences — see StationPrinterSettings
 * in schema.prisma for why this isn't just one row per company. */
export class PrinterSettingsService {
  static async get(companyId: string, station: string) {
    const existing = await prisma.stationPrinterSettings.findUnique({ where: { companyId_station: { companyId, station } } });
    return existing || { companyId, station, printMethod: 'BROWSER', autoPrint: false };
  }

  static async update(companyId: string, station: string, data: { printMethod?: string; autoPrint?: boolean }) {
    if (!PRINTER_STATIONS.includes(station)) throw conflict('Invalid station');
    if (data.printMethod && !PRINT_METHODS.includes(data.printMethod)) throw conflict('Invalid print method');
    return prisma.stationPrinterSettings.upsert({
      where: { companyId_station: { companyId, station } },
      create: { companyId, station, printMethod: data.printMethod || 'BROWSER', autoPrint: data.autoPrint ?? false },
      update: { ...(data.printMethod ? { printMethod: data.printMethod } : {}), ...(data.autoPrint !== undefined ? { autoPrint: data.autoPrint } : {}) },
    });
  }
}

/** Custom header/footer lines a company wants on every printed receipt or
 * ticket — layered on top of whatever page-specific content (table name,
 * items, totals) each print call already builds, so Kitchen/Bar/
 * Reservations/Server Orders all pick this up automatically via the shared
 * usePrinter hook without any of those pages needing to change. */
export class ReceiptSettingsService {
  static async get(companyId: string) {
    const existing = await prisma.receiptSettings.findUnique({ where: { companyId } });
    return { headerText: existing?.headerText || '', footerText: existing?.footerText || '' };
  }

  static async update(companyId: string, data: { headerText?: string; footerText?: string }) {
    const headerText = (data.headerText ?? '').slice(0, 500);
    const footerText = (data.footerText ?? '').slice(0, 500);
    await prisma.receiptSettings.upsert({
      where: { companyId },
      create: { companyId, headerText, footerText },
      update: { headerText, footerText },
    });
    return { headerText, footerText };
  }
}

// The 4 functions an owner can choose to expose as quick-access buttons on
// the order screen (Print/Send are always there — the page doesn't work
// without them, so they're not configurable). Anything not in a company's
// chosen order still lives in the ⋮ menu, so no function is ever made
// unreachable by this — it only controls what additionally gets a
// shortcut, and in what order.
const POS_ACTION_IDS = ['check-functions', 'discount', 'service-charge', 'payments'];

/**
 * Which of the 4 optional order-screen actions a company has promoted to
 * quick-access buttons, and in what order — set from Server Orders'
 * "Edit Layout" screen. Reuses the PosLayoutSettings table from the
 * earlier drag-position version of this feature; `layout` just holds a
 * different JSON shape now ({ order: [...] } instead of {x,y} coordinates).
 */
export class PosLayoutSettingsService {
  static async get(companyId: string) {
    const existing = await prisma.posLayoutSettings.findUnique({ where: { companyId } });
    if (!existing) return { order: [] as string[] };
    try {
      const parsed = JSON.parse(existing.layout);
      const order = Array.isArray(parsed.order) ? parsed.order.filter((id: any) => POS_ACTION_IDS.includes(id)) : [];
      return { order };
    } catch {
      return { order: [] as string[] };
    }
  }

  static async update(companyId: string, order: string[]) {
    const clean = Array.from(new Set((order || []).filter((id) => POS_ACTION_IDS.includes(id))));
    await prisma.posLayoutSettings.upsert({
      where: { companyId },
      create: { companyId, layout: JSON.stringify({ order: clean }) },
      update: { layout: JSON.stringify({ order: clean }) },
    });
    return { order: clean };
  }
}

/**
 * Floor plan tables for restaurant-layout companies — front-of-house use
 * only (unlike MenuItem, never shown on the public profile). Position is
 * an arbitrary pixel space the frontend canvas owns; the backend just
 * stores whatever it's given.
 */
const TABLE_STATUSES = ['AVAILABLE', 'OCCUPIED', 'RESERVED'];
const TABLE_SHAPES = ['round', 'square', 'rectangle', 'half-circle'];
const DEFAULT_TABLE_SIZE: Record<string, { width: number; height: number }> = {
  round: { width: 90, height: 90 },
  square: { width: 90, height: 90 },
  rectangle: { width: 130, height: 76 },
  'half-circle': { width: 130, height: 65 },
};
const MIN_TABLE_SIZE = 40;
const MAX_TABLE_SIZE = 400;

export class RestaurantTableService {
  static async listForCompany(companyId: string) {
    return prisma.restaurantTable.findMany({ where: { companyId }, orderBy: { createdAt: 'asc' } });
  }

  static async create(companyId: string, data: { label: string; seats?: number; shape?: string; positionX?: number; positionY?: number }) {
    if (!data.label?.trim()) throw new Error('Table label is required');
    const shape = data.shape && TABLE_SHAPES.includes(data.shape) ? data.shape : 'round';
    const defaultSize = DEFAULT_TABLE_SIZE[shape];
    return prisma.restaurantTable.create({
      data: {
        companyId,
        label: data.label.trim(),
        seats: data.seats && data.seats > 0 ? data.seats : 2,
        shape,
        positionX: data.positionX ?? 40,
        positionY: data.positionY ?? 40,
        width: defaultSize.width,
        height: defaultSize.height,
      },
    });
  }

  static async update(companyId: string, id: string, data: { label?: string; seats?: number; shape?: string; status?: string; positionX?: number; positionY?: number; width?: number; height?: number }) {
    const existing = await prisma.restaurantTable.findFirst({ where: { id, companyId } });
    if (!existing) throw notFound('Table not found');
    if (data.status && !TABLE_STATUSES.includes(data.status)) throw new Error('Invalid table status');
    if (data.shape && !TABLE_SHAPES.includes(data.shape)) throw new Error('Invalid table shape');
    return prisma.restaurantTable.update({
      where: { id },
      data: {
        ...(data.label !== undefined ? { label: data.label.trim() } : {}),
        ...(data.seats !== undefined ? { seats: data.seats } : {}),
        ...(data.shape !== undefined ? { shape: data.shape } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.positionX !== undefined ? { positionX: data.positionX } : {}),
        ...(data.positionY !== undefined ? { positionY: data.positionY } : {}),
        ...(data.width !== undefined ? { width: Math.max(MIN_TABLE_SIZE, Math.min(MAX_TABLE_SIZE, Math.round(data.width))) } : {}),
        ...(data.height !== undefined ? { height: Math.max(MIN_TABLE_SIZE, Math.min(MAX_TABLE_SIZE, Math.round(data.height))) } : {}),
      },
    });
  }

  static async remove(companyId: string, id: string) {
    const existing = await prisma.restaurantTable.findFirst({ where: { id, companyId } });
    if (!existing) throw notFound('Table not found');
    await prisma.restaurantTable.delete({ where: { id } });
  }
}

/**
 * Floor plan wall segments — a hand-sketched outline, not a fixed-shape
 * palette. Each row is one straight line the company drew; a room outline
 * is just many of these end to end.
 */
export class FloorPlanWallService {
  static async listForCompany(companyId: string) {
    return prisma.floorPlanWall.findMany({ where: { companyId }, orderBy: { createdAt: 'asc' } });
  }

  static async create(companyId: string, data: { shape?: string; x1: number; y1: number; x2: number; y2: number; radius?: number }) {
    const coords = [data.x1, data.y1, data.x2, data.y2];
    if (coords.some((n) => typeof n !== 'number' || !Number.isFinite(n))) {
      throw new Error('Wall coordinates must be numbers');
    }
    const shape = data.shape === 'circle' ? 'circle' : 'line';
    if (shape === 'circle' && (!data.radius || !Number.isFinite(data.radius) || data.radius <= 0)) {
      throw new Error('Circle radius must be a positive number');
    }
    return prisma.floorPlanWall.create({
      data: {
        companyId,
        shape,
        x1: Math.round(data.x1),
        y1: Math.round(data.y1),
        x2: Math.round(data.x2),
        y2: Math.round(data.y2),
        radius: shape === 'circle' ? Math.round(data.radius!) : null,
      },
    });
  }

  /** Bends (or straightens, if curveX/curveY come back as null) an
   * existing "line" wall by setting its quadratic-bezier control point. */
  static async setCurve(companyId: string, id: string, curveX: number | null, curveY: number | null) {
    const existing = await prisma.floorPlanWall.findFirst({ where: { id, companyId } });
    if (!existing) throw notFound('Wall not found');
    if (existing.shape !== 'line') throw new Error('Only straight walls can be curved');
    return prisma.floorPlanWall.update({
      where: { id },
      data: {
        curveX: curveX === null ? null : Math.round(curveX),
        curveY: curveY === null ? null : Math.round(curveY),
      },
    });
  }

  static async remove(companyId: string, id: string) {
    const existing = await prisma.floorPlanWall.findFirst({ where: { id, companyId } });
    if (!existing) throw notFound('Wall not found');
    await prisma.floorPlanWall.delete({ where: { id } });
  }

  static async clearAll(companyId: string) {
    await prisma.floorPlanWall.deleteMany({ where: { companyId } });
  }
}

/**
 * Chairs — deliberately lightweight placement markers (position + facing
 * rotation only, no seats/status of their own) that live around tables on
 * the floor plan.
 */
export class FloorPlanChairService {
  static async listForCompany(companyId: string) {
    return prisma.floorPlanChair.findMany({ where: { companyId }, orderBy: { createdAt: 'asc' } });
  }

  static async create(companyId: string, data: { positionX?: number; positionY?: number; rotation?: number }) {
    return prisma.floorPlanChair.create({
      data: {
        companyId,
        positionX: data.positionX ?? 40,
        positionY: data.positionY ?? 40,
        rotation: data.rotation ?? 0,
      },
    });
  }

  static async update(companyId: string, id: string, data: { positionX?: number; positionY?: number; rotation?: number }) {
    const existing = await prisma.floorPlanChair.findFirst({ where: { id, companyId } });
    if (!existing) throw notFound('Chair not found');
    return prisma.floorPlanChair.update({
      where: { id },
      data: {
        ...(data.positionX !== undefined ? { positionX: data.positionX } : {}),
        ...(data.positionY !== undefined ? { positionY: data.positionY } : {}),
        ...(data.rotation !== undefined ? { rotation: ((data.rotation % 360) + 360) % 360 } : {}),
      },
    });
  }

  static async remove(companyId: string, id: string) {
    const existing = await prisma.floorPlanChair.findFirst({ where: { id, companyId } });
    if (!existing) throw notFound('Chair not found');
    await prisma.floorPlanChair.delete({ where: { id } });
  }
}

/**
 * Bar stools — placed freely on the floor plan (no snapping to a table,
 * unlike FloorPlanChair) so the Bar module can show a seating chart of how
 * many bar seats there are and roughly where. Visual only, same reasoning
 * as FloorPlanChairService — no seat/status of its own.
 */
export class BarStoolService {
  static async listForCompany(companyId: string) {
    return prisma.barStool.findMany({ where: { companyId }, orderBy: { createdAt: 'asc' } });
  }

  /** Every stool, tagged with whatever open tab (if any) is sitting on it —
   * powers the Bar module's seating grid, mirroring the role
   * TableOrderService.listTablesWithStatus plays for Server Orders. */
  static async listStoolsWithStatus(companyId: string) {
    const [stools, openTabs] = await Promise.all([
      prisma.barStool.findMany({ where: { companyId }, orderBy: { createdAt: 'asc' } }),
      prisma.barTab.findMany({ where: { companyId, status: 'OPEN', stoolId: { not: null } } }),
    ]);

    const tabByStoolId = new Map(openTabs.map((t) => [t.stoolId as string, t]));
    const tabIds = openTabs.map((t) => t.id);
    const items = tabIds.length ? await prisma.barTabItem.findMany({ where: { tabId: { in: tabIds } } }) : [];
    const totalsByTabId = new Map<string, number>();
    const countsByTabId = new Map<string, number>();
    for (const item of items) {
      if (item.status === 'VOID') continue;
      totalsByTabId.set(item.tabId, (totalsByTabId.get(item.tabId) || 0) + parsePriceToNumber(item.price) * item.quantity);
      countsByTabId.set(item.tabId, (countsByTabId.get(item.tabId) || 0) + item.quantity);
    }

    return stools.map((stool) => {
      const tab = tabByStoolId.get(stool.id);
      return {
        id: stool.id,
        label: stool.label,
        active: tab ? {
          tabId: tab.id,
          itemCount: countsByTabId.get(tab.id) || 0,
          total: totalsByTabId.get(tab.id) || 0,
        } : null,
      };
    });
  }

  static async create(companyId: string, data: { positionX?: number; positionY?: number; rotation?: number }) {
    // Numbered off the current count, same pattern as RestaurantTable's
    // default "Table N" label — the count is computed server-side (not
    // trusted from the client) so two stools placed in quick succession
    // can't race into the same number.
    const count = await prisma.barStool.count({ where: { companyId } });
    return prisma.barStool.create({
      data: {
        companyId,
        label: `Stool ${count + 1}`,
        positionX: data.positionX ?? 40,
        positionY: data.positionY ?? 40,
        rotation: data.rotation ?? 0,
      },
    });
  }

  static async update(companyId: string, id: string, data: { label?: string; positionX?: number; positionY?: number; rotation?: number }) {
    const existing = await prisma.barStool.findFirst({ where: { id, companyId } });
    if (!existing) throw notFound('Stool not found');
    return prisma.barStool.update({
      where: { id },
      data: {
        ...(data.label !== undefined ? { label: data.label.trim() || existing.label } : {}),
        ...(data.positionX !== undefined ? { positionX: data.positionX } : {}),
        ...(data.positionY !== undefined ? { positionY: data.positionY } : {}),
        ...(data.rotation !== undefined ? { rotation: ((data.rotation % 360) + 360) % 360 } : {}),
      },
    });
  }

  static async remove(companyId: string, id: string) {
    const existing = await prisma.barStool.findFirst({ where: { id, companyId } });
    if (!existing) throw notFound('Stool not found');
    await prisma.barStool.delete({ where: { id } });
  }
}

// A reservation "occupies" its table for this long — a second booking on the
// same table can't start within this window of an existing one. Keeps the
// conflict check simple (no need to know actual turn time per party size)
// while still preventing obviously overlapping bookings.
const RESERVATION_BUFFER_MINUTES = 90;

export class TableReservationService {
  /** Upcoming, still-confirmed bookings for one table — used by the public
   * profile to grey out already-taken time slots. */
  static async listUpcomingForTable(tableId: string, companyId: string) {
    return prisma.tableReservation.findMany({
      where: { tableId, companyId, status: 'CONFIRMED', reservationTime: { gte: new Date() } },
      orderBy: { reservationTime: 'asc' },
      select: { id: true, reservationTime: true, partySize: true },
    });
  }

  /** A user's own upcoming reservations at this company, for the "My
   * Reservations" list — includes table label so it's readable without a
   * second lookup. */
  static async listUpcomingForUser(userId: string, companyId: string) {
    return prisma.tableReservation.findMany({
      where: { userId, companyId, status: 'CONFIRMED', reservationTime: { gte: new Date() } },
      orderBy: { reservationTime: 'asc' },
      include: { table: { select: { label: true } } },
    });
  }

  static async create(
    userId: string,
    companyId: string,
    tableId: string,
    data: { reservationTime: string | Date; partySize?: number; note?: string; autoCheckIn?: boolean },
    // The company the booking user's account belongs to, if any — a
    // restaurant can't book its own tables. Trusted server-side (from the
    // JWT via the route), not the request body.
    bookerCompanyId?: string | null,
  ) {
    if (bookerCompanyId && bookerCompanyId === companyId) {
      throw conflict('A company cannot reserve its own tables');
    }
    const table = await prisma.restaurantTable.findFirst({ where: { id: tableId, companyId } });
    if (!table) throw notFound('Table not found');

    // Checked before the reservation is created, not after, so a request
    // that asks for auto-check-in but isn't eligible fails loudly instead
    // of silently booking the table without it.
    if (data.autoCheckIn) {
      const eligibility = await AutoCheckInService.getEligibility(userId);
      if (!eligibility.eligible) throw conflict('Not eligible for automatic check-in yet');
    }

    const reservationTime = new Date(data.reservationTime);
    if (Number.isNaN(reservationTime.getTime())) throw conflict('Invalid reservation time');
    if (reservationTime.getTime() < Date.now()) throw conflict('Reservation time must be in the future');

    const bufferMs = RESERVATION_BUFFER_MINUTES * 60 * 1000;
    const windowStart = new Date(reservationTime.getTime() - bufferMs);
    const windowEnd = new Date(reservationTime.getTime() + bufferMs);
    const clashing = await prisma.tableReservation.findFirst({
      where: {
        tableId,
        status: 'CONFIRMED',
        reservationTime: { gte: windowStart, lte: windowEnd },
      },
    });
    if (clashing) throw conflict('That time is no longer available for this table');

    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });

    const reservation = await prisma.tableReservation.create({
      data: {
        tableId,
        companyId,
        userId,
        reservationTime,
        partySize: Math.max(1, Math.min(20, Math.round(data.partySize ?? 2))),
        note: data.note?.slice(0, 300),
        autoCheckInEnabled: !!data.autoCheckIn,
      },
    });

    // The booker's confirmation lives in their own notifications + Work
    // Suite calendar, not on the restaurant's public profile — so it's
    // theirs to track alongside everything else they've booked, not
    // something anyone browsing the profile can see.
    const companyName = company?.name || 'the restaurant';
    const whenLabel = reservationTime.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

    const endTime = new Date(reservationTime.getTime() + RESERVATION_BUFFER_MINUTES * 60 * 1000);
    const calendarEvent = await CalendarEventService.create(userId, {
      title: `Reservation at ${companyName}`,
      description: reservation.note || undefined,
      startDate: reservationTime.toISOString(),
      allDay: false,
      startTime: reservationTime.toTimeString().slice(0, 5),
      endTime: endTime.toTimeString().slice(0, 5),
      tableReservationId: reservation.id,
    });

    // Deep-links straight to this event on the calendar rather than just the
    // calendar page in general, so clicking the notification lands exactly
    // where the booking lives instead of leaving the user to hunt for it.
    await NotificationService.create(userId, {
      type: 'TABLE_RESERVATION',
      title: `Reservation confirmed at ${companyName}`,
      body: `Table for ${reservation.partySize} on ${whenLabel}.`,
      actionRoute: `/work-suite/calendar?event=${calendarEvent.id}`,
    });

    return reservation;
  }

  /** Started by a server from the floor plan for a guest who just sat down
   * without booking ahead — no account to attach, so userId stays null and
   * whatever name/phone the server jots down (both optional) goes on
   * walkInName/walkInPhone instead. reservationTime is "now" so it's
   * immediately inside TableOrderService's active-order window. */
  static async startWalkIn(companyId: string, tableId: string, data: { partySize?: number; guestName?: string; guestPhone?: string }) {
    const table = await prisma.restaurantTable.findFirst({ where: { id: tableId, companyId } });
    if (!table) throw notFound('Table not found');

    const existing = await TableOrderService.findActiveReservationForTable(companyId, tableId);
    if (existing) throw conflict('This table already has an active order — open it instead of starting a new one');

    return prisma.tableReservation.create({
      data: {
        tableId,
        companyId,
        reservationTime: new Date(),
        partySize: Math.max(1, Math.min(20, Math.round(data.partySize ?? 2))),
        walkInName: data.guestName?.trim().slice(0, 100) || null,
        walkInPhone: data.guestPhone?.trim().slice(0, 30) || null,
      },
    });
  }

  static async cancel(userId: string, id: string) {
    const existing = await prisma.tableReservation.findFirst({ where: { id, userId } });
    if (!existing) throw notFound('Reservation not found');
    return prisma.tableReservation.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  static async getForUser(userId: string, id: string) {
    const reservation = await prisma.tableReservation.findFirst({
      where: { id, userId },
      include: { table: { select: { label: true, seats: true } }, company: { select: { name: true } } },
    });
    if (!reservation) throw notFound('Reservation not found');
    return reservation;
  }

  /** Every reservation at this company, for the restaurant's own
   * Reservations module — unlike the public/booker-facing methods above,
   * this is the company's own data about its own bookings, so it includes
   * the guest's confirmed legal name, phone, and any notes (e.g. an
   * allergy) from their Check-In Profile. Most recent/upcoming first. */
  static async listForCompany(companyId: string) {
    const reservations = await prisma.tableReservation.findMany({
      where: { companyId },
      orderBy: { reservationTime: 'desc' },
      include: { table: { select: { label: true, seats: true } } },
    });

    const userIds = [...new Set(reservations.map((r) => r.userId).filter((id): id is string => !!id))];
    const [users, checkInProfiles] = await Promise.all([
      prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, firstName: true, lastName: true, email: true } }),
      prisma.checkInProfile.findMany({ where: { userId: { in: userIds } } }),
    ]);
    const userById = new Map(users.map((u) => [u.id, u]));
    const checkInByUserId = new Map(checkInProfiles.map((p) => [p.userId, p]));

    // Only reservations with Automatic Check-In on need the ID-style photo
    // shown — that's specifically what it's for (staff recognizing someone
    // who's about to be checked in without anyone at the door doing
    // anything), not a general guest directory. Signed URLs are minted
    // fresh here rather than stored, same pattern as every other private
    // file in this app.
    const photoUrlByUserId = new Map<string, string>();
    if (supabaseAdmin) {
      const needsPhoto = reservations.filter((r) => r.autoCheckInEnabled && r.userId);
      await Promise.all(
        needsPhoto.map(async (r) => {
          const key = checkInByUserId.get(r.userId!)?.photoStorageKey;
          if (!key || photoUrlByUserId.has(r.userId!)) return;
          const { data } = await supabaseAdmin!.storage.from(FILES_BUCKET).createSignedUrl(key, 900);
          if (data?.signedUrl) photoUrlByUserId.set(r.userId!, data.signedUrl);
        })
      );
    }

    // Whatever the guest has ordered from the table-side QR page shows up
    // here too — one query for every reservation's items rather than N+1.
    const reservationIds = reservations.map((r) => r.id);
    const orderItems = await prisma.tableOrderItem.findMany({ where: { reservationId: { in: reservationIds } }, orderBy: { createdAt: 'asc' } });
    const orderItemsByReservationId = new Map<string, typeof orderItems>();
    for (const item of orderItems) {
      const list = orderItemsByReservationId.get(item.reservationId) || [];
      list.push(item);
      orderItemsByReservationId.set(item.reservationId, list);
    }

    return reservations.map((r) => {
      const user = r.userId ? userById.get(r.userId) : undefined;
      const checkIn = r.userId ? checkInByUserId.get(r.userId) : undefined;
      const guestName = checkIn?.legalFirstName && checkIn?.legalLastName
        ? `${checkIn.legalFirstName} ${checkIn.legalLastName}`
        : user ? `${user.firstName} ${user.lastName}` : r.walkInName || 'Walk-in Guest';
      const items = orderItemsByReservationId.get(r.id) || [];
      return {
        ...r,
        guestName,
        guestPhone: checkIn?.phone || r.walkInPhone || null,
        guestEmail: checkIn?.email || user?.email || null,
        guestNotes: checkIn?.notes || null,
        guestPhotoUrl: r.autoCheckInEnabled && r.userId ? photoUrlByUserId.get(r.userId) || null : null,
        isWalkIn: !r.userId,
        orderItems: items,
        orderTotal: sumBillableItems(items),
      };
    });
  }

  /** Guest-arrival lookup for the host stand — either an NFC tap (token
   * read off a physical card via Web NFC) or the manual phone fallback for
   * devices that can't do NFC. Always includes the photo when one exists,
   * regardless of whether this particular reservation has Automatic
   * Check-In on — showing it is the whole point of this flow (staff
   * visually confirming the person before tapping Check In), not
   * something to gate behind that toggle here. Scoped to this company and
   * a same-day arrival window so a token/phone match at the wrong
   * restaurant or the wrong day never surfaces someone else's booking. */
  static async lookupArrival(companyId: string, params: { nfcToken?: string; phone?: string }): Promise<any | null> {
    let checkInProfile = null;
    if (params.nfcToken) {
      checkInProfile = await prisma.checkInProfile.findUnique({ where: { nfcToken: params.nfcToken } });
    } else if (params.phone) {
      checkInProfile = await prisma.checkInProfile.findFirst({ where: { phone: params.phone } });
    }
    if (!checkInProfile) return null;

    const windowMs = 3 * 60 * 60 * 1000;
    const now = new Date();
    const reservation = await prisma.tableReservation.findFirst({
      where: {
        companyId,
        userId: checkInProfile.userId,
        status: 'CONFIRMED',
        checkedInAt: null,
        reservationTime: { gte: new Date(now.getTime() - windowMs), lte: new Date(now.getTime() + windowMs) },
      },
      orderBy: { reservationTime: 'asc' },
      include: { table: { select: { label: true, seats: true } } },
    });
    if (!reservation) return null;

    const user = await prisma.user.findUnique({ where: { id: checkInProfile.userId }, select: { firstName: true, lastName: true, email: true } });
    const guestName = checkInProfile.legalFirstName && checkInProfile.legalLastName
      ? `${checkInProfile.legalFirstName} ${checkInProfile.legalLastName}`
      : user ? `${user.firstName} ${user.lastName}` : 'Guest';
    const guestPhotoUrl = await CheckInProfileService.getPhotoUrl(checkInProfile.photoStorageKey);

    return {
      ...reservation,
      guestName,
      guestPhone: checkInProfile.phone || null,
      guestEmail: checkInProfile.email || user?.email || null,
      guestNotes: checkInProfile.notes || null,
      guestPhotoUrl,
    };
  }

  /** Staff manually marking a reservation as arrived — the counterpart to
   * AutoCheckInService's automatic sweep, for guests who didn't opt into
   * (or don't qualify for) Automatic Check-In. */
  static async checkInByStaff(companyId: string, id: string) {
    const reservation = await prisma.tableReservation.findFirst({ where: { id, companyId } });
    if (!reservation) throw notFound('Reservation not found');
    if (reservation.checkedInAt) throw conflict('Already checked in');

    const [updated] = await prisma.$transaction([
      prisma.tableReservation.update({ where: { id }, data: { checkedInAt: new Date() } }),
      prisma.restaurantTable.update({ where: { id: reservation.tableId }, data: { status: 'OCCUPIED' } }),
    ]);
    return updated;
  }

  /** Staff manually cancelling a booking — a guest who called to cancel, a
   * no-show being cleared off the list, etc. Once someone's actually
   * checked in they're being served, not "cancelled" — that's a different
   * flow (closing out their table), so this refuses rather than leaving the
   * floor plan/table state inconsistent with a cancelled-but-seated
   * reservation. */
  static async cancelByStaff(companyId: string, id: string) {
    const reservation = await prisma.tableReservation.findFirst({ where: { id, companyId } });
    if (!reservation) throw notFound('Reservation not found');
    if (reservation.checkedInAt) throw conflict('This guest has already checked in — cancel their table instead');
    if (reservation.status === 'CANCELLED') throw conflict('Already cancelled');

    const updated = await prisma.tableReservation.update({ where: { id }, data: { status: 'CANCELLED' } });

    // Walk-ins have no account to notify. Booked reservations do — the
    // restaurant cancelling on the guest is worth telling them about,
    // unlike their own self-cancel (where they obviously already know).
    if (reservation.userId) {
      const company = await prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });
      await NotificationService.create(reservation.userId, {
        type: 'TABLE_RESERVATION',
        title: `Reservation cancelled at ${company?.name || 'the restaurant'}`,
        body: `Your reservation for ${new Date(reservation.reservationTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} was cancelled by the restaurant.`,
      });
    }

    return updated;
  }
}

// Automatic Check-In — an opt-in convenience on a table reservation that,
// once eligible, needs no staff or user action at arrival time. Gated on
// three real signals rather than a simple toggle: a filled-out profile (this
// is really you, not an empty shell account), a SILVER+ membership tier
// (it's a paid-tier perk), and a bank account Plaid Identity has confirmed
// belongs to this user (real financial identity, not just "some account got
// linked") — see PlaidService.verifyBankAccount.
const AUTO_CHECK_IN_MIN_TIER: MemberTier = 'SILVER';

export type AutoCheckInBlockingStep = 'TIER' | 'PROFILE' | 'BANK' | null;

export interface AutoCheckInEligibility {
  eligible: boolean;
  profileComplete: boolean;
  tierOk: boolean;
  bankVerified: boolean;
  // Three hard, sequential gates — tier, then profile, then bank. Each only
  // matters once the one before it has passed, so this names whichever gate
  // is currently blocking (the first false one, in that order), letting the
  // UI ask for one thing at a time instead of dumping a full checklist.
  nextStep: AutoCheckInBlockingStep;
}

/** A tiny, purpose-built profile (see CheckInProfile in schema.prisma) —
 * legal name, phone, email, and an ID-style photo, nothing marketing-
 * oriented like a banner photo or website. "Complete" means all five of
 * those are filled in — the photo specifically so restaurant staff can
 * actually recognize who they're looking for when Automatic Check-In
 * fires. `notes` (e.g. a dietary restriction/allergy restaurant staff
 * should know about) is deliberately excluded from completeness — it's
 * optional disclosure, not something to gate a feature on. */
export class CheckInProfileService {
  static async get(userId: string) {
    return prisma.checkInProfile.findUnique({ where: { userId } });
  }

  static async upsert(userId: string, data: { legalFirstName?: string; legalLastName?: string; phone?: string; email?: string; notes?: string; photoStorageKey?: string; nfcToken?: string }) {
    return prisma.checkInProfile.upsert({
      where: { userId },
      create: { userId, legalFirstName: data.legalFirstName, legalLastName: data.legalLastName, phone: data.phone, email: data.email, notes: data.notes, photoStorageKey: data.photoStorageKey, nfcToken: data.nfcToken },
      update: { legalFirstName: data.legalFirstName, legalLastName: data.legalLastName, phone: data.phone, email: data.email, notes: data.notes, photoStorageKey: data.photoStorageKey, nfcToken: data.nfcToken },
    });
  }

  /** Signed URL for the current photo, if any — minted fresh, not stored,
   * same as every other private file in this app. */
  static async getPhotoUrl(photoStorageKey: string | null | undefined): Promise<string | null> {
    if (!photoStorageKey || !supabaseAdmin) return null;
    const { data } = await supabaseAdmin.storage.from(FILES_BUCKET).createSignedUrl(photoStorageKey, 900);
    return data?.signedUrl || null;
  }

  static isComplete(profile: { legalFirstName: string | null; legalLastName: string | null; phone: string | null; email: string | null; photoStorageKey: string | null } | null): boolean {
    return !!(profile && profile.legalFirstName?.trim() && profile.legalLastName?.trim() && profile.phone?.trim() && profile.email?.trim() && profile.photoStorageKey);
  }

  /** New random token for a physical NFC card — the frontend writes this
   * onto a tapped tag via Web NFC. Overwrites any previous token, so
   * writing a new/replacement card invalidates the old one automatically. */
  static async generateNfcToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(24).toString('hex');
    await this.upsert(userId, { nfcToken: token });
    return token;
  }
}

export class AutoCheckInService {
  static async getEligibility(userId: string): Promise<AutoCheckInEligibility> {
    const [user, checkInProfile, verifiedBankAccount] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { memberTier: true } }),
      prisma.checkInProfile.findUnique({ where: { userId } }),
      prisma.bankAccount.findFirst({ where: { verificationStatus: 'VERIFIED', connection: { userId } } }),
    ]);

    const tierOk = TIER_RANK[(user.memberTier as MemberTier) || 'BASIC'] >= TIER_RANK[AUTO_CHECK_IN_MIN_TIER];
    const profileComplete = CheckInProfileService.isComplete(checkInProfile);
    const bankVerified = !!verifiedBankAccount;

    const nextStep: AutoCheckInBlockingStep = !tierOk ? 'TIER' : !profileComplete ? 'PROFILE' : !bankVerified ? 'BANK' : null;

    return { eligible: tierOk && profileComplete && bankVerified, profileComplete, tierOk, bankVerified, nextStep };
  }

  static async setEnabled(userId: string, reservationId: string, enabled: boolean) {
    const reservation = await prisma.tableReservation.findFirst({ where: { id: reservationId, userId } });
    if (!reservation) throw notFound('Reservation not found');

    if (enabled) {
      const eligibility = await this.getEligibility(userId);
      if (!eligibility.eligible) throw conflict('Not eligible for automatic check-in yet');
    }

    return prisma.tableReservation.update({ where: { id: reservationId }, data: { autoCheckInEnabled: enabled } });
  }

  /** Runs on an interval (see index.ts) — flips any due, opted-in
   * reservation to checked-in on its own once its time arrives, updates the
   * table to OCCUPIED, and lets the user know it happened. */
  static async processDueCheckIns(): Promise<void> {
    const due = await prisma.tableReservation.findMany({
      where: { autoCheckInEnabled: true, checkedInAt: null, status: 'CONFIRMED', reservationTime: { lte: new Date() } },
      include: { company: { select: { name: true } }, table: { select: { label: true } } },
    });

    for (const reservation of due) {
      try {
        const checkInProfile = await prisma.checkInProfile.findUnique({ where: { userId: reservation.userId } });

        await prisma.$transaction([
          prisma.tableReservation.update({ where: { id: reservation.id }, data: { checkedInAt: new Date() } }),
          prisma.restaurantTable.update({ where: { id: reservation.tableId }, data: { status: 'OCCUPIED' } }),
        ]);
        await NotificationService.create(reservation.userId, {
          type: 'AUTO_CHECK_IN',
          title: `Checked in automatically at ${reservation.company.name}`,
          body: `Your table for ${reservation.partySize} is ready.`,
        });

        // Restaurant staff need to actually see this — an allergy note that
        // only ever lived in the diner's own profile would be pointless.
        // Every account at the company gets it, same as any other
        // day-of-arrival heads-up.
        const guestName = checkInProfile?.legalFirstName && checkInProfile?.legalLastName
          ? `${checkInProfile.legalFirstName} ${checkInProfile.legalLastName}`
          : 'A guest';
        const staff = await prisma.user.findMany({ where: { companyId: reservation.companyId }, select: { id: true } });
        const staffBody = [
          `${guestName} — party of ${reservation.partySize}, table ${reservation.table.label}.`,
          checkInProfile?.phone ? `Phone: ${checkInProfile.phone}.` : null,
          checkInProfile?.notes?.trim() ? `Note: ${checkInProfile.notes.trim()}` : null,
        ].filter(Boolean).join(' ');
        await Promise.all(staff.map((s) =>
          NotificationService.create(s.id, {
            type: 'AUTO_CHECK_IN_ARRIVAL',
            title: 'Guest checked in automatically',
            body: staffBody,
          })
        ));
      } catch (err) {
        console.error(`[AutoCheckIn] Failed to process reservation ${reservation.id}:`, err);
      }
    }
  }
}

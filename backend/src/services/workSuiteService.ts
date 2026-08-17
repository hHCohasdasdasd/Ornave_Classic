import { PrismaClient } from '@prisma/client';
import { supabaseAdmin, FILES_BUCKET } from '../utils/supabaseStorage';

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

import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponseHandler } from '../utils/apiResponse';
import { ProjectService, TaskService, GoalService, AchievementService, NoteService, FileService, FolderService, WorkSuiteService, FocusService, JobApplicationService, WorkProfileService, CalendarEventService, FinanceEntryService } from '../services/workSuiteService';
import { FILES_BUCKET, requireSupabaseAdmin } from '../utils/supabaseStorage';
import { createFileUpload } from '../utils/uploadConfig';

const upload = createFileUpload();

export const workSuiteRoutes = Router();

workSuiteRoutes.use(authMiddleware);

/**
 * Summary (hub stat cards)
 */
workSuiteRoutes.get(
  '/summary',
  asyncHandler(async (req: any, res: Response) => {
    const summary = await WorkSuiteService.getSummary(req.user.userId);
    return ApiResponseHandler.success(res, summary, 'Summary retrieved successfully', 200);
  })
);

/**
 * Focus timer — prefs (work/break minutes) and completed-session log.
 */
workSuiteRoutes.get(
  '/focus/prefs',
  asyncHandler(async (req: any, res: Response) => {
    const prefs = await FocusService.getPrefs(req.user.userId);
    return ApiResponseHandler.success(res, prefs, 'Focus prefs retrieved successfully', 200);
  })
);

workSuiteRoutes.put(
  '/focus/prefs',
  asyncHandler(async (req: any, res: Response) => {
    const { workMinutes, breakMinutes } = req.body;
    const prefs = await FocusService.updatePrefs(req.user.userId, { workMinutes, breakMinutes });
    return ApiResponseHandler.success(res, prefs, 'Focus prefs updated successfully', 200);
  })
);

workSuiteRoutes.get(
  '/focus/sessions/today-count',
  asyncHandler(async (req: any, res: Response) => {
    const count = await FocusService.getTodaySessionCount(req.user.userId);
    return ApiResponseHandler.success(res, { count }, 'Today\'s session count retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/focus/sessions',
  asyncHandler(async (req: any, res: Response) => {
    const { workMinutes, breakMinutes } = req.body;
    if (workMinutes === undefined || breakMinutes === undefined) {
      return ApiResponseHandler.error(res, 'workMinutes and breakMinutes are required', undefined, 400);
    }
    const session = await FocusService.logSession(req.user.userId, Number(workMinutes), Number(breakMinutes));
    return ApiResponseHandler.success(res, session, 'Focus session logged successfully', 201);
  })
);

/**
 * Assistant insights (hub briefing)
 */
workSuiteRoutes.get(
  '/insights',
  asyncHandler(async (req: any, res: Response) => {
    const insights = await WorkSuiteService.getInsights(req.user.userId);
    return ApiResponseHandler.success(res, insights, 'Insights retrieved successfully', 200);
  })
);

/**
 * Projects
 */
workSuiteRoutes.get(
  '/projects',
  asyncHandler(async (req: any, res: Response) => {
    const projects = await ProjectService.list(req.user.userId);
    return ApiResponseHandler.success(res, projects, 'Projects retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/projects',
  asyncHandler(async (req: any, res: Response) => {
    const { name, description } = req.body;
    if (!name) return ApiResponseHandler.error(res, 'Project name is required', undefined, 400);
    const project = await ProjectService.create(req.user.userId, { name, description });
    return ApiResponseHandler.success(res, project, 'Project created successfully', 201);
  })
);

workSuiteRoutes.get(
  '/projects/:id',
  asyncHandler(async (req: any, res: Response) => {
    const project = await ProjectService.getById(req.user.userId, req.params.id);
    return ApiResponseHandler.success(res, project, 'Project retrieved successfully', 200);
  })
);

workSuiteRoutes.put(
  '/projects/:id',
  asyncHandler(async (req: any, res: Response) => {
    const { name, description, status } = req.body;
    const project = await ProjectService.update(req.user.userId, req.params.id, { name, description, status });
    return ApiResponseHandler.success(res, project, 'Project updated successfully', 200);
  })
);

workSuiteRoutes.delete(
  '/projects/:id',
  asyncHandler(async (req: any, res: Response) => {
    await ProjectService.remove(req.user.userId, req.params.id);
    return ApiResponseHandler.success(res, {}, 'Project deleted successfully', 200);
  })
);

/**
 * Tasks
 */
workSuiteRoutes.get(
  '/tasks',
  asyncHandler(async (req: any, res: Response) => {
    const tasks = await TaskService.list(req.user.userId, req.query.projectId as string | undefined);
    return ApiResponseHandler.success(res, tasks, 'Tasks retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/tasks',
  asyncHandler(async (req: any, res: Response) => {
    const { title, description, priority, projectId, dueDate } = req.body;
    if (!title) return ApiResponseHandler.error(res, 'Task title is required', undefined, 400);
    const task = await TaskService.create(req.user.userId, { title, description, priority, projectId, dueDate });
    return ApiResponseHandler.success(res, task, 'Task created successfully', 201);
  })
);

workSuiteRoutes.put(
  '/tasks/:id',
  asyncHandler(async (req: any, res: Response) => {
    const { title, description, priority, projectId, dueDate } = req.body;
    const task = await TaskService.update(req.user.userId, req.params.id, { title, description, priority, projectId, dueDate });
    return ApiResponseHandler.success(res, task, 'Task updated successfully', 200);
  })
);

workSuiteRoutes.patch(
  '/tasks/:id/status',
  asyncHandler(async (req: any, res: Response) => {
    const { status } = req.body;
    if (!status) return ApiResponseHandler.error(res, 'Status is required', undefined, 400);
    const task = await TaskService.updateStatus(req.user.userId, req.params.id, status);
    return ApiResponseHandler.success(res, task, 'Task status updated successfully', 200);
  })
);

workSuiteRoutes.delete(
  '/tasks/:id',
  asyncHandler(async (req: any, res: Response) => {
    await TaskService.remove(req.user.userId, req.params.id);
    return ApiResponseHandler.success(res, {}, 'Task deleted successfully', 200);
  })
);

/**
 * Goals
 */
workSuiteRoutes.get(
  '/goals',
  asyncHandler(async (req: any, res: Response) => {
    const goals = await GoalService.list(req.user.userId);
    return ApiResponseHandler.success(res, goals, 'Goals retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/goals',
  asyncHandler(async (req: any, res: Response) => {
    const { title, description, category, targetDate } = req.body;
    if (!title) return ApiResponseHandler.error(res, 'Goal title is required', undefined, 400);
    const goal = await GoalService.create(req.user.userId, { title, description, category, targetDate });
    return ApiResponseHandler.success(res, goal, 'Goal created successfully', 201);
  })
);

workSuiteRoutes.put(
  '/goals/:id',
  asyncHandler(async (req: any, res: Response) => {
    const { title, description, category, status, progress, targetDate } = req.body;
    const goal = await GoalService.update(req.user.userId, req.params.id, { title, description, category, status, progress, targetDate });
    return ApiResponseHandler.success(res, goal, 'Goal updated successfully', 200);
  })
);

workSuiteRoutes.patch(
  '/goals/:id/progress',
  asyncHandler(async (req: any, res: Response) => {
    const { progress } = req.body;
    if (progress === undefined) return ApiResponseHandler.error(res, 'Progress is required', undefined, 400);
    const goal = await GoalService.updateProgress(req.user.userId, req.params.id, Number(progress));
    return ApiResponseHandler.success(res, goal, 'Goal progress updated successfully', 200);
  })
);

workSuiteRoutes.delete(
  '/goals/:id',
  asyncHandler(async (req: any, res: Response) => {
    await GoalService.remove(req.user.userId, req.params.id);
    return ApiResponseHandler.success(res, {}, 'Goal deleted successfully', 200);
  })
);

/**
 * Job Applications — a personal application tracker (the Jobs tab).
 */
workSuiteRoutes.get(
  '/job-applications',
  asyncHandler(async (req: any, res: Response) => {
    const applications = await JobApplicationService.list(req.user.userId);
    return ApiResponseHandler.success(res, applications, 'Job applications retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/job-applications',
  asyncHandler(async (req: any, res: Response) => {
    const { company, role, url, notes, appliedDate } = req.body;
    if (!company || !role) return ApiResponseHandler.error(res, 'Company and role are required', undefined, 400);
    const application = await JobApplicationService.create(req.user.userId, { company, role, url, notes, appliedDate });
    return ApiResponseHandler.success(res, application, 'Job application created successfully', 201);
  })
);

workSuiteRoutes.put(
  '/job-applications/:id',
  asyncHandler(async (req: any, res: Response) => {
    const { company, role, status, url, notes, appliedDate } = req.body;
    const application = await JobApplicationService.update(req.user.userId, req.params.id, { company, role, status, url, notes, appliedDate });
    return ApiResponseHandler.success(res, application, 'Job application updated successfully', 200);
  })
);

workSuiteRoutes.patch(
  '/job-applications/:id/status',
  asyncHandler(async (req: any, res: Response) => {
    const { status } = req.body;
    if (!status) return ApiResponseHandler.error(res, 'Status is required', undefined, 400);
    const application = await JobApplicationService.updateStatus(req.user.userId, req.params.id, status);
    return ApiResponseHandler.success(res, application, 'Job application status updated successfully', 200);
  })
);

workSuiteRoutes.delete(
  '/job-applications/:id',
  asyncHandler(async (req: any, res: Response) => {
    await JobApplicationService.remove(req.user.userId, req.params.id);
    return ApiResponseHandler.success(res, {}, 'Job application deleted successfully', 200);
  })
);

/**
 * Calendar Events — personal single/full/multi-day entries on the Calendar page.
 */
workSuiteRoutes.get(
  '/calendar-events',
  asyncHandler(async (req: any, res: Response) => {
    const events = await CalendarEventService.list(req.user.userId);
    return ApiResponseHandler.success(res, events, 'Calendar events retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/calendar-events',
  asyncHandler(async (req: any, res: Response) => {
    const { title, description, startDate, endDate, allDay, startTime, endTime } = req.body;
    if (!title || !startDate) return ApiResponseHandler.error(res, 'Title and start date are required', undefined, 400);
    const event = await CalendarEventService.create(req.user.userId, { title, description, startDate, endDate, allDay, startTime, endTime });
    return ApiResponseHandler.success(res, event, 'Calendar event created successfully', 201);
  })
);

workSuiteRoutes.put(
  '/calendar-events/:id',
  asyncHandler(async (req: any, res: Response) => {
    const { title, description, startDate, endDate, allDay, startTime, endTime } = req.body;
    const event = await CalendarEventService.update(req.user.userId, req.params.id, { title, description, startDate, endDate, allDay, startTime, endTime });
    return ApiResponseHandler.success(res, event, 'Calendar event updated successfully', 200);
  })
);

workSuiteRoutes.delete(
  '/calendar-events/:id',
  asyncHandler(async (req: any, res: Response) => {
    await CalendarEventService.remove(req.user.userId, req.params.id);
    return ApiResponseHandler.success(res, {}, 'Calendar event deleted successfully', 200);
  })
);

/**
 * Finance — a personal income/expense tracker (Finance page). Distinct from
 * a company's real Billing/Transactions, which stay untouched here.
 */
workSuiteRoutes.get(
  '/finance-entries',
  asyncHandler(async (req: any, res: Response) => {
    const entries = await FinanceEntryService.list(req.user.userId);
    return ApiResponseHandler.success(res, entries, 'Finance entries retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/finance-entries',
  asyncHandler(async (req: any, res: Response) => {
    const { type, amount, description, category, status, date, notes } = req.body;
    if (!type || amount === undefined || !description || !date) {
      return ApiResponseHandler.error(res, 'Type, amount, description, and date are required', undefined, 400);
    }
    const entry = await FinanceEntryService.create(req.user.userId, { type, amount: Number(amount), description, category, status, date, notes });
    return ApiResponseHandler.success(res, entry, 'Finance entry created successfully', 201);
  })
);

workSuiteRoutes.put(
  '/finance-entries/:id',
  asyncHandler(async (req: any, res: Response) => {
    const { type, amount, description, category, status, date, notes } = req.body;
    const entry = await FinanceEntryService.update(req.user.userId, req.params.id, {
      type,
      amount: amount === undefined ? undefined : Number(amount),
      description,
      category,
      status,
      date,
      notes,
    });
    return ApiResponseHandler.success(res, entry, 'Finance entry updated successfully', 200);
  })
);

workSuiteRoutes.delete(
  '/finance-entries/:id',
  asyncHandler(async (req: any, res: Response) => {
    await FinanceEntryService.remove(req.user.userId, req.params.id);
    return ApiResponseHandler.success(res, {}, 'Finance entry deleted successfully', 200);
  })
);

/**
 * Work Profile — a private CV used only for job applications (Jobs page).
 */
workSuiteRoutes.get(
  '/work-profile',
  asyncHandler(async (req: any, res: Response) => {
    const profile = await WorkProfileService.get(req.user.userId);
    return ApiResponseHandler.success(res, profile, 'Work profile retrieved successfully', 200);
  })
);

workSuiteRoutes.put(
  '/work-profile',
  asyncHandler(async (req: any, res: Response) => {
    const { headline, summary, experience, education, skills } = req.body;
    const profile = await WorkProfileService.upsert(req.user.userId, { headline, summary, experience, education, skills });
    return ApiResponseHandler.success(res, profile, 'Work profile updated successfully', 200);
  })
);

/**
 * CV & Documents — files scoped to category CV_DOCUMENT, kept out of the
 * general Files list. Download/delete reuse the generic /files/:id routes
 * below, since those already scope by id + userId regardless of category.
 */
workSuiteRoutes.get(
  '/cv-documents',
  asyncHandler(async (req: any, res: Response) => {
    const files = await FileService.listByCategory(req.user.userId, 'CV_DOCUMENT');
    return ApiResponseHandler.success(res, files, 'CV documents retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/cv-documents',
  upload.single('file'),
  asyncHandler(async (req: any, res: Response) => {
    if (!req.file) return ApiResponseHandler.error(res, 'No file provided', undefined, 400);

    const supabase = requireSupabaseAdmin();
    const safeName = req.file.originalname.replace(/[^\w.\-() ]/g, '_');
    const storageKey = `${req.user.userId}/${uuidv4()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(FILES_BUCKET)
      .upload(storageKey, req.file.buffer, { contentType: req.file.mimetype });
    if (uploadError) {
      return ApiResponseHandler.error(res, 'Failed to upload file', uploadError.message, 502);
    }

    const file = await FileService.create({
      userId: req.user.userId,
      category: 'CV_DOCUMENT',
      name: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      storageKey,
    });
    return ApiResponseHandler.success(res, file, 'Document uploaded successfully', 201);
  })
);

/**
 * Achievements
 */
workSuiteRoutes.get(
  '/achievements',
  asyncHandler(async (req: any, res: Response) => {
    const achievements = await AchievementService.list(req.user.userId);
    return ApiResponseHandler.success(res, achievements, 'Achievements retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/achievements',
  asyncHandler(async (req: any, res: Response) => {
    const { title, description, category, achievedAt } = req.body;
    if (!title) return ApiResponseHandler.error(res, 'Achievement title is required', undefined, 400);
    const achievement = await AchievementService.create(req.user.userId, { title, description, category, achievedAt });
    return ApiResponseHandler.success(res, achievement, 'Achievement logged successfully', 201);
  })
);

workSuiteRoutes.delete(
  '/achievements/:id',
  asyncHandler(async (req: any, res: Response) => {
    await AchievementService.remove(req.user.userId, req.params.id);
    return ApiResponseHandler.success(res, {}, 'Achievement deleted successfully', 200);
  })
);

/**
 * Notes
 */
workSuiteRoutes.get(
  '/notes',
  asyncHandler(async (req: any, res: Response) => {
    const notes = await NoteService.list(req.user.userId);
    return ApiResponseHandler.success(res, notes, 'Notes retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/notes',
  asyncHandler(async (req: any, res: Response) => {
    const { type, title, content, color, shape, fontSize, posX, posY, parentId } = req.body;
    if (!content?.trim()) return ApiResponseHandler.error(res, 'Note content is required', undefined, 400);
    if (type && !['NOTE', 'STICKY', 'MINDMAP'].includes(type)) {
      return ApiResponseHandler.error(res, 'Invalid note type', undefined, 400);
    }
    try {
      const note = await NoteService.create(req.user.userId, {
        type,
        title,
        content,
        color,
        shape,
        fontSize,
        posX: posX === undefined ? undefined : Number(posX),
        posY: posY === undefined ? undefined : Number(posY),
        parentId,
      });
      return ApiResponseHandler.success(res, note, 'Note created successfully', 201);
    } catch {
      return ApiResponseHandler.error(res, 'Parent note not found', undefined, 404);
    }
  })
);

workSuiteRoutes.put(
  '/notes/:id',
  asyncHandler(async (req: any, res: Response) => {
    const { title, content, pinned, color, shape, fontSize, posX, posY } = req.body;
    const note = await NoteService.update(req.user.userId, req.params.id, {
      title,
      content,
      pinned,
      color,
      shape,
      fontSize,
      posX: posX === undefined ? undefined : Number(posX),
      posY: posY === undefined ? undefined : Number(posY),
    });
    return ApiResponseHandler.success(res, note, 'Note updated successfully', 200);
  })
);

workSuiteRoutes.delete(
  '/notes/:id',
  asyncHandler(async (req: any, res: Response) => {
    await NoteService.remove(req.user.userId, req.params.id);
    return ApiResponseHandler.success(res, {}, 'Note deleted successfully', 200);
  })
);

/**
 * Folders (personal cloud storage — grouping for Files)
 */
workSuiteRoutes.get(
  '/folders',
  asyncHandler(async (req: any, res: Response) => {
    const parentId = (req.query.parentId as string | undefined) || null;
    const folders = await FolderService.list(req.user.userId, parentId);
    return ApiResponseHandler.success(res, folders, 'Folders retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/folders',
  asyncHandler(async (req: any, res: Response) => {
    const { name, parentId } = req.body;
    if (!name?.trim()) return ApiResponseHandler.error(res, 'Folder name is required', undefined, 400);
    try {
      const folder = await FolderService.create(req.user.userId, { name: name.trim(), parentId });
      return ApiResponseHandler.success(res, folder, 'Folder created successfully', 201);
    } catch {
      return ApiResponseHandler.error(res, 'Parent folder not found', undefined, 404);
    }
  })
);

workSuiteRoutes.delete(
  '/folders/:id',
  asyncHandler(async (req: any, res: Response) => {
    // The DB cascade wipes out nested folder/file rows on its own, but it
    // doesn't know about the actual objects sitting in Supabase Storage —
    // those have to be deleted explicitly first, or they'd sit there
    // orphaned (and billed) forever with no metadata pointing back to them.
    const subtreeIds = await FolderService.getSubtreeIds(req.user.userId, req.params.id);
    const orphanedFiles = await FileService.listByFolderIds(req.user.userId, subtreeIds);
    if (orphanedFiles.length) {
      const supabase = requireSupabaseAdmin();
      await supabase.storage.from(FILES_BUCKET).remove(orphanedFiles.map((f) => f.storageKey));
    }
    await FolderService.remove(req.user.userId, req.params.id);
    return ApiResponseHandler.success(res, {}, 'Folder deleted successfully', 200);
  })
);

/**
 * Files (personal cloud storage)
 */
workSuiteRoutes.get(
  '/files',
  asyncHandler(async (req: any, res: Response) => {
    const folderId = (req.query.folderId as string | undefined) || null;
    const files = await FileService.list(req.user.userId, folderId);
    return ApiResponseHandler.success(res, files, 'Files retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/files',
  upload.single('file'),
  asyncHandler(async (req: any, res: Response) => {
    if (!req.file) return ApiResponseHandler.error(res, 'No file provided', undefined, 400);
    const folderId = (req.body.folderId as string | undefined) || null;
    if (folderId) {
      try {
        await FolderService.getById(req.user.userId, folderId);
      } catch {
        return ApiResponseHandler.error(res, 'Folder not found', undefined, 404);
      }
    }

    const supabase = requireSupabaseAdmin();
    const safeName = req.file.originalname.replace(/[^\w.\-() ]/g, '_');
    const storageKey = `${req.user.userId}/${uuidv4()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(FILES_BUCKET)
      .upload(storageKey, req.file.buffer, { contentType: req.file.mimetype });
    if (uploadError) {
      return ApiResponseHandler.error(res, 'Failed to upload file', uploadError.message, 502);
    }

    const file = await FileService.create({
      userId: req.user.userId,
      folderId,
      name: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      storageKey,
    });
    return ApiResponseHandler.success(res, file, 'File uploaded successfully', 201);
  })
);

workSuiteRoutes.get(
  '/files/:id/download',
  asyncHandler(async (req: any, res: Response) => {
    const file = await FileService.getById(req.user.userId, req.params.id);
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(FILES_BUCKET)
      .createSignedUrl(file.storageKey, 60, { download: file.name });
    if (error || !data) {
      return ApiResponseHandler.error(res, 'Failed to generate download link', error?.message, 502);
    }
    return ApiResponseHandler.success(res, { url: data.signedUrl }, 'Download link generated', 200);
  })
);

workSuiteRoutes.delete(
  '/files/:id',
  asyncHandler(async (req: any, res: Response) => {
    const file = await FileService.remove(req.user.userId, req.params.id);
    const supabase = requireSupabaseAdmin();
    await supabase.storage.from(FILES_BUCKET).remove([file.storageKey]);
    return ApiResponseHandler.success(res, {}, 'File deleted successfully', 200);
  })
);

export default workSuiteRoutes;

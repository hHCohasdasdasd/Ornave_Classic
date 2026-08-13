import { Router, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponseHandler } from '../utils/apiResponse';
import { ProjectService, TaskService, ClientService, InvoiceService, GoalService, AchievementService, NoteService, FileService, WorkSuiteService } from '../services/workSuiteService';
import { FILES_BUCKET, requireSupabaseAdmin } from '../utils/supabaseStorage';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
});

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
 * Clients
 */
workSuiteRoutes.get(
  '/clients',
  asyncHandler(async (req: any, res: Response) => {
    const clients = await ClientService.list(req.user.userId);
    return ApiResponseHandler.success(res, clients, 'Clients retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/clients',
  asyncHandler(async (req: any, res: Response) => {
    const { name, email, phone, company, notes } = req.body;
    if (!name) return ApiResponseHandler.error(res, 'Client name is required', undefined, 400);
    const client = await ClientService.create(req.user.userId, { name, email, phone, company, notes });
    return ApiResponseHandler.success(res, client, 'Client created successfully', 201);
  })
);

workSuiteRoutes.put(
  '/clients/:id',
  asyncHandler(async (req: any, res: Response) => {
    const { name, email, phone, company, notes } = req.body;
    const client = await ClientService.update(req.user.userId, req.params.id, { name, email, phone, company, notes });
    return ApiResponseHandler.success(res, client, 'Client updated successfully', 200);
  })
);

workSuiteRoutes.delete(
  '/clients/:id',
  asyncHandler(async (req: any, res: Response) => {
    await ClientService.remove(req.user.userId, req.params.id);
    return ApiResponseHandler.success(res, {}, 'Client deleted successfully', 200);
  })
);

/**
 * Invoices
 */
workSuiteRoutes.get(
  '/invoices',
  asyncHandler(async (req: any, res: Response) => {
    const invoices = await InvoiceService.list(req.user.userId);
    return ApiResponseHandler.success(res, invoices, 'Invoices retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/invoices',
  asyncHandler(async (req: any, res: Response) => {
    const { title, amount, currency, clientId, dueDate } = req.body;
    if (!title || amount === undefined) {
      return ApiResponseHandler.error(res, 'Title and amount are required', undefined, 400);
    }
    const invoice = await InvoiceService.create(req.user.userId, { title, amount: Number(amount), currency, clientId, dueDate });
    return ApiResponseHandler.success(res, invoice, 'Invoice created successfully', 201);
  })
);

workSuiteRoutes.put(
  '/invoices/:id',
  asyncHandler(async (req: any, res: Response) => {
    const { title, amount, currency, clientId, dueDate } = req.body;
    const invoice = await InvoiceService.update(req.user.userId, req.params.id, {
      title,
      amount: amount === undefined ? undefined : Number(amount),
      currency,
      clientId,
      dueDate,
    });
    return ApiResponseHandler.success(res, invoice, 'Invoice updated successfully', 200);
  })
);

workSuiteRoutes.patch(
  '/invoices/:id/status',
  asyncHandler(async (req: any, res: Response) => {
    const { status } = req.body;
    if (!status) return ApiResponseHandler.error(res, 'Status is required', undefined, 400);
    const invoice = await InvoiceService.updateStatus(req.user.userId, req.params.id, status);
    return ApiResponseHandler.success(res, invoice, 'Invoice status updated successfully', 200);
  })
);

workSuiteRoutes.delete(
  '/invoices/:id',
  asyncHandler(async (req: any, res: Response) => {
    await InvoiceService.remove(req.user.userId, req.params.id);
    return ApiResponseHandler.success(res, {}, 'Invoice deleted successfully', 200);
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
 * Files (personal cloud storage)
 */
workSuiteRoutes.get(
  '/files',
  asyncHandler(async (req: any, res: Response) => {
    const files = await FileService.list(req.user.userId);
    return ApiResponseHandler.success(res, files, 'Files retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/files',
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

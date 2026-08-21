import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponseHandler } from '../utils/apiResponse';
import { ProjectService, TaskService, GoalService, AchievementService, NoteService, FileService, FolderService, WorkSuiteService, FocusService, JobApplicationService, WorkProfileService, CalendarEventService, FinanceEntryService, ManualOrderService, MenuItemService, RestaurantTableService, FloorPlanWallService, FloorPlanChairService, AutoCheckInService, CheckInProfileService, TableReservationService, KitchenService, PrinterSettingsService, TableOrderService, BarTabService, BarStoolService, PosLayoutSettingsService, ReceiptSettingsService } from '../services/workSuiteService';
import { StripeConnectService, TerminalService } from '../services/stripeConnectService';
import { PlaidService } from '../services/plaidService';
import { isPlaidConfigured } from '../utils/plaidClient';
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

/** Whether the logged-in user currently qualifies for automatic
 * reservation check-in, and which of the three requirements (profile,
 * tier, verified bank account) are still missing — powers the eligibility
 * checklist in the calendar event modal. */
workSuiteRoutes.get(
  '/auto-check-in/eligibility',
  asyncHandler(async (req: any, res: Response) => {
    const eligibility = await AutoCheckInService.getEligibility(req.user.userId);
    return ApiResponseHandler.success(res, eligibility, 'Eligibility retrieved successfully', 200);
  })
);

/**
 * Check-In Profile — the small, purpose-built profile (legal name + phone)
 * used only to confirm identity for Automatic Check-In. Separate from the
 * general profile on purpose.
 */
workSuiteRoutes.get(
  '/check-in-profile',
  asyncHandler(async (req: any, res: Response) => {
    const profile = await CheckInProfileService.get(req.user.userId);
    const photoUrl = await CheckInProfileService.getPhotoUrl(profile?.photoStorageKey);
    return ApiResponseHandler.success(res, profile ? { ...profile, photoUrl } : null, 'Check-in profile retrieved successfully', 200);
  })
);

workSuiteRoutes.put(
  '/check-in-profile',
  asyncHandler(async (req: any, res: Response) => {
    const { legalFirstName, legalLastName, phone, email, notes } = req.body;
    const profile = await CheckInProfileService.upsert(req.user.userId, { legalFirstName, legalLastName, phone, email, notes });
    return ApiResponseHandler.success(res, profile, 'Check-in profile updated successfully', 200);
  })
);

/** ID-style photo for Automatic Check-In — its own dedicated multipart
 * endpoint (same upload pattern as /files) rather than a field on the
 * regular PUT above, since it's a file, not form data. */
workSuiteRoutes.post(
  '/check-in-profile/photo',
  upload.single('file'),
  asyncHandler(async (req: any, res: Response) => {
    if (!req.file) return ApiResponseHandler.error(res, 'No file provided', undefined, 400);
    if (!req.file.mimetype.startsWith('image/')) {
      return ApiResponseHandler.error(res, 'File must be an image', undefined, 400);
    }

    const supabase = requireSupabaseAdmin();
    const safeName = req.file.originalname.replace(/[^\w.\-() ]/g, '_');
    const storageKey = `check-in-photos/${req.user.userId}/${uuidv4()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(FILES_BUCKET)
      .upload(storageKey, req.file.buffer, { contentType: req.file.mimetype });
    if (uploadError) {
      return ApiResponseHandler.error(res, 'Failed to upload photo', uploadError.message, 502);
    }

    const profile = await CheckInProfileService.upsert(req.user.userId, { photoStorageKey: storageKey });
    const photoUrl = await CheckInProfileService.getPhotoUrl(profile.photoStorageKey);
    return ApiResponseHandler.success(res, { ...profile, photoUrl }, 'Check-in photo uploaded successfully', 201);
  })
);

/** Generates a fresh token for a physical NFC card — the frontend writes
 * this onto a tapped tag via Web NFC (Chrome/Android only). Returns just
 * the token; nothing about the guest is written to the card itself. */
workSuiteRoutes.post(
  '/check-in-profile/nfc-card',
  asyncHandler(async (req: any, res: Response) => {
    const token = await CheckInProfileService.generateNfcToken(req.user.userId);
    return ApiResponseHandler.success(res, { nfcToken: token }, 'NFC card token generated successfully', 201);
  })
);

/**
 * Guest-arrival lookup for the host-stand kiosk — an NFC tap (token) or the
 * manual phone fallback for devices without NFC. Finds a same-day, not-yet-
 * checked-in reservation at this company and returns it with the guest's
 * photo, so staff can visually confirm before tapping Check In (see
 * POST /reservations/:id/check-in below — this only looks up, never
 * checks in by itself).
 */
workSuiteRoutes.get(
  '/reservations/lookup',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts can look up reservations', undefined, 403);
    const { nfcToken, phone } = req.query;
    if (!nfcToken && !phone) return ApiResponseHandler.error(res, 'nfcToken or phone is required', undefined, 400);
    const reservation = await TableReservationService.lookupArrival(req.user.companyId, { nfcToken, phone });
    if (!reservation) return ApiResponseHandler.error(res, 'No matching reservation found for today', undefined, 404);
    return ApiResponseHandler.success(res, reservation, 'Reservation found', 200);
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
 * Manual orders/invoices — purchases or bills from outside Ornave's own
 * marketplace (Orders & Invoices tab, Finance page).
 */
workSuiteRoutes.get(
  '/manual-orders',
  asyncHandler(async (req: any, res: Response) => {
    const orders = await ManualOrderService.list(req.user.userId);
    return ApiResponseHandler.success(res, orders, 'Manual orders retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/manual-orders',
  asyncHandler(async (req: any, res: Response) => {
    const { type, vendor, description, amount, currency, status, date, trackingNumber, notes } = req.body;
    if (!type || !vendor || amount === undefined || !date) {
      return ApiResponseHandler.error(res, 'Type, vendor, amount, and date are required', undefined, 400);
    }
    const order = await ManualOrderService.create(req.user.userId, {
      type, vendor, description, amount: Number(amount), currency, status, date, trackingNumber, notes,
    });
    return ApiResponseHandler.success(res, order, 'Manual order created successfully', 201);
  })
);

workSuiteRoutes.put(
  '/manual-orders/:id',
  asyncHandler(async (req: any, res: Response) => {
    const { type, vendor, description, amount, currency, status, date, trackingNumber, notes } = req.body;
    const order = await ManualOrderService.update(req.user.userId, req.params.id, {
      type,
      vendor,
      description,
      amount: amount === undefined ? undefined : Number(amount),
      currency,
      status,
      date,
      trackingNumber,
      notes,
    });
    return ApiResponseHandler.success(res, order, 'Manual order updated successfully', 200);
  })
);

workSuiteRoutes.delete(
  '/manual-orders/:id',
  asyncHandler(async (req: any, res: Response) => {
    await ManualOrderService.remove(req.user.userId, req.params.id);
    return ApiResponseHandler.success(res, {}, 'Manual order deleted successfully', 200);
  })
);

/**
 * Plaid — connecting a real bank account from the Finance page.
 */
workSuiteRoutes.get(
  '/plaid/status',
  asyncHandler(async (_req: any, res: Response) => {
    return ApiResponseHandler.success(res, { configured: isPlaidConfigured() }, 'Plaid status retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/plaid/link-token',
  asyncHandler(async (req: any, res: Response) => {
    if (!isPlaidConfigured()) return ApiResponseHandler.error(res, 'Bank connections are not configured', undefined, 503);
    const linkToken = await PlaidService.createLinkToken(req.user.userId);
    return ApiResponseHandler.success(res, { linkToken }, 'Link token created successfully', 200);
  })
);

workSuiteRoutes.post(
  '/plaid/exchange-token',
  asyncHandler(async (req: any, res: Response) => {
    const { publicToken } = req.body;
    if (!publicToken) return ApiResponseHandler.error(res, 'publicToken is required', undefined, 400);
    const connection = await PlaidService.exchangePublicToken(req.user.userId, publicToken);
    return ApiResponseHandler.success(res, connection, 'Bank connected successfully', 201);
  })
);

workSuiteRoutes.get(
  '/plaid/connections',
  asyncHandler(async (req: any, res: Response) => {
    const connections = await PlaidService.listConnections(req.user.userId);
    return ApiResponseHandler.success(res, connections, 'Bank connections retrieved successfully', 200);
  })
);

workSuiteRoutes.get(
  '/plaid/transactions',
  asyncHandler(async (req: any, res: Response) => {
    const days = req.query.days ? Number(req.query.days) : 30;
    const transactions = await PlaidService.listTransactions(req.user.userId, days);
    return ApiResponseHandler.success(res, transactions, 'Transactions retrieved successfully', 200);
  })
);

workSuiteRoutes.delete(
  '/plaid/connections/:id',
  asyncHandler(async (req: any, res: Response) => {
    await PlaidService.removeConnection(req.user.userId, req.params.id);
    return ApiResponseHandler.success(res, {}, 'Bank connection removed successfully', 200);
  })
);

workSuiteRoutes.post(
  '/plaid/accounts/:id/verify',
  asyncHandler(async (req: any, res: Response) => {
    try {
      const account = await PlaidService.verifyBankAccount(req.user.userId, req.params.id);
      return ApiResponseHandler.success(res, account, 'Bank account verification checked', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not verify bank account', undefined, err.statusCode || 400);
    }
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

/**
 * Menu items — restaurant-layout companies manage their menu here; the
 * public profile's Menu tab reads the same data via the unauthenticated
 * route in networkRoutes.ts. Company-scoped, so only makes sense for
 * COMPANY_USER accounts.
 */
workSuiteRoutes.get(
  '/menu',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a menu', undefined, 403);
    const items = await MenuItemService.listForCompany(req.user.companyId);
    return ApiResponseHandler.success(res, items, 'Menu items retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/menu',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a menu', undefined, 403);
    try {
      const { name, description, price, category, sortOrder, station } = req.body;
      const item = await MenuItemService.create(req.user.companyId, { name, description, price, category, sortOrder, station });
      return ApiResponseHandler.success(res, item, 'Menu item created successfully', 201);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not create menu item', undefined, 400);
    }
  })
);

workSuiteRoutes.patch(
  '/menu/:id',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a menu', undefined, 403);
    const { name, description, price, category, isAvailable, sortOrder, station } = req.body;
    const item = await MenuItemService.update(req.user.companyId, req.params.id, { name, description, price, category, isAvailable, sortOrder, station });
    return ApiResponseHandler.success(res, item, 'Menu item updated successfully', 200);
  })
);

workSuiteRoutes.delete(
  '/menu/:id',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a menu', undefined, 403);
    await MenuItemService.remove(req.user.companyId, req.params.id);
    return ApiResponseHandler.success(res, {}, 'Menu item deleted successfully', 200);
  })
);

/** Optional dish/drink photo — its own multipart endpoint (same pattern as
 * check-in photos) since it's a file, not form data on the regular PATCH. */
workSuiteRoutes.post(
  '/menu/:id/image',
  upload.single('file'),
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a menu', undefined, 403);
    if (!req.file) return ApiResponseHandler.error(res, 'No file provided', undefined, 400);
    if (!req.file.mimetype.startsWith('image/')) {
      return ApiResponseHandler.error(res, 'File must be an image', undefined, 400);
    }

    try {
      const supabase = requireSupabaseAdmin();
      const safeName = req.file.originalname.replace(/[^\w.\-() ]/g, '_');
      const storageKey = `menu-photos/${req.user.companyId}/${uuidv4()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(FILES_BUCKET)
        .upload(storageKey, req.file.buffer, { contentType: req.file.mimetype });
      if (uploadError) {
        return ApiResponseHandler.error(res, 'Failed to upload photo', uploadError.message, 502);
      }

      const item = await MenuItemService.setImage(req.user.companyId, req.params.id, storageKey);
      return ApiResponseHandler.success(res, item, 'Menu photo uploaded successfully', 201);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not upload photo', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.delete(
  '/menu/:id/image',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a menu', undefined, 403);
    try {
      const item = await MenuItemService.setImage(req.user.companyId, req.params.id, null);
      return ApiResponseHandler.success(res, item, 'Menu photo removed successfully', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not remove photo', undefined, err.statusCode || 400);
    }
  })
);

/**
 * Kitchen/Bar displays — the fullscreen station views, filtered by
 * ?station=KITCHEN|BAR. Not-yet-served items only, oldest first.
 */
workSuiteRoutes.get(
  '/kitchen-orders',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have station orders', undefined, 403);
    const station = req.query.station === 'BAR' ? 'BAR' : 'KITCHEN';
    const items = await KitchenService.listForStation(req.user.companyId, station);
    return ApiResponseHandler.success(res, items, 'Orders retrieved successfully', 200);
  })
);

workSuiteRoutes.patch(
  '/kitchen-orders/:id/status',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have station orders', undefined, 403);
    try {
      const item = await KitchenService.updateStatus(req.user.companyId, req.params.id, req.body.status);
      return ApiResponseHandler.success(res, item, 'Status updated successfully', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not update status', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.patch(
  '/kitchen-orders/:id/printed',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have station orders', undefined, 403);
    try {
      const item = await KitchenService.markPrinted(req.user.companyId, req.params.id);
      return ApiResponseHandler.success(res, item, 'Marked as printed', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not mark as printed', undefined, err.statusCode || 400);
    }
  })
);

/**
 * Printer settings — one row per station (Kitchen/Bar/Reservations), each
 * with its own print method (USB thermal printer or the browser's print
 * dialog) and, for Kitchen/Bar, whether tickets print automatically.
 */
workSuiteRoutes.get(
  '/printer-settings/:station',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have printer settings', undefined, 403);
    const settings = await PrinterSettingsService.get(req.user.companyId, req.params.station);
    return ApiResponseHandler.success(res, settings, 'Printer settings retrieved successfully', 200);
  })
);

workSuiteRoutes.patch(
  '/printer-settings/:station',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have printer settings', undefined, 403);
    try {
      const { printMethod, autoPrint } = req.body;
      const settings = await PrinterSettingsService.update(req.user.companyId, req.params.station, { printMethod, autoPrint });
      return ApiResponseHandler.success(res, settings, 'Printer settings updated successfully', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not update printer settings', undefined, err.statusCode || 400);
    }
  })
);

/**
 * Receipt Design — custom header/footer lines printed on every receipt,
 * on top of whatever page-specific content each print call already
 * builds. Company-wide (not per-station, unlike printer settings above).
 */
workSuiteRoutes.get(
  '/receipt-settings',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have receipt settings', undefined, 403);
    const settings = await ReceiptSettingsService.get(req.user.companyId);
    return ApiResponseHandler.success(res, settings, 'Receipt settings retrieved successfully', 200);
  })
);

workSuiteRoutes.patch(
  '/receipt-settings',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have receipt settings', undefined, 403);
    const { headerText, footerText } = req.body || {};
    const settings = await ReceiptSettingsService.update(req.user.companyId, { headerText, footerText });
    return ApiResponseHandler.success(res, settings, 'Receipt settings updated successfully', 200);
  })
);

/**
 * POS layout — which of Check Functions/Discounts/Service Charges/Payments
 * a company has promoted to quick-access buttons on the Server Orders
 * order screen, and in what order. Print/Send aren't included — they're
 * always shown, the page doesn't work without them.
 */
workSuiteRoutes.get(
  '/pos-layout',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a POS layout', undefined, 403);
    const layout = await PosLayoutSettingsService.get(req.user.companyId);
    return ApiResponseHandler.success(res, layout, 'Layout retrieved successfully', 200);
  })
);

workSuiteRoutes.patch(
  '/pos-layout',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a POS layout', undefined, 403);
    const layout = await PosLayoutSettingsService.update(req.user.companyId, req.body?.order || []);
    return ApiResponseHandler.success(res, layout, 'Layout updated successfully', 200);
  })
);

/**
 * Server Ordering — staff placing orders on behalf of a table directly
 * (walk-ins, or guests who'd rather not use the QR self-order page), as
 * opposed to the public no-login table-side ordering flow in
 * networkRoutes.ts. Items land in the exact same TableOrderItem rows, so
 * anything entered here shows up on Kitchen/Bar immediately.
 */
workSuiteRoutes.get(
  '/server-orders/tables',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have server ordering', undefined, 403);
    const tables = await TableOrderService.listTablesWithStatus(req.user.companyId);
    return ApiResponseHandler.success(res, tables, 'Tables retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/server-orders/tables/:tableId/walk-in',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have server ordering', undefined, 403);
    try {
      const { partySize, guestName, guestPhone } = req.body;
      const reservation = await TableReservationService.startWalkIn(req.user.companyId, req.params.tableId, { partySize, guestName, guestPhone });
      return ApiResponseHandler.success(res, reservation, 'Walk-in started', 201);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not start walk-in', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.get(
  '/server-orders/tables/:tableId',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have server ordering', undefined, 403);
    const order = await TableOrderService.getOrderForTable(req.user.companyId, req.params.tableId);
    return ApiResponseHandler.success(res, order, 'Order retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/server-orders/tables/:tableId/items',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have server ordering', undefined, 403);
    try {
      const { menuItemId, quantity, note } = req.body;
      const item = await TableOrderService.addItem(req.user.companyId, req.params.tableId, { menuItemId, quantity, note });
      return ApiResponseHandler.success(res, item, 'Item added', 201);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not add item', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.delete(
  '/server-orders/tables/:tableId/items/:itemId',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have server ordering', undefined, 403);
    try {
      await TableOrderService.removeItem(req.user.companyId, req.params.tableId, req.params.itemId);
      return ApiResponseHandler.success(res, {}, 'Item removed', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not remove item', undefined, err.statusCode || 400);
    }
  })
);

/**
 * Check Functions, Discounts, Service Charges, Payments — the POS-style
 * controls on the Server Orders screen. All operate on whatever table's
 * order is currently active, same guard as the item routes above.
 */
workSuiteRoutes.post(
  '/server-orders/tables/:tableId/items/:itemId/void',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have server ordering', undefined, 403);
    try {
      const order = await TableOrderService.voidItem(req.user.companyId, req.params.tableId, req.params.itemId, req.body?.reason);
      return ApiResponseHandler.success(res, order, 'Item voided', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not void item', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.post(
  '/server-orders/tables/:tableId/cancel',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have server ordering', undefined, 403);
    try {
      const order = await TableOrderService.cancelOrder(req.user.companyId, req.params.tableId, req.body?.reason);
      return ApiResponseHandler.success(res, order, 'Order cancelled', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not cancel order', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.post(
  '/server-orders/tables/:tableId/split',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have server ordering', undefined, 403);
    try {
      const order = await TableOrderService.splitCheck(req.user.companyId, req.params.tableId);
      return ApiResponseHandler.success(res, order, 'Check split', 201);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not split check', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.post(
  '/server-orders/tables/:tableId/checks',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have server ordering', undefined, 403);
    try {
      const order = await TableOrderService.addCheck(req.user.companyId, req.params.tableId);
      return ApiResponseHandler.success(res, order, 'Check added', 201);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not add check', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.patch(
  '/server-orders/tables/:tableId/items/:itemId/check',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have server ordering', undefined, 403);
    try {
      const order = await TableOrderService.assignItemToCheck(req.user.companyId, req.params.tableId, req.params.itemId, req.body?.checkId);
      return ApiResponseHandler.success(res, order, 'Item moved', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not move item', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.patch(
  '/server-orders/tables/:tableId/discount',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have server ordering', undefined, 403);
    try {
      const { type, value, label, checkId } = req.body;
      const order = await TableOrderService.applyDiscount(req.user.companyId, req.params.tableId, { type: type || null, value, label, checkId });
      return ApiResponseHandler.success(res, order, 'Discount updated', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not update discount', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.patch(
  '/server-orders/tables/:tableId/service-charge',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have server ordering', undefined, 403);
    try {
      const { type, value, checkId } = req.body;
      const order = await TableOrderService.applyServiceCharge(req.user.companyId, req.params.tableId, { type: type || null, value, checkId });
      return ApiResponseHandler.success(res, order, 'Service charge updated', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not update service charge', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.patch(
  '/server-orders/tables/:tableId/party-size',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have server ordering', undefined, 403);
    try {
      const order = await TableOrderService.updatePartySize(req.user.companyId, req.params.tableId, req.body?.partySize);
      return ApiResponseHandler.success(res, order, 'Party size updated', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not update party size', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.post(
  '/server-orders/tables/:tableId/payment',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have server ordering', undefined, 403);
    try {
      const { method, checkId } = req.body;
      const order = await TableOrderService.recordPayment(req.user.companyId, req.params.tableId, { method, checkId });
      return ApiResponseHandler.success(res, order, 'Payment recorded', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not record payment', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.post(
  '/server-orders/tables/:tableId/terminal-payment',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have server ordering', undefined, 403);
    try {
      const { readerId, checkId } = req.body || {};
      const result = await TerminalService.chargeForTable(req.user.companyId, req.params.tableId, readerId, checkId);
      return ApiResponseHandler.success(res, result, 'Sent to reader', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not charge the reader', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.post(
  '/server-orders/tables/:tableId/terminal-payment/complete',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have server ordering', undefined, 403);
    try {
      const { paymentIntentId, checkId } = req.body || {};
      const order = await TerminalService.completeTableCharge(req.user.companyId, req.params.tableId, paymentIntentId, checkId);
      return ApiResponseHandler.success(res, order, 'Payment recorded', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not complete this payment', undefined, err.statusCode || 400);
    }
  })
);

/**
 * Bar Orders — a walk-up bar tab, started under a name rather than tied to
 * any floor-plan table/seat. Mirrors Server Orders' routes one-for-one
 * (BarTabService mirrors TableOrderService), just addressed by tabId.
 */
workSuiteRoutes.get(
  '/bar-orders/tabs',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have bar ordering', undefined, 403);
    const tabs = await BarTabService.listOpenTabs(req.user.companyId);
    return ApiResponseHandler.success(res, tabs, 'Tabs retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/bar-orders/tabs',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have bar ordering', undefined, 403);
    try {
      const tab = await BarTabService.startTab(req.user.companyId, req.body?.label, req.body?.stoolId);
      return ApiResponseHandler.success(res, tab, 'Tab started', 201);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not start tab', undefined, err.statusCode || 400);
    }
  })
);

/** Stools tagged with their active tab (if any) — the Bar module's
 * clickable seating grid, mirroring /server-orders/tables. */
workSuiteRoutes.get(
  '/bar-orders/stools',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have bar ordering', undefined, 403);
    const stools = await BarStoolService.listStoolsWithStatus(req.user.companyId);
    return ApiResponseHandler.success(res, stools, 'Stools retrieved successfully', 200);
  })
);

workSuiteRoutes.get(
  '/bar-orders/tabs/:tabId',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have bar ordering', undefined, 403);
    const tab = await BarTabService.getTab(req.user.companyId, req.params.tabId);
    return ApiResponseHandler.success(res, tab, 'Tab retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/bar-orders/tabs/:tabId/items',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have bar ordering', undefined, 403);
    try {
      const { menuItemId, quantity, note, checkId } = req.body;
      const item = await BarTabService.addItem(req.user.companyId, req.params.tabId, { menuItemId, quantity, note, checkId });
      return ApiResponseHandler.success(res, item, 'Item added', 201);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not add item', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.delete(
  '/bar-orders/tabs/:tabId/items/:itemId',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have bar ordering', undefined, 403);
    try {
      await BarTabService.removeItem(req.user.companyId, req.params.tabId, req.params.itemId);
      return ApiResponseHandler.success(res, {}, 'Item removed', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not remove item', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.post(
  '/bar-orders/tabs/:tabId/items/:itemId/void',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have bar ordering', undefined, 403);
    try {
      const tab = await BarTabService.voidItem(req.user.companyId, req.params.tabId, req.params.itemId, req.body?.reason);
      return ApiResponseHandler.success(res, tab, 'Item voided', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not void item', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.post(
  '/bar-orders/tabs/:tabId/cancel',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have bar ordering', undefined, 403);
    try {
      const tab = await BarTabService.cancelTab(req.user.companyId, req.params.tabId, req.body?.reason);
      return ApiResponseHandler.success(res, tab, 'Tab cancelled', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not cancel tab', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.post(
  '/bar-orders/tabs/:tabId/split',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have bar ordering', undefined, 403);
    try {
      const tab = await BarTabService.splitCheck(req.user.companyId, req.params.tabId);
      return ApiResponseHandler.success(res, tab, 'Check split', 201);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not split check', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.post(
  '/bar-orders/tabs/:tabId/checks',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have bar ordering', undefined, 403);
    try {
      const tab = await BarTabService.addCheck(req.user.companyId, req.params.tabId);
      return ApiResponseHandler.success(res, tab, 'Check added', 201);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not add check', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.patch(
  '/bar-orders/tabs/:tabId/items/:itemId/check',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have bar ordering', undefined, 403);
    try {
      const tab = await BarTabService.assignItemToCheck(req.user.companyId, req.params.tabId, req.params.itemId, req.body?.checkId);
      return ApiResponseHandler.success(res, tab, 'Item moved', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not move item', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.patch(
  '/bar-orders/tabs/:tabId/discount',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have bar ordering', undefined, 403);
    try {
      const { type, value, label, checkId } = req.body;
      const tab = await BarTabService.applyDiscount(req.user.companyId, req.params.tabId, { type: type || null, value, label, checkId });
      return ApiResponseHandler.success(res, tab, 'Discount updated', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not update discount', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.patch(
  '/bar-orders/tabs/:tabId/service-charge',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have bar ordering', undefined, 403);
    try {
      const { type, value, checkId } = req.body;
      const tab = await BarTabService.applyServiceCharge(req.user.companyId, req.params.tabId, { type: type || null, value, checkId });
      return ApiResponseHandler.success(res, tab, 'Service charge updated', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not update service charge', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.post(
  '/bar-orders/tabs/:tabId/payment',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have bar ordering', undefined, 403);
    try {
      const { method, checkId } = req.body;
      const tab = await BarTabService.recordPayment(req.user.companyId, req.params.tabId, { method, checkId });
      return ApiResponseHandler.success(res, tab, 'Payment recorded', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not record payment', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.post(
  '/bar-orders/tabs/:tabId/terminal-payment',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have bar ordering', undefined, 403);
    try {
      const { readerId, checkId } = req.body || {};
      const result = await TerminalService.chargeForTab(req.user.companyId, req.params.tabId, readerId, checkId);
      return ApiResponseHandler.success(res, result, 'Sent to reader', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not charge the reader', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.post(
  '/bar-orders/tabs/:tabId/terminal-payment/complete',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have bar ordering', undefined, 403);
    try {
      const { paymentIntentId, checkId } = req.body || {};
      const tab = await TerminalService.completeTabCharge(req.user.companyId, req.params.tabId, paymentIntentId, checkId);
      return ApiResponseHandler.success(res, tab, 'Payment recorded', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not complete this payment', undefined, err.statusCode || 400);
    }
  })
);

/**
 * Payments — Stripe Connect (the company's own account, for real card
 * charges to settle to their own bank) and Stripe Terminal (physical card
 * readers). For guests who won't be paying via Automatic Check-In.
 */
workSuiteRoutes.get(
  '/payments/status',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have payments', undefined, 403);
    const status = await StripeConnectService.getStatus(req.user.companyId);
    return ApiResponseHandler.success(res, status, 'Status retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/payments/connect',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have payments', undefined, 403);
    try {
      const link = await StripeConnectService.createOnboardingLink(req.user.companyId);
      return ApiResponseHandler.success(res, link, 'Onboarding link created', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not start onboarding', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.post(
  '/payments/dashboard',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have payments', undefined, 403);
    try {
      const link = await StripeConnectService.createDashboardLink(req.user.companyId);
      return ApiResponseHandler.success(res, link, 'Dashboard link created', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not open the dashboard', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.post(
  '/payments/disconnect',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have payments', undefined, 403);
    await StripeConnectService.disconnect(req.user.companyId);
    return ApiResponseHandler.success(res, {}, 'Disconnected', 200);
  })
);

workSuiteRoutes.post(
  '/payments/terminal/location',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have payments', undefined, 403);
    try {
      const { line1, line2, city, state, postalCode, country } = req.body || {};
      const locationId = await TerminalService.ensureLocation(req.user.companyId, { line1, line2, city, state, postalCode, country });
      return ApiResponseHandler.success(res, { locationId }, 'Location ready', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not set up the card reader location', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.get(
  '/payments/terminal/readers',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have payments', undefined, 403);
    try {
      const readers = await TerminalService.listReaders(req.user.companyId);
      return ApiResponseHandler.success(res, readers, 'Readers retrieved successfully', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not list readers', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.post(
  '/payments/terminal/readers',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have payments', undefined, 403);
    try {
      const { registrationCode, label } = req.body || {};
      const reader = await TerminalService.registerReader(req.user.companyId, registrationCode, label);
      return ApiResponseHandler.success(res, reader, 'Reader registered', 201);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not register that reader', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.delete(
  '/payments/terminal/readers/:readerId',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have payments', undefined, 403);
    try {
      await TerminalService.removeReader(req.user.companyId, req.params.readerId);
      return ApiResponseHandler.success(res, {}, 'Reader removed', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not remove that reader', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.post(
  '/payments/terminal/readers/:readerId/cancel',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have payments', undefined, 403);
    try {
      await TerminalService.cancelReaderAction(req.user.companyId, req.params.readerId);
      return ApiResponseHandler.success(res, {}, 'Cancelled', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not cancel', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.get(
  '/payments/terminal/payment-intents/:id',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have payments', undefined, 403);
    try {
      const status = await TerminalService.getPaymentIntentStatus(req.user.companyId, req.params.id);
      return ApiResponseHandler.success(res, status, 'Status retrieved successfully', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not check payment status', undefined, err.statusCode || 400);
    }
  })
);

/**
 * Reservations — the restaurant's own view of bookings made against its
 * tables (as opposed to the public/booker-facing endpoints in
 * networkRoutes.ts). Restaurant-layout companies only.
 */
workSuiteRoutes.get(
  '/reservations',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have reservations', undefined, 403);
    const reservations = await TableReservationService.listForCompany(req.user.companyId);
    return ApiResponseHandler.success(res, reservations, 'Reservations retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/reservations/:id/check-in',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have reservations', undefined, 403);
    try {
      const reservation = await TableReservationService.checkInByStaff(req.user.companyId, req.params.id);
      return ApiResponseHandler.success(res, reservation, 'Guest checked in', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not check in this reservation', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.post(
  '/reservations/:id/cancel',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have reservations', undefined, 403);
    try {
      const reservation = await TableReservationService.cancelByStaff(req.user.companyId, req.params.id);
      return ApiResponseHandler.success(res, reservation, 'Reservation cancelled', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not cancel this reservation', undefined, err.statusCode || 400);
    }
  })
);

/**
 * Floor plan tables — restaurant-layout companies only, front-of-house use.
 */
workSuiteRoutes.get(
  '/floor-plan/tables',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a floor plan', undefined, 403);
    const tables = await RestaurantTableService.listForCompany(req.user.companyId);
    return ApiResponseHandler.success(res, tables, 'Tables retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/floor-plan/tables',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a floor plan', undefined, 403);
    try {
      const { label, seats, shape, positionX, positionY } = req.body;
      const table = await RestaurantTableService.create(req.user.companyId, { label, seats, shape, positionX, positionY });
      return ApiResponseHandler.success(res, table, 'Table created successfully', 201);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not create table', undefined, 400);
    }
  })
);

workSuiteRoutes.patch(
  '/floor-plan/tables/:id',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a floor plan', undefined, 403);
    try {
      const { label, seats, shape, status, positionX, positionY, width, height } = req.body;
      const table = await RestaurantTableService.update(req.user.companyId, req.params.id, { label, seats, shape, status, positionX, positionY, width, height });
      return ApiResponseHandler.success(res, table, 'Table updated successfully', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not update table', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.delete(
  '/floor-plan/tables/:id',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a floor plan', undefined, 403);
    await RestaurantTableService.remove(req.user.companyId, req.params.id);
    return ApiResponseHandler.success(res, {}, 'Table deleted successfully', 200);
  })
);

/**
 * Floor plan chairs.
 */
workSuiteRoutes.get(
  '/floor-plan/chairs',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a floor plan', undefined, 403);
    const chairs = await FloorPlanChairService.listForCompany(req.user.companyId);
    return ApiResponseHandler.success(res, chairs, 'Chairs retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/floor-plan/chairs',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a floor plan', undefined, 403);
    const { positionX, positionY, rotation } = req.body;
    const chair = await FloorPlanChairService.create(req.user.companyId, { positionX, positionY, rotation });
    return ApiResponseHandler.success(res, chair, 'Chair created successfully', 201);
  })
);

workSuiteRoutes.patch(
  '/floor-plan/chairs/:id',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a floor plan', undefined, 403);
    try {
      const { positionX, positionY, rotation } = req.body;
      const chair = await FloorPlanChairService.update(req.user.companyId, req.params.id, { positionX, positionY, rotation });
      return ApiResponseHandler.success(res, chair, 'Chair updated successfully', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not update chair', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.delete(
  '/floor-plan/chairs/:id',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a floor plan', undefined, 403);
    await FloorPlanChairService.remove(req.user.companyId, req.params.id);
    return ApiResponseHandler.success(res, {}, 'Chair deleted successfully', 200);
  })
);

/**
 * Floor plan bar stools — same shape as chairs, but their own type so the
 * Bar module can read them directly for its seating chart.
 */
workSuiteRoutes.get(
  '/floor-plan/stools',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a floor plan', undefined, 403);
    const stools = await BarStoolService.listForCompany(req.user.companyId);
    return ApiResponseHandler.success(res, stools, 'Stools retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/floor-plan/stools',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a floor plan', undefined, 403);
    const { positionX, positionY, rotation } = req.body;
    const stool = await BarStoolService.create(req.user.companyId, { positionX, positionY, rotation });
    return ApiResponseHandler.success(res, stool, 'Stool created successfully', 201);
  })
);

workSuiteRoutes.patch(
  '/floor-plan/stools/:id',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a floor plan', undefined, 403);
    try {
      const { label, positionX, positionY, rotation } = req.body;
      const stool = await BarStoolService.update(req.user.companyId, req.params.id, { label, positionX, positionY, rotation });
      return ApiResponseHandler.success(res, stool, 'Stool updated successfully', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not update stool', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.delete(
  '/floor-plan/stools/:id',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a floor plan', undefined, 403);
    await BarStoolService.remove(req.user.companyId, req.params.id);
    return ApiResponseHandler.success(res, {}, 'Stool deleted successfully', 200);
  })
);

/**
 * Floor plan walls — the hand-sketched outline behind the tables.
 */
workSuiteRoutes.get(
  '/floor-plan/walls',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a floor plan', undefined, 403);
    const walls = await FloorPlanWallService.listForCompany(req.user.companyId);
    return ApiResponseHandler.success(res, walls, 'Walls retrieved successfully', 200);
  })
);

workSuiteRoutes.post(
  '/floor-plan/walls',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a floor plan', undefined, 403);
    try {
      const { shape, x1, y1, x2, y2, radius } = req.body;
      const wall = await FloorPlanWallService.create(req.user.companyId, { shape, x1, y1, x2, y2, radius });
      return ApiResponseHandler.success(res, wall, 'Wall created successfully', 201);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not create wall', undefined, 400);
    }
  })
);

workSuiteRoutes.patch(
  '/floor-plan/walls/:id/curve',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a floor plan', undefined, 403);
    try {
      const { curveX, curveY } = req.body;
      const wall = await FloorPlanWallService.setCurve(req.user.companyId, req.params.id, curveX ?? null, curveY ?? null);
      return ApiResponseHandler.success(res, wall, 'Wall curve updated successfully', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not update wall curve', undefined, err.statusCode || 400);
    }
  })
);

workSuiteRoutes.delete(
  '/floor-plan/walls/:id',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a floor plan', undefined, 403);
    await FloorPlanWallService.remove(req.user.companyId, req.params.id);
    return ApiResponseHandler.success(res, {}, 'Wall deleted successfully', 200);
  })
);

workSuiteRoutes.delete(
  '/floor-plan/walls',
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) return ApiResponseHandler.error(res, 'Only company accounts have a floor plan', undefined, 403);
    await FloorPlanWallService.clearAll(req.user.companyId);
    return ApiResponseHandler.success(res, {}, 'Walls cleared successfully', 200);
  })
);

export default workSuiteRoutes;

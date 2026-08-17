import { apiClient } from './api';

export interface WorkSuiteSummary {
  activeProjects: number;
  openTasks: number;
  activeGoals: number;
  achievements: number;
  recentAchievements: Achievement[];
}

export interface FocusPrefs {
  workMinutes: number;
  breakMinutes: number;
}

export interface WorkSuiteInsight {
  id: string;
  icon: string;
  message: string;
  actionLabel: string;
  actionRoute: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  progress: number;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type JobApplicationStatus = 'SAVED' | 'APPLIED' | 'INTERVIEWING' | 'OFFER' | 'REJECTED';

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: JobApplicationStatus;
  url?: string;
  notes?: string;
  appliedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description?: string;
  category?: string;
  achievedAt: string;
  createdAt: string;
}

export type NoteType = 'NOTE' | 'STICKY' | 'MINDMAP';

export type NoteShape = 'pill' | 'rect' | 'diamond' | 'hexagon';
export type NoteFontSize = 'sm' | 'md' | 'lg';

export interface Note {
  id: string;
  type: NoteType;
  title?: string;
  content: string;
  color?: string;
  shape?: NoteShape;
  fontSize?: NoteFontSize;
  posX?: number;
  posY?: number;
  pinned: boolean;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface UserFile {
  id: string;
  folderId?: string | null;
  category?: string | null;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
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

export interface WorkProfile {
  headline: string | null;
  summary: string | null;
  experience: WorkExperienceEntry[];
  education: WorkEducationEntry[];
  skills: string[];
}

export interface UserFolder {
  id: string;
  parentId?: string | null;
  name: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  projectId?: string;
  project?: { id: string; name: string } | null;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
}

export type FinanceEntryType = 'INCOME' | 'EXPENSE';
export type FinanceEntryStatus = 'PAID' | 'PENDING';

export interface FinanceEntry {
  id: string;
  type: FinanceEntryType;
  amount: number;
  description: string;
  category?: string;
  status: FinanceEntryStatus;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccount {
  id: string;
  plaidAccountId: string;
  name: string;
  officialName?: string;
  mask?: string;
  type: string;
  subtype?: string;
  currentBalance?: number;
  availableBalance?: number;
  currency?: string;
}

export interface BankConnection {
  id: string;
  institutionName?: string;
  accounts: BankAccount[];
  createdAt: string;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  institutionName?: string;
  name: string;
  merchantName?: string;
  amount: number;
  currency?: string;
  date: string;
  category?: string;
  pending: boolean;
}

class WorkSuiteService {
  async getSummary(): Promise<WorkSuiteSummary> {
    const response = await apiClient.get('/work-suite/summary');
    return response.data.data;
  }

  async getInsights(): Promise<WorkSuiteInsight[]> {
    const response = await apiClient.get('/work-suite/insights');
    return response.data.data || [];
  }

  // Projects
  async listProjects(): Promise<Project[]> {
    const response = await apiClient.get('/work-suite/projects');
    return response.data.data || [];
  }

  async createProject(data: { name: string; description?: string }): Promise<Project> {
    const response = await apiClient.post('/work-suite/projects', data);
    return response.data.data;
  }

  async updateProject(id: string, data: Partial<Pick<Project, 'name' | 'description' | 'status'>>): Promise<Project> {
    const response = await apiClient.put(`/work-suite/projects/${id}`, data);
    return response.data.data;
  }

  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`/work-suite/projects/${id}`);
  }

  // Tasks
  async listTasks(projectId?: string): Promise<Task[]> {
    const response = await apiClient.get('/work-suite/tasks', { params: projectId ? { projectId } : undefined });
    return response.data.data || [];
  }

  async createTask(data: { title: string; description?: string; priority?: string; projectId?: string; dueDate?: string }): Promise<Task> {
    const response = await apiClient.post('/work-suite/tasks', data);
    return response.data.data;
  }

  async updateTask(id: string, data: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'projectId' | 'dueDate'>>): Promise<Task> {
    const response = await apiClient.put(`/work-suite/tasks/${id}`, data);
    return response.data.data;
  }

  async updateTaskStatus(id: string, status: Task['status']): Promise<Task> {
    const response = await apiClient.patch(`/work-suite/tasks/${id}/status`, { status });
    return response.data.data;
  }

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/work-suite/tasks/${id}`);
  }

  // Focus timer
  async getFocusPrefs(): Promise<FocusPrefs> {
    const response = await apiClient.get('/work-suite/focus/prefs');
    return response.data.data;
  }

  async updateFocusPrefs(data: Partial<FocusPrefs>): Promise<FocusPrefs> {
    const response = await apiClient.put('/work-suite/focus/prefs', data);
    return response.data.data;
  }

  async getTodayFocusSessionCount(): Promise<number> {
    const response = await apiClient.get('/work-suite/focus/sessions/today-count');
    return response.data.data.count;
  }

  async logFocusSession(workMinutes: number, breakMinutes: number): Promise<void> {
    await apiClient.post('/work-suite/focus/sessions', { workMinutes, breakMinutes });
  }

  // Goals
  async listGoals(): Promise<Goal[]> {
    const response = await apiClient.get('/work-suite/goals');
    return response.data.data || [];
  }

  async createGoal(data: { title: string; description?: string; category?: string; targetDate?: string }): Promise<Goal> {
    const response = await apiClient.post('/work-suite/goals', data);
    return response.data.data;
  }

  async updateGoal(id: string, data: Partial<Pick<Goal, 'title' | 'description' | 'category' | 'status' | 'progress' | 'targetDate'>>): Promise<Goal> {
    const response = await apiClient.put(`/work-suite/goals/${id}`, data);
    return response.data.data;
  }

  async updateGoalProgress(id: string, progress: number): Promise<Goal> {
    const response = await apiClient.patch(`/work-suite/goals/${id}/progress`, { progress });
    return response.data.data;
  }

  async deleteGoal(id: string): Promise<void> {
    await apiClient.delete(`/work-suite/goals/${id}`);
  }

  // Job Applications
  async listJobApplications(): Promise<JobApplication[]> {
    const response = await apiClient.get('/work-suite/job-applications');
    return response.data.data || [];
  }

  async createJobApplication(data: { company: string; role: string; url?: string; notes?: string; appliedDate?: string }): Promise<JobApplication> {
    const response = await apiClient.post('/work-suite/job-applications', data);
    return response.data.data;
  }

  async updateJobApplication(id: string, data: Partial<Pick<JobApplication, 'company' | 'role' | 'status' | 'url' | 'notes' | 'appliedDate'>>): Promise<JobApplication> {
    const response = await apiClient.put(`/work-suite/job-applications/${id}`, data);
    return response.data.data;
  }

  async updateJobApplicationStatus(id: string, status: JobApplicationStatus): Promise<JobApplication> {
    const response = await apiClient.patch(`/work-suite/job-applications/${id}/status`, { status });
    return response.data.data;
  }

  async deleteJobApplication(id: string): Promise<void> {
    await apiClient.delete(`/work-suite/job-applications/${id}`);
  }

  // Calendar Events
  async listCalendarEvents(): Promise<CalendarEvent[]> {
    const response = await apiClient.get('/work-suite/calendar-events');
    return response.data.data || [];
  }

  async createCalendarEvent(data: { title: string; description?: string; startDate: string; endDate?: string; allDay: boolean; startTime?: string; endTime?: string }): Promise<CalendarEvent> {
    const response = await apiClient.post('/work-suite/calendar-events', data);
    return response.data.data;
  }

  async updateCalendarEvent(id: string, data: Partial<Pick<CalendarEvent, 'title' | 'description' | 'startDate' | 'endDate' | 'allDay' | 'startTime' | 'endTime'>>): Promise<CalendarEvent> {
    const response = await apiClient.put(`/work-suite/calendar-events/${id}`, data);
    return response.data.data;
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    await apiClient.delete(`/work-suite/calendar-events/${id}`);
  }

  // Finance (personal income/expense tracker)
  async listFinanceEntries(): Promise<FinanceEntry[]> {
    const response = await apiClient.get('/work-suite/finance-entries');
    return response.data.data || [];
  }

  async createFinanceEntry(data: { type: FinanceEntryType; amount: number; description: string; category?: string; status?: FinanceEntryStatus; date: string; notes?: string }): Promise<FinanceEntry> {
    const response = await apiClient.post('/work-suite/finance-entries', data);
    return response.data.data;
  }

  async updateFinanceEntry(id: string, data: Partial<Pick<FinanceEntry, 'type' | 'amount' | 'description' | 'category' | 'status' | 'date' | 'notes'>>): Promise<FinanceEntry> {
    const response = await apiClient.put(`/work-suite/finance-entries/${id}`, data);
    return response.data.data;
  }

  async deleteFinanceEntry(id: string): Promise<void> {
    await apiClient.delete(`/work-suite/finance-entries/${id}`);
  }

  // Bank connections (Plaid)
  async getPlaidStatus(): Promise<{ configured: boolean }> {
    const response = await apiClient.get('/work-suite/plaid/status');
    return response.data.data;
  }

  async createPlaidLinkToken(): Promise<string> {
    const response = await apiClient.post('/work-suite/plaid/link-token');
    return response.data.data.linkToken;
  }

  async exchangePlaidPublicToken(publicToken: string): Promise<BankConnection> {
    const response = await apiClient.post('/work-suite/plaid/exchange-token', { publicToken });
    return response.data.data;
  }

  async listBankConnections(): Promise<BankConnection[]> {
    const response = await apiClient.get('/work-suite/plaid/connections');
    return response.data.data || [];
  }

  async listBankTransactions(days = 30): Promise<BankTransaction[]> {
    const response = await apiClient.get('/work-suite/plaid/transactions', { params: { days } });
    return response.data.data || [];
  }

  async removeBankConnection(id: string): Promise<void> {
    await apiClient.delete(`/work-suite/plaid/connections/${id}`);
  }

  // Work Profile (private CV, used for job applications)
  async getWorkProfile(): Promise<WorkProfile> {
    const response = await apiClient.get('/work-suite/work-profile');
    return response.data.data;
  }

  async updateWorkProfile(data: Partial<WorkProfile>): Promise<WorkProfile> {
    const response = await apiClient.put('/work-suite/work-profile', data);
    return response.data.data;
  }

  // CV Documents — same UserFile model as personal Files, scoped to the
  // CV_DOCUMENT category so they stay out of the general Files list.
  async listCvDocuments(): Promise<UserFile[]> {
    const response = await apiClient.get('/work-suite/cv-documents');
    return response.data.data || [];
  }

  async uploadCvDocument(file: File, onProgress?: (percent: number) => void): Promise<UserFile> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/work-suite/cv-documents', formData, {
      headers: { 'Content-Type': undefined },
      onUploadProgress: onProgress
        ? (e: { loaded: number; total?: number }) => {
            if (e.total) onProgress(Math.round((e.loaded / e.total) * 100));
          }
        : undefined,
    });
    return response.data.data;
  }

  // Achievements
  async listAchievements(): Promise<Achievement[]> {
    const response = await apiClient.get('/work-suite/achievements');
    return response.data.data || [];
  }

  async createAchievement(data: { title: string; description?: string; category?: string; achievedAt?: string }): Promise<Achievement> {
    const response = await apiClient.post('/work-suite/achievements', data);
    return response.data.data;
  }

  async deleteAchievement(id: string): Promise<void> {
    await apiClient.delete(`/work-suite/achievements/${id}`);
  }

  // Notes
  async listNotes(): Promise<Note[]> {
    const response = await apiClient.get('/work-suite/notes');
    return response.data.data || [];
  }

  async createNote(data: {
    type?: NoteType;
    title?: string;
    content: string;
    color?: string;
    shape?: NoteShape;
    fontSize?: NoteFontSize;
    posX?: number;
    posY?: number;
    parentId?: string;
  }): Promise<Note> {
    const response = await apiClient.post('/work-suite/notes', data);
    return response.data.data;
  }

  async updateNote(id: string, data: Partial<Pick<Note, 'title' | 'content' | 'pinned' | 'color' | 'shape' | 'fontSize' | 'posX' | 'posY'>>): Promise<Note> {
    const response = await apiClient.put(`/work-suite/notes/${id}`, data);
    return response.data.data;
  }

  async deleteNote(id: string): Promise<void> {
    await apiClient.delete(`/work-suite/notes/${id}`);
  }

  // Files
  async listFiles(folderId?: string | null): Promise<UserFile[]> {
    const response = await apiClient.get('/work-suite/files', { params: folderId ? { folderId } : undefined });
    return response.data.data || [];
  }

  async uploadFile(file: File, folderId?: string | null, onProgress?: (percent: number) => void): Promise<UserFile> {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    const response = await apiClient.post('/work-suite/files', formData, {
      // The api client's default 'Content-Type: application/json' header
      // makes axios JSON-serialize FormData bodies (dropping the actual file
      // content) unless explicitly unset here, letting it fall through to
      // multipart/form-data with the correct boundary instead.
      headers: { 'Content-Type': undefined },
      onUploadProgress: onProgress
        ? (e: { loaded: number; total?: number }) => {
            if (e.total) onProgress(Math.round((e.loaded / e.total) * 100));
          }
        : undefined,
    });
    return response.data.data;
  }

  async getFileDownloadUrl(id: string): Promise<string> {
    const response = await apiClient.get(`/work-suite/files/${id}/download`);
    return response.data.data.url;
  }

  async deleteFile(id: string): Promise<void> {
    await apiClient.delete(`/work-suite/files/${id}`);
  }

  // Folders
  async listFolders(parentId?: string | null): Promise<UserFolder[]> {
    const response = await apiClient.get('/work-suite/folders', { params: parentId ? { parentId } : undefined });
    return response.data.data || [];
  }

  async createFolder(name: string, parentId?: string | null): Promise<UserFolder> {
    const response = await apiClient.post('/work-suite/folders', { name, parentId });
    return response.data.data;
  }

  async deleteFolder(id: string): Promise<void> {
    await apiClient.delete(`/work-suite/folders/${id}`);
  }
}

export const workSuiteService = new WorkSuiteService();

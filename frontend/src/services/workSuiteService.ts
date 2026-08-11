import { apiClient } from './api';

export interface WorkSuiteSummary {
  activeProjects: number;
  openTasks: number;
  clients: number;
  outstandingInvoices: number;
  outstandingAmount: number;
  activeGoals: number;
  achievements: number;
  recentAchievements: Achievement[];
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

export interface Achievement {
  id: string;
  title: string;
  description?: string;
  category?: string;
  achievedAt: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title?: string;
  content: string;
  pinned: boolean;
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

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  title: string;
  amount: number;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
  clientId?: string;
  client?: { id: string; name: string } | null;
  issueDate: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
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

  // Clients
  async listClients(): Promise<Client[]> {
    const response = await apiClient.get('/work-suite/clients');
    return response.data.data || [];
  }

  async createClient(data: { name: string; email?: string; phone?: string; company?: string; notes?: string }): Promise<Client> {
    const response = await apiClient.post('/work-suite/clients', data);
    return response.data.data;
  }

  async updateClient(id: string, data: Partial<Pick<Client, 'name' | 'email' | 'phone' | 'company' | 'notes'>>): Promise<Client> {
    const response = await apiClient.put(`/work-suite/clients/${id}`, data);
    return response.data.data;
  }

  async deleteClient(id: string): Promise<void> {
    await apiClient.delete(`/work-suite/clients/${id}`);
  }

  // Invoices
  async listInvoices(): Promise<Invoice[]> {
    const response = await apiClient.get('/work-suite/invoices');
    return response.data.data || [];
  }

  async createInvoice(data: { title: string; amount: number; currency?: string; clientId?: string; dueDate?: string }): Promise<Invoice> {
    const response = await apiClient.post('/work-suite/invoices', data);
    return response.data.data;
  }

  async updateInvoice(id: string, data: Partial<Pick<Invoice, 'title' | 'amount' | 'currency' | 'clientId' | 'dueDate'>>): Promise<Invoice> {
    const response = await apiClient.put(`/work-suite/invoices/${id}`, data);
    return response.data.data;
  }

  async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<Invoice> {
    const response = await apiClient.patch(`/work-suite/invoices/${id}/status`, { status });
    return response.data.data;
  }

  async deleteInvoice(id: string): Promise<void> {
    await apiClient.delete(`/work-suite/invoices/${id}`);
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

  async createNote(data: { title?: string; content: string }): Promise<Note> {
    const response = await apiClient.post('/work-suite/notes', data);
    return response.data.data;
  }

  async updateNote(id: string, data: Partial<Pick<Note, 'title' | 'content' | 'pinned'>>): Promise<Note> {
    const response = await apiClient.put(`/work-suite/notes/${id}`, data);
    return response.data.data;
  }

  async deleteNote(id: string): Promise<void> {
    await apiClient.delete(`/work-suite/notes/${id}`);
  }
}

export const workSuiteService = new WorkSuiteService();

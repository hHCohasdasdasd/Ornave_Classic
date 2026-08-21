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
  // Set only for events created from a table reservation — the calendar
  // modal uses this to decide whether to show the Automatic Check-In panel.
  tableReservationId?: string | null;
}

export type AutoCheckInBlockingStep = 'TIER' | 'PROFILE' | 'BANK' | null;

export interface AutoCheckInEligibility {
  eligible: boolean;
  profileComplete: boolean;
  tierOk: boolean;
  bankVerified: boolean;
  // Three hard, sequential gates — the first one (in tier -> profile -> bank
  // order) that isn't satisfied yet, or null once all three are.
  nextStep: AutoCheckInBlockingStep;
}

export interface CheckInProfile {
  legalFirstName?: string | null;
  legalLastName?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  // Resolved server-side to a short-lived signed URL — never a raw storage
  // key, since the bucket is private.
  photoUrl?: string | null;
}

export interface TableReservationDetail {
  id: string;
  tableId: string;
  companyId: string;
  partySize: number;
  reservationTime: string;
  note?: string | null;
  status: string;
  autoCheckInEnabled: boolean;
  checkedInAt?: string | null;
  table: { label: string; seats: number };
  company: { name: string };
}

export interface CompanyReservation {
  id: string;
  tableId: string;
  companyId: string;
  partySize: number;
  reservationTime: string;
  note?: string | null;
  status: string;
  autoCheckInEnabled: boolean;
  checkedInAt?: string | null;
  createdAt: string;
  table: { label: string; seats: number };
  guestName: string;
  guestPhone?: string | null;
  guestEmail?: string | null;
  guestNotes?: string | null;
  // Only ever set when autoCheckInEnabled is true — a signed URL, minted
  // fresh per request, not stored.
  guestPhotoUrl?: string | null;
  // Whatever the guest has ordered from the table-side QR page.
  orderItems?: { id: string; menuItemId: string | null; name: string; price: string; quantity: number; note?: string | null; createdAt: string }[];
  orderTotal?: number;
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

export type ManualOrderType = 'ORDER' | 'INVOICE';
export type ManualOrderStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface ManualOrder {
  id: string;
  type: ManualOrderType;
  vendor: string;
  description?: string;
  amount: number;
  currency: string;
  status: ManualOrderStatus;
  date: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type BankAccountVerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'FAILED';

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
  verificationStatus: BankAccountVerificationStatus;
  verifiedAt?: string | null;
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

export type MenuItemStation = 'KITCHEN' | 'BAR';

export interface MenuItem {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  price: string;
  category: string;
  isAvailable: boolean;
  sortOrder: number;
  station: MenuItemStation;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StationOrderItem {
  id: string;
  name: string;
  quantity: number;
  note?: string | null;
  status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED';
  printedAt?: string | null;
  createdAt: string;
  tableLabel: string;
  partySize: number;
  // 'table' = dine-in/QR order (tableLabel is an actual table). 'bar-tab' =
  // a Bar Orders tab (tableLabel is the tab's own label, e.g. "Stool 3" —
  // never prefix "Table " onto it).
  source: 'table' | 'bar-tab';
}

export type PrinterStation = 'KITCHEN' | 'BAR' | 'RESERVATIONS';
export type PrintMethod = 'USB' | 'BROWSER';

export interface PrinterSettings {
  printMethod: PrintMethod;
  autoPrint: boolean;
}

export interface ReceiptSettings {
  headerText: string;
  footerText: string;
}

export type PosActionId = 'check-functions' | 'discount' | 'service-charge' | 'payments';

export interface PosLayout {
  order: PosActionId[];
}

export interface ServerOrderTable {
  id: string;
  label: string;
  seats: number;
  active: {
    reservationId: string;
    partySize: number;
    guestName: string | null;
    isWalkIn: boolean;
    itemCount: number;
    total: number;
  } | null;
}

export type OrderItemStatus = 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'VOID';
export type DiscountType = 'PERCENT' | 'FIXED';
export type PaymentMethod = 'CASH' | 'CARD' | 'CARD_READER';

export interface PaymentsStatus {
  connected: boolean;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  hasTerminalLocation: boolean;
}

export interface TerminalReader {
  id: string;
  label: string;
  deviceType: string;
  status: string;
}

export interface TerminalAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface TerminalCharge {
  paymentIntentId: string;
  readerId: string;
}
export type PaymentStatus = 'UNPAID' | 'PAID';
export type OrderStatus = 'CONFIRMED' | 'CANCELLED' | 'CLOSED';

export interface ServerOrderItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
  note?: string | null;
  station: MenuItemStation;
  status: OrderItemStatus;
  voidReason?: string | null;
  voidedAt?: string | null;
  checkId?: string | null;
  printedAt?: string | null;
  createdAt: string;
}

export interface ServerOrderCheck {
  id: string;
  label: string;
  items: ServerOrderItem[];
  subtotal: number;
  discountAmount: number;
  serviceChargeAmount: number;
  total: number;
  discountType: DiscountType | null;
  discountValue: number | null;
  discountLabel: string | null;
  serviceChargeType: DiscountType | null;
  serviceChargeValue: number | null;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  paidAt: string | null;
}

export interface ServerOrder {
  reservationId: string;
  partySize: number;
  guestName: string | null;
  isWalkIn: boolean;
  status: OrderStatus;
  items: ServerOrderItem[];
  checks: ServerOrderCheck[] | null;
  unassignedItems?: ServerOrderItem[];
  subtotal: number;
  discountAmount?: number;
  serviceChargeAmount?: number;
  total: number;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  discountLabel?: string | null;
  serviceChargeType?: DiscountType | null;
  serviceChargeValue?: number | null;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod | null;
  paidAt?: string | null;
}

export type BarTabStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';

export interface BarTabItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
  note?: string | null;
  status: OrderItemStatus;
  voidReason?: string | null;
  voidedAt?: string | null;
  checkId?: string | null;
  createdAt: string;
}

export interface BarTabCheck {
  id: string;
  label: string;
  items: BarTabItem[];
  subtotal: number;
  discountAmount: number;
  serviceChargeAmount: number;
  total: number;
  discountType: DiscountType | null;
  discountValue: number | null;
  discountLabel: string | null;
  serviceChargeType: DiscountType | null;
  serviceChargeValue: number | null;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  paidAt: string | null;
}

export interface BarTab {
  tabId: string;
  label: string;
  status: BarTabStatus;
  items: BarTabItem[];
  checks: BarTabCheck[] | null;
  unassignedItems?: BarTabItem[];
  subtotal: number;
  discountAmount?: number;
  serviceChargeAmount?: number;
  total: number;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  discountLabel?: string | null;
  serviceChargeType?: DiscountType | null;
  serviceChargeValue?: number | null;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod | null;
  paidAt?: string | null;
}

export interface OpenBarTabSummary {
  id: string;
  label: string;
  itemCount: number;
  total: number;
}

export interface BarStoolStatus {
  id: string;
  label: string;
  active: { tabId: string; itemCount: number; total: number } | null;
}

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
export type TableShape = 'round' | 'square' | 'rectangle' | 'half-circle';

export interface RestaurantTable {
  id: string;
  companyId: string;
  label: string;
  seats: number;
  shape: TableShape;
  status: TableStatus;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}

export interface FloorPlanChair {
  id: string;
  companyId: string;
  positionX: number;
  positionY: number;
  rotation: number;
  createdAt: string;
  updatedAt: string;
}

export interface BarStool {
  id: string;
  companyId: string;
  label: string;
  positionX: number;
  positionY: number;
  rotation: number;
  createdAt: string;
  updatedAt: string;
}

export type WallShape = 'line' | 'circle';

export interface FloorPlanWall {
  id: string;
  companyId: string;
  shape: WallShape;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  radius: number | null;
  curveX: number | null;
  curveY: number | null;
  createdAt: string;
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

  // Manual orders/invoices (Orders & Invoices tab)
  async listManualOrders(): Promise<ManualOrder[]> {
    const response = await apiClient.get('/work-suite/manual-orders');
    return response.data.data || [];
  }

  async createManualOrder(data: { type: ManualOrderType; vendor: string; description?: string; amount: number; currency?: string; status?: ManualOrderStatus; date: string; trackingNumber?: string; notes?: string }): Promise<ManualOrder> {
    const response = await apiClient.post('/work-suite/manual-orders', data);
    return response.data.data;
  }

  async updateManualOrder(id: string, data: Partial<Pick<ManualOrder, 'type' | 'vendor' | 'description' | 'amount' | 'currency' | 'status' | 'date' | 'trackingNumber' | 'notes'>>): Promise<ManualOrder> {
    const response = await apiClient.put(`/work-suite/manual-orders/${id}`, data);
    return response.data.data;
  }

  async deleteManualOrder(id: string): Promise<void> {
    await apiClient.delete(`/work-suite/manual-orders/${id}`);
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

  async verifyBankAccount(accountId: string): Promise<BankAccount> {
    const response = await apiClient.post(`/work-suite/plaid/accounts/${accountId}/verify`);
    return response.data.data;
  }

  async getAutoCheckInEligibility(): Promise<AutoCheckInEligibility> {
    const response = await apiClient.get('/work-suite/auto-check-in/eligibility');
    return response.data.data;
  }

  // Payments — Stripe Connect (the company's own account) + Stripe
  // Terminal (physical card readers), for guests who won't pay via
  // Automatic Check-In.
  async getPaymentsStatus(): Promise<PaymentsStatus> {
    const response = await apiClient.get('/work-suite/payments/status');
    return response.data.data;
  }

  async connectPayments(): Promise<{ url: string }> {
    const response = await apiClient.post('/work-suite/payments/connect');
    return response.data.data;
  }

  async openPaymentsDashboard(): Promise<{ url: string }> {
    const response = await apiClient.post('/work-suite/payments/dashboard');
    return response.data.data;
  }

  async disconnectPayments(): Promise<void> {
    await apiClient.post('/work-suite/payments/disconnect');
  }

  async setupTerminalLocation(address: TerminalAddress): Promise<{ locationId: string }> {
    const response = await apiClient.post('/work-suite/payments/terminal/location', address);
    return response.data.data;
  }

  async listTerminalReaders(): Promise<TerminalReader[]> {
    const response = await apiClient.get('/work-suite/payments/terminal/readers');
    return response.data.data || [];
  }

  async registerTerminalReader(registrationCode: string, label: string): Promise<TerminalReader> {
    const response = await apiClient.post('/work-suite/payments/terminal/readers', { registrationCode, label });
    return response.data.data;
  }

  async removeTerminalReader(id: string): Promise<void> {
    await apiClient.delete(`/work-suite/payments/terminal/readers/${id}`);
  }

  async cancelTerminalReaderAction(id: string): Promise<void> {
    await apiClient.post(`/work-suite/payments/terminal/readers/${id}/cancel`);
  }

  async getTerminalPaymentIntentStatus(id: string): Promise<{ status: string }> {
    const response = await apiClient.get(`/work-suite/payments/terminal/payment-intents/${id}`);
    return response.data.data;
  }

  async listCompanyReservations(): Promise<CompanyReservation[]> {
    const response = await apiClient.get('/work-suite/reservations');
    return response.data.data || [];
  }

  async checkInReservation(id: string): Promise<CompanyReservation> {
    const response = await apiClient.post(`/work-suite/reservations/${id}/check-in`);
    return response.data.data;
  }

  async cancelReservation(id: string): Promise<CompanyReservation> {
    const response = await apiClient.post(`/work-suite/reservations/${id}/cancel`);
    return response.data.data;
  }

  async generateNfcCard(): Promise<string> {
    const response = await apiClient.post('/work-suite/check-in-profile/nfc-card');
    return response.data.data.nfcToken;
  }

  /** Guest-arrival lookup for the host-stand kiosk — resolves to null on a
   * "no match" 404 rather than throwing, so the caller can show a plain
   * "not found" message instead of an error state. */
  async lookupArrival(params: { nfcToken?: string; phone?: string }): Promise<CompanyReservation | null> {
    try {
      const response = await apiClient.get('/work-suite/reservations/lookup', { params });
      return response.data.data;
    } catch {
      return null;
    }
  }

  async getCheckInProfile(): Promise<CheckInProfile | null> {
    const response = await apiClient.get('/work-suite/check-in-profile');
    return response.data.data;
  }

  async updateCheckInProfile(data: CheckInProfile): Promise<CheckInProfile> {
    const response = await apiClient.put('/work-suite/check-in-profile', data);
    return response.data.data;
  }

  async uploadCheckInPhoto(file: File): Promise<CheckInProfile> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/work-suite/check-in-profile/photo', formData, {
      headers: { 'Content-Type': undefined },
    });
    return response.data.data;
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

  // Menu (restaurant-layout companies)
  async listMenuItems(): Promise<MenuItem[]> {
    const response = await apiClient.get('/work-suite/menu');
    return response.data.data || [];
  }

  async createMenuItem(data: { name: string; description?: string; price: string; category?: string; sortOrder?: number; station?: MenuItemStation }): Promise<MenuItem> {
    const response = await apiClient.post('/work-suite/menu', data);
    return response.data.data;
  }

  async updateMenuItem(id: string, data: Partial<{ name: string; description: string; price: string; category: string; isAvailable: boolean; sortOrder: number; station: MenuItemStation }>): Promise<MenuItem> {
    const response = await apiClient.patch(`/work-suite/menu/${id}`, data);
    return response.data.data;
  }

  async listStationOrders(station: MenuItemStation): Promise<StationOrderItem[]> {
    const response = await apiClient.get('/work-suite/kitchen-orders', { params: { station } });
    return response.data.data || [];
  }

  async updateStationOrderStatus(id: string, status: StationOrderItem['status']): Promise<StationOrderItem> {
    const response = await apiClient.patch(`/work-suite/kitchen-orders/${id}/status`, { status });
    return response.data.data;
  }

  async markOrderItemPrinted(id: string): Promise<void> {
    await apiClient.patch(`/work-suite/kitchen-orders/${id}/printed`);
  }

  async getPrinterSettings(station: PrinterStation): Promise<PrinterSettings> {
    const response = await apiClient.get(`/work-suite/printer-settings/${station}`);
    return response.data.data;
  }

  async updatePrinterSettings(station: PrinterStation, data: Partial<PrinterSettings>): Promise<PrinterSettings> {
    const response = await apiClient.patch(`/work-suite/printer-settings/${station}`, data);
    return response.data.data;
  }

  async getReceiptSettings(): Promise<ReceiptSettings> {
    const response = await apiClient.get('/work-suite/receipt-settings');
    return response.data.data;
  }

  async updateReceiptSettings(data: ReceiptSettings): Promise<ReceiptSettings> {
    const response = await apiClient.patch('/work-suite/receipt-settings', data);
    return response.data.data;
  }

  async deleteMenuItem(id: string): Promise<void> {
    await apiClient.delete(`/work-suite/menu/${id}`);
  }

  async uploadMenuItemImage(id: string, file: File): Promise<MenuItem> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/work-suite/menu/${id}/image`, formData, {
      headers: { 'Content-Type': undefined },
    });
    return response.data.data;
  }

  async removeMenuItemImage(id: string): Promise<MenuItem> {
    const response = await apiClient.delete(`/work-suite/menu/${id}/image`);
    return response.data.data;
  }

  // Server ordering (staff placing orders directly for a table)
  async listServerOrderTables(): Promise<ServerOrderTable[]> {
    const response = await apiClient.get('/work-suite/server-orders/tables');
    return response.data.data || [];
  }

  async startWalkIn(tableId: string, data: { partySize?: number; guestName?: string; guestPhone?: string }): Promise<void> {
    await apiClient.post(`/work-suite/server-orders/tables/${tableId}/walk-in`, data);
  }

  async getServerOrder(tableId: string): Promise<ServerOrder | null> {
    const response = await apiClient.get(`/work-suite/server-orders/tables/${tableId}`);
    return response.data.data;
  }

  async addServerOrderItem(tableId: string, data: { menuItemId: string; quantity?: number; note?: string; checkId?: string }): Promise<ServerOrderItem> {
    const response = await apiClient.post(`/work-suite/server-orders/tables/${tableId}/items`, data);
    return response.data.data;
  }

  async removeServerOrderItem(tableId: string, itemId: string): Promise<void> {
    await apiClient.delete(`/work-suite/server-orders/tables/${tableId}/items/${itemId}`);
  }

  async voidServerOrderItem(tableId: string, itemId: string, reason?: string): Promise<ServerOrder> {
    const response = await apiClient.post(`/work-suite/server-orders/tables/${tableId}/items/${itemId}/void`, { reason });
    return response.data.data;
  }

  async cancelServerOrder(tableId: string, reason?: string): Promise<ServerOrder> {
    const response = await apiClient.post(`/work-suite/server-orders/tables/${tableId}/cancel`, { reason });
    return response.data.data;
  }

  async splitServerOrderCheck(tableId: string): Promise<ServerOrder> {
    const response = await apiClient.post(`/work-suite/server-orders/tables/${tableId}/split`, {});
    return response.data.data;
  }

  async addServerOrderCheck(tableId: string): Promise<ServerOrder> {
    const response = await apiClient.post(`/work-suite/server-orders/tables/${tableId}/checks`, {});
    return response.data.data;
  }

  async assignServerOrderItemToCheck(tableId: string, itemId: string, checkId: string): Promise<ServerOrder> {
    const response = await apiClient.patch(`/work-suite/server-orders/tables/${tableId}/items/${itemId}/check`, { checkId });
    return response.data.data;
  }

  async applyServerOrderDiscount(tableId: string, data: { type: DiscountType | null; value?: number; label?: string; checkId?: string }): Promise<ServerOrder> {
    const response = await apiClient.patch(`/work-suite/server-orders/tables/${tableId}/discount`, data);
    return response.data.data;
  }

  async applyServerOrderServiceCharge(tableId: string, data: { type: DiscountType | null; value?: number; checkId?: string }): Promise<ServerOrder> {
    const response = await apiClient.patch(`/work-suite/server-orders/tables/${tableId}/service-charge`, data);
    return response.data.data;
  }

  async recordServerOrderPayment(tableId: string, data: { method: PaymentMethod; checkId?: string }): Promise<ServerOrder> {
    const response = await apiClient.post(`/work-suite/server-orders/tables/${tableId}/payment`, data);
    return response.data.data;
  }

  async chargeServerOrderReader(tableId: string, data: { readerId: string; checkId?: string }): Promise<TerminalCharge> {
    const response = await apiClient.post(`/work-suite/server-orders/tables/${tableId}/terminal-payment`, data);
    return response.data.data;
  }

  async completeServerOrderReaderPayment(tableId: string, data: { paymentIntentId: string; checkId?: string }): Promise<ServerOrder> {
    const response = await apiClient.post(`/work-suite/server-orders/tables/${tableId}/terminal-payment/complete`, data);
    return response.data.data;
  }

  async updateServerOrderPartySize(tableId: string, partySize: number): Promise<ServerOrder> {
    const response = await apiClient.patch(`/work-suite/server-orders/tables/${tableId}/party-size`, { partySize });
    return response.data.data;
  }

  async getPosLayout(): Promise<PosLayout> {
    const response = await apiClient.get('/work-suite/pos-layout');
    return response.data.data;
  }

  async updatePosLayout(order: PosActionId[]): Promise<PosLayout> {
    const response = await apiClient.patch('/work-suite/pos-layout', { order });
    return response.data.data;
  }

  // Bar Orders (tab-based, not tied to a floor-plan table/seat)
  async listOpenBarTabs(): Promise<OpenBarTabSummary[]> {
    const response = await apiClient.get('/work-suite/bar-orders/tabs');
    return response.data.data || [];
  }

  async startBarTab(label: string, stoolId?: string): Promise<BarTab> {
    const response = await apiClient.post('/work-suite/bar-orders/tabs', { label, stoolId });
    return response.data.data;
  }

  async listBarStoolsWithStatus(): Promise<BarStoolStatus[]> {
    const response = await apiClient.get('/work-suite/bar-orders/stools');
    return response.data.data || [];
  }

  async getBarTab(tabId: string): Promise<BarTab | null> {
    const response = await apiClient.get(`/work-suite/bar-orders/tabs/${tabId}`);
    return response.data.data;
  }

  async addBarTabItem(tabId: string, data: { menuItemId: string; quantity?: number; note?: string; checkId?: string }): Promise<BarTabItem> {
    const response = await apiClient.post(`/work-suite/bar-orders/tabs/${tabId}/items`, data);
    return response.data.data;
  }

  async removeBarTabItem(tabId: string, itemId: string): Promise<void> {
    await apiClient.delete(`/work-suite/bar-orders/tabs/${tabId}/items/${itemId}`);
  }

  async voidBarTabItem(tabId: string, itemId: string, reason?: string): Promise<BarTab> {
    const response = await apiClient.post(`/work-suite/bar-orders/tabs/${tabId}/items/${itemId}/void`, { reason });
    return response.data.data;
  }

  async cancelBarTab(tabId: string, reason?: string): Promise<BarTab> {
    const response = await apiClient.post(`/work-suite/bar-orders/tabs/${tabId}/cancel`, { reason });
    return response.data.data;
  }

  async splitBarTabCheck(tabId: string): Promise<BarTab> {
    const response = await apiClient.post(`/work-suite/bar-orders/tabs/${tabId}/split`, {});
    return response.data.data;
  }

  async addBarTabCheck(tabId: string): Promise<BarTab> {
    const response = await apiClient.post(`/work-suite/bar-orders/tabs/${tabId}/checks`, {});
    return response.data.data;
  }

  async assignBarTabItemToCheck(tabId: string, itemId: string, checkId: string): Promise<BarTab> {
    const response = await apiClient.patch(`/work-suite/bar-orders/tabs/${tabId}/items/${itemId}/check`, { checkId });
    return response.data.data;
  }

  async applyBarTabDiscount(tabId: string, data: { type: DiscountType | null; value?: number; label?: string; checkId?: string }): Promise<BarTab> {
    const response = await apiClient.patch(`/work-suite/bar-orders/tabs/${tabId}/discount`, data);
    return response.data.data;
  }

  async applyBarTabServiceCharge(tabId: string, data: { type: DiscountType | null; value?: number; checkId?: string }): Promise<BarTab> {
    const response = await apiClient.patch(`/work-suite/bar-orders/tabs/${tabId}/service-charge`, data);
    return response.data.data;
  }

  async recordBarTabPayment(tabId: string, data: { method: PaymentMethod; checkId?: string }): Promise<BarTab> {
    const response = await apiClient.post(`/work-suite/bar-orders/tabs/${tabId}/payment`, data);
    return response.data.data;
  }

  async chargeBarTabReader(tabId: string, data: { readerId: string; checkId?: string }): Promise<TerminalCharge> {
    const response = await apiClient.post(`/work-suite/bar-orders/tabs/${tabId}/terminal-payment`, data);
    return response.data.data;
  }

  async completeBarTabReaderPayment(tabId: string, data: { paymentIntentId: string; checkId?: string }): Promise<BarTab> {
    const response = await apiClient.post(`/work-suite/bar-orders/tabs/${tabId}/terminal-payment/complete`, data);
    return response.data.data;
  }

  // Floor plan (restaurant-layout companies)
  async listTables(): Promise<RestaurantTable[]> {
    const response = await apiClient.get('/work-suite/floor-plan/tables');
    return response.data.data || [];
  }

  async createTable(data: { label: string; seats?: number; shape?: TableShape; positionX?: number; positionY?: number }): Promise<RestaurantTable> {
    const response = await apiClient.post('/work-suite/floor-plan/tables', data);
    return response.data.data;
  }

  async updateTable(id: string, data: Partial<{ label: string; seats: number; shape: TableShape; status: TableStatus; positionX: number; positionY: number; width: number; height: number }>): Promise<RestaurantTable> {
    const response = await apiClient.patch(`/work-suite/floor-plan/tables/${id}`, data);
    return response.data.data;
  }

  async deleteTable(id: string): Promise<void> {
    await apiClient.delete(`/work-suite/floor-plan/tables/${id}`);
  }

  // Floor plan chairs
  async listChairs(): Promise<FloorPlanChair[]> {
    const response = await apiClient.get('/work-suite/floor-plan/chairs');
    return response.data.data || [];
  }

  async createChair(data: { positionX?: number; positionY?: number; rotation?: number } = {}): Promise<FloorPlanChair> {
    const response = await apiClient.post('/work-suite/floor-plan/chairs', data);
    return response.data.data;
  }

  async updateChair(id: string, data: Partial<{ positionX: number; positionY: number; rotation: number }>): Promise<FloorPlanChair> {
    const response = await apiClient.patch(`/work-suite/floor-plan/chairs/${id}`, data);
    return response.data.data;
  }

  async deleteChair(id: string): Promise<void> {
    await apiClient.delete(`/work-suite/floor-plan/chairs/${id}`);
  }

  async listStools(): Promise<BarStool[]> {
    const response = await apiClient.get('/work-suite/floor-plan/stools');
    return response.data.data || [];
  }

  async createStool(data: { positionX?: number; positionY?: number; rotation?: number } = {}): Promise<BarStool> {
    const response = await apiClient.post('/work-suite/floor-plan/stools', data);
    return response.data.data;
  }

  async updateStool(id: string, data: Partial<{ label: string; positionX: number; positionY: number; rotation: number }>): Promise<BarStool> {
    const response = await apiClient.patch(`/work-suite/floor-plan/stools/${id}`, data);
    return response.data.data;
  }

  async deleteStool(id: string): Promise<void> {
    await apiClient.delete(`/work-suite/floor-plan/stools/${id}`);
  }

  // Floor plan walls (the sketched outline)
  async listWalls(): Promise<FloorPlanWall[]> {
    const response = await apiClient.get('/work-suite/floor-plan/walls');
    return response.data.data || [];
  }

  async createWall(data: { shape?: WallShape; x1: number; y1: number; x2: number; y2: number; radius?: number }): Promise<FloorPlanWall> {
    const response = await apiClient.post('/work-suite/floor-plan/walls', data);
    return response.data.data;
  }

  async deleteWall(id: string): Promise<void> {
    await apiClient.delete(`/work-suite/floor-plan/walls/${id}`);
  }

  async setWallCurve(id: string, curveX: number | null, curveY: number | null): Promise<FloorPlanWall> {
    const response = await apiClient.patch(`/work-suite/floor-plan/walls/${id}/curve`, { curveX, curveY });
    return response.data.data;
  }

  async clearWalls(): Promise<void> {
    await apiClient.delete('/work-suite/floor-plan/walls');
  }
}

export const workSuiteService = new WorkSuiteService();

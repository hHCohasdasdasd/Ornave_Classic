// Auth Types
export type UserType = 'USER' | 'COMPANY_USER';

export interface User {
  id: string;
  memberNumber?: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'OWNER' | 'ADMIN' | 'EMPLOYEE' | 'USER';
  userType: UserType;
  companyId?: string | null;
  createdAt: string;
  isPlatformAdmin?: boolean;
  twoFactorEnabled?: boolean;
  headline?: string;
  bio?: string;
  website?: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  token: string;
  description: string;
  website: string;
  logo?: string;
  bannerUrl?: string;
  deactivated?: boolean;
  isActive?: boolean;
  // Drives which profile layout the company gets — see
  // frontend/src/utils/businessType.ts. Chosen at registration.
  industry?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
    company: Company | null;
  };
  message: string;
}

// Ornave Global Types
export interface UserProfile {
  id: string;
  userId: string;
  displayName?: string;
  phone?: string;
  avatarUrl?: string;
  address?: string;
  preferences?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UserCompanyConnection {
  id: string;
  userId: string;
  companyId: string;
  relationshipType: string;
  status: 'PENDING' | 'ACTIVE' | 'REVOKED';
  permissions: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface GlobalRequest {
  id: string;
  userId: string;
  companyId: string;
  type: string;
  title: string;
  description: string;
  metadata: Record<string, any>;
  attachedFiles: string[];
  preferredDates: string[];
  status: string;
  statusHistory: Array<{ status: string; timestamp: string; reason?: string }>;
  linkedErpObjectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserDocument {
  id: string;
  userId: string;
  companyId: string;
  fileUrl: string;
  type: string;
  visibility: string;
  uploadedBy: string;
  createdAt: string;
}

export interface GlobalPayment {
  id: string;
  userId: string;
  companyId: string;
  erpInvoiceId?: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  createdAt: string;
}

// Module Types
export interface Module {
  id: string;
  companyId: string;
  name: string;
  description: string;
  icon: string;
  visible: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Page Types
export interface Page {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  description: string;
  layout: Record<string, any>;
  published: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Connection Types
export interface Connection {
  id: string;
  fromCompanyId: string;
  toCompanyId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
  requestMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// Transaction Types
export interface Transaction {
  id: string;
  fromCompanyId: string;
  toCompanyId: string;
  type: 'ORDER' | 'PAYMENT' | 'SHIPMENT' | 'INVOICE' | 'QUOTE' | 'CUSTOM';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  reference: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Message Types
export interface Message {
  id: string;
  fromCompanyId: string;
  toCompanyId: string;
  subject?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  message: string;
  timestamp: string;
  data: null;
}

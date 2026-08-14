// Discovery Types for Personal Home Page

export interface UserProfile {
  id: string;
  memberNumber?: number;
  firstName: string;
  lastName: string;
  email: string;
  headline?: string;
  location?: string;
  bio?: string;
  profilePicture?: string;
  bannerUrl?: string;
  website?: string;
  mutualConnections?: number;
  isConnected?: boolean;
  isPartnered?: boolean;
  partneredAt?: string;
}

export interface FirmProfile {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  industry?: string;
  location?: string;
  connectionCount?: number;
  isConnected?: boolean;
  isPartnered?: boolean;
}

export interface ConnectionRequest {
  id: string;
  user: UserProfile;
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface FirmConnection {
  id: string;
  name: string;
  headline?: string;
  location?: string;
}

export interface FirmConnectionFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedByCompany: boolean;
  createdAt: string;
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface Ticket {
  id: string;
  connectionId: string;
  subject: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  senderIsCompany: boolean;
  content: string;
  createdAt: string;
}

export interface TicketWithMessages extends Ticket {
  messages: TicketMessage[];
}

export interface DirectMessage {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface DirectMessageUser {
  id: string;
  firstName: string;
  lastName: string;
}

export interface DirectConversation {
  counterpart: DirectMessageUser;
  lastMessage: DirectMessage;
  unreadCount: number;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  actionRoute?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface DiscoveryFilters {
  industry?: string;
  location?: string;
  search?: string;
}

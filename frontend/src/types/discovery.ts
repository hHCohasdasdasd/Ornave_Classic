// Discovery Types for Personal Home Page

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  headline?: string;
  location?: string;
  bio?: string;
  profilePicture?: string;
  mutualConnections?: number;
  isConnected?: boolean;
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
}

export interface ConnectionRequest {
  id: string;
  user: UserProfile;
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface DiscoveryFilters {
  industry?: string;
  location?: string;
  search?: string;
}

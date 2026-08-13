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
  companyId: string;
  relationshipType: string;
  status: 'PENDING' | 'ACTIVE' | 'REVOKED';
  company: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo?: string;
    industry?: string;
  };
}

export interface DiscoveryFilters {
  industry?: string;
  location?: string;
  search?: string;
}

export interface FirmService {
  title: string;
  description: string;
}

export interface FirmTeamMember {
  name: string;
  role: string;
  avatar: string;
  profileSlug?: string;
}

export interface FirmJob {
  id: string;
  title: string;
  location: string;
  type: string;
}

export interface FirmLocation {
  city: string;
  address: string;
  type: string;
}

export interface FirmInsightsData {
  employeeGrowth: string;
  avgTenure: string;
}

export interface FirmPortfolioItem {
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  result?: string;
}

export interface FirmResource {
  title: string;
  type: 'WHITEPAPER' | 'CATALOG' | 'CASE_STUDY' | 'TECHNICAL';
  description: string;
  downloadUrl?: string;
}

export interface FirmSubscription {
  name: string;
  price: number;
  interval: 'MONTHLY' | 'ANNUAL';
  features: string[];
  isPopular?: boolean;
}

export interface FirmPost {
  id: string;
  title?: string;
  content: string;
  timestamp: string;
  reactions?: { likes: number; comments: number };
  mediaUrl?: string;
}

export interface FirmProfileData {
  id: string;
  name: string;
  bio: string;
  tagline?: string;
  firmType?: 'PRODUCT' | 'SERVICE';
  foundedYear?: number;
  employeeCount?: string;
  posts?: FirmPost[];
  services: FirmService[];
  team: FirmTeamMember[];
  jobs: FirmJob[];
  locations: FirmLocation[];
  insights: FirmInsightsData;
  followersCount: number;
  portfolio?: FirmPortfolioItem[];
  resources?: FirmResource[];
  subscriptions?: FirmSubscription[];
}

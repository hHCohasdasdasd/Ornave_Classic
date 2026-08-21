export interface FirmService {
  title: string;
  description: string;
}

export interface FirmTeamMember {
  name: string;
  role: string;
  avatar: string;
  profileSlug?: string;
  directReports?: FirmTeamMember[];
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

export interface FirmRecognition {
  id: string;
  label: string;
  sublabel?: string;
}

export interface FirmMilestone {
  id: string;
  period: string;
  title: string;
  org: string;
}

export interface FirmMenuItem {
  id: string;
  name: string;
  description?: string;
  price: string;
  category: string;
  imageUrl?: string;
  // Only ever false when fetched with includeUnavailable (the ordering
  // page) — the default public-profile fetch never returns unavailable
  // items in the first place, so this is always true there.
  isAvailable?: boolean;
}

export interface FirmFloorPlanTable {
  id: string;
  label: string;
  seats: number;
  shape: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
}

export interface FirmFloorPlanChair {
  id: string;
  positionX: number;
  positionY: number;
}

export interface FirmFloorPlanWall {
  id: string;
  shape: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  radius?: number;
  curveX?: number;
  curveY?: number;
}

export interface FirmFloorPlan {
  tables: FirmFloorPlanTable[];
  chairs: FirmFloorPlanChair[];
  walls: FirmFloorPlanWall[];
}

export interface FirmTableAvailabilitySlot {
  id: string;
  reservationTime: string;
  partySize: number;
}

export interface FirmTableOrderItem {
  id: string;
  menuItemId: string | null;
  name: string;
  price: string;
  quantity: number;
  note?: string | null;
  createdAt: string;
}

export interface FirmTableOrder {
  reservationId: string;
  partySize: number;
  items: FirmTableOrderItem[];
  total: number;
}

export interface FirmMyReservation {
  id: string;
  tableId: string;
  table: { label: string };
  reservationTime: string;
  partySize: number;
  note?: string | null;
  status: string;
}

export interface FirmPropertyListing {
  id: string;
  address: string;
  city: string;
  price: string;
  beds: number;
  baths: number;
  sqft: number;
  status: 'For Sale' | 'For Rent' | 'Sold' | 'Pending';
  imageUrl?: string;
}

export interface FirmProfileData {
  id: string;
  name: string;
  bio: string;
  tagline?: string;
  industry?: string;
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
  recognitions?: FirmRecognition[];
  milestones?: FirmMilestone[];
  partnerSlugs?: string[];
  menu?: FirmMenuItem[];
  listings?: FirmPropertyListing[];
  floorPlan?: FirmFloorPlan;
}

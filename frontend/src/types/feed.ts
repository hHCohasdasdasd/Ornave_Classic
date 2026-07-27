// Feed Types for Personal Home Page

export type FeedItemType = 
  | 'post'
  | 'connection'
  | 'transaction'
  | 'announcement'
  | 'mention';

export interface FeedAuthor {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  headline?: string;
}

export interface ServiceCard {
  id: string;
  name: string;
  price: number;
  currency: string;
  firmName: string;
  firmId: string;
  description?: string;
  imageUrl?: string;
}

export interface LinkedPublication {
  id: string;
  title: string;
  coverImage?: string | null;
  tags: string[];
  authorName: string;
}

export interface Mention {
  id: string;
  type: 'user' | 'company';
  name: string;
  avatarUrl?: string;
  // For type 'user' this is the real user id (unambiguous even when two
  // people share a name); for type 'company' it's the company's unique slug.
  slug?: string;
}

// Search-result shape used only while picking who to tag — carries enough
// detail for a small preview card, plus whether they're already in the
// tagging user's network, so a duplicate name can be told apart.
export interface MentionCandidate extends Mention {
  headline?: string;
  bio?: string;
  location?: string;
  companyName?: string;
  isConnection?: boolean;
}

export interface FeedItem {
  id: string;
  type: FeedItemType;
  author: FeedAuthor;
  title?: string;
  content: string;
  mediaUrl?: string;
  timestamp: string;
  reactions?: {
    likes: number;
    comments: number;
  };
  metadata?: {
    connectionName?: string;
    transactionAmount?: number;
    firmName?: string;
    serviceCard?: ServiceCard;
  };
  linkedPublication?: LinkedPublication | null;
  mentions?: Mention[];
}

export interface FeedResponse {
  items: FeedItem[];
  hasMore: boolean;
  cursor?: string;
}

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
}

export interface FeedResponse {
  items: FeedItem[];
  hasMore: boolean;
  cursor?: string;
}

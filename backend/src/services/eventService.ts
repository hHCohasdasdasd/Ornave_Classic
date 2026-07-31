import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EventMediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface CreateEventRequest {
  authorId: string;
  title: string;
  description?: string;
  detailedDescription?: string;
  coverImage?: string;
  media?: EventMediaItem[];
  category?: string;
  startAt: Date;
  endAt?: Date;
  isVirtual?: boolean;
  location?: string;
  mapUrl?: string;
  externalLink?: string;
  price?: number;
  currency?: string;
  capacity?: number;
  ticketProductId?: string;
  isPromoted?: boolean;
}

export interface TicketProductSummary {
  id: string;
  companyId: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  stock: number;
}

export interface EventResponse {
  id: string;
  authorId: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    headline?: string;
    profilePicture?: string;
    companyName?: string;
  };
  title: string;
  description: string | null;
  detailedDescription: string | null;
  coverImage: string | null;
  media: string;
  category: string | null;
  startAt: string;
  endAt: string | null;
  isVirtual: boolean;
  location: string | null;
  mapUrl: string | null;
  externalLink: string | null;
  price: number;
  currency: string;
  capacity: number | null;
  ticketProduct: TicketProductSummary | null;
  isPromoted: boolean;
  attendeeCount: number;
  interestedCount: number;
  myRsvp: string | null;
  isSaved: boolean;
  isActive: boolean;
  createdAt: string;
}

const AUTHOR_INCLUDE = {
  author: { include: { profile: true, company: true } },
  rsvps: true,
  saves: true,
  ticketProduct: true,
} as const;

export class EventService {
  static async createEvent(request: CreateEventRequest): Promise<EventResponse> {
    const media: EventMediaItem[] = request.media?.length
      ? request.media
      : request.coverImage
        ? [{ type: 'image', url: request.coverImage }]
        : [];

    const event = await prisma.event.create({
      data: {
        authorId: request.authorId,
        title: request.title,
        description: request.description,
        detailedDescription: request.detailedDescription,
        coverImage: request.coverImage || media[0]?.url,
        media: JSON.stringify(media),
        category: request.category,
        startAt: request.startAt,
        endAt: request.endAt,
        isVirtual: request.isVirtual || false,
        location: request.location,
        mapUrl: request.mapUrl,
        externalLink: request.externalLink,
        price: request.price || 0,
        currency: request.currency || 'USD',
        capacity: request.capacity,
        ticketProductId: request.ticketProductId,
        isPromoted: request.isPromoted || false,
        isActive: true,
      },
      include: AUTHOR_INCLUDE,
    });

    return this.formatEvent(event, request.authorId);
  }

  static async listEvents(options: { limit?: number; offset?: number; category?: string; when?: 'upcoming' | 'past'; viewerId?: string } = {}) {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const where: any = { isActive: true };
    if (options.category) where.category = options.category;
    if (options.when === 'upcoming') where.startAt = { gte: new Date() };
    if (options.when === 'past') where.startAt = { lt: new Date() };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: AUTHOR_INCLUDE,
        orderBy: { startAt: options.when === 'past' ? 'desc' : 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.event.count({ where }),
    ]);

    return {
      items: events.map((e) => this.formatEvent(e, options.viewerId)),
      total,
      hasMore: offset + limit < total,
    };
  }

  /** Promoted events firms are actively paying/pushing to surface — always
   * upcoming-only, ordered soonest-first, for the homepage-style carousel. */
  static async getPromotedEvents(limit: number = 8, viewerId?: string): Promise<EventResponse[]> {
    const events = await prisma.event.findMany({
      where: { isActive: true, isPromoted: true, startAt: { gte: new Date() } },
      include: AUTHOR_INCLUDE,
      orderBy: { startAt: 'asc' },
      take: limit,
    });
    return events.map((e) => this.formatEvent(e, viewerId));
  }

  static async getEvent(id: string, viewerId?: string): Promise<EventResponse | null> {
    const event = await prisma.event.findUnique({ where: { id }, include: AUTHOR_INCLUDE });
    if (!event || !event.isActive) return null;
    return this.formatEvent(event, viewerId);
  }

  static async getUserEvents(authorId: string): Promise<EventResponse[]> {
    const events = await prisma.event.findMany({
      where: { authorId, isActive: true },
      include: AUTHOR_INCLUDE,
      orderBy: { startAt: 'asc' },
    });
    return events.map((e) => this.formatEvent(e, authorId));
  }

  /** Events a user has RSVP'd to (any status). */
  static async getAttendingEvents(userId: string): Promise<EventResponse[]> {
    const rsvps = await prisma.eventRsvp.findMany({ where: { userId }, select: { eventId: true } });
    const eventIds = rsvps.map((r) => r.eventId);
    if (eventIds.length === 0) return [];

    const events = await prisma.event.findMany({
      where: { id: { in: eventIds }, isActive: true },
      include: AUTHOR_INCLUDE,
      orderBy: { startAt: 'asc' },
    });
    return events.map((e) => this.formatEvent(e, userId));
  }

  static async rsvp(eventId: string, userId: string, status: 'GOING' | 'INTERESTED'): Promise<EventResponse | null> {
    await prisma.eventRsvp.upsert({
      where: { eventId_userId: { eventId, userId } },
      update: { status },
      create: { eventId, userId, status },
    });
    return this.getEvent(eventId, userId);
  }

  static async cancelRsvp(eventId: string, userId: string): Promise<EventResponse | null> {
    await prisma.eventRsvp.deleteMany({ where: { eventId, userId } });
    return this.getEvent(eventId, userId);
  }

  static async saveEvent(eventId: string, userId: string): Promise<EventResponse | null> {
    await prisma.eventSave.upsert({
      where: { eventId_userId: { eventId, userId } },
      update: {},
      create: { eventId, userId },
    });
    return this.getEvent(eventId, userId);
  }

  static async unsaveEvent(eventId: string, userId: string): Promise<EventResponse | null> {
    await prisma.eventSave.deleteMany({ where: { eventId, userId } });
    return this.getEvent(eventId, userId);
  }

  static async getSavedEvents(userId: string): Promise<EventResponse[]> {
    const saves = await prisma.eventSave.findMany({ where: { userId }, select: { eventId: true } });
    const eventIds = saves.map((s) => s.eventId);
    if (eventIds.length === 0) return [];

    const events = await prisma.event.findMany({
      where: { id: { in: eventIds }, isActive: true },
      include: AUTHOR_INCLUDE,
      orderBy: { startAt: 'asc' },
    });
    return events.map((e) => this.formatEvent(e, userId));
  }

  static async validateTicketProduct(productId: string, companyId: string): Promise<boolean> {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { companyId: true } });
    return !!product && product.companyId === companyId;
  }

  static async deleteEvent(id: string, userId: string): Promise<boolean> {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event || event.authorId !== userId) {
      throw new Error('Unauthorized or event not found');
    }
    await prisma.event.update({ where: { id }, data: { isActive: false } });
    return true;
  }

  private static formatEvent(event: any, viewerId?: string): EventResponse {
    const rsvps: { userId: string; status: string }[] = event.rsvps || [];
    const attendeeCount = rsvps.filter((r) => r.status === 'GOING').length;
    const interestedCount = rsvps.filter((r) => r.status === 'INTERESTED').length;
    const myRsvp = viewerId ? (rsvps.find((r) => r.userId === viewerId)?.status || null) : null;
    const saves: { userId: string }[] = event.saves || [];
    const isSaved = viewerId ? saves.some((s) => s.userId === viewerId) : false;

    return {
      id: event.id,
      authorId: event.authorId,
      author: {
        id: event.author.id,
        firstName: event.author.firstName,
        lastName: event.author.lastName,
        headline: event.author.profile?.headline,
        profilePicture: event.author.profile?.avatarUrl,
        companyName: event.author.company?.name,
      },
      title: event.title,
      description: event.description,
      detailedDescription: event.detailedDescription,
      coverImage: event.coverImage,
      media: event.media || '[]',
      category: event.category,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt ? event.endAt.toISOString() : null,
      isVirtual: event.isVirtual,
      location: event.location,
      mapUrl: event.mapUrl,
      externalLink: event.externalLink,
      price: event.price,
      currency: event.currency,
      capacity: event.capacity,
      ticketProduct: event.ticketProduct
        ? {
            id: event.ticketProduct.id,
            companyId: event.ticketProduct.companyId,
            name: event.ticketProduct.name,
            price: event.ticketProduct.price,
            currency: event.ticketProduct.currency,
            imageUrl: event.ticketProduct.imageUrl,
            stock: event.ticketProduct.stock,
          }
        : null,
      isPromoted: event.isPromoted,
      attendeeCount,
      interestedCount,
      myRsvp,
      isSaved,
      isActive: event.isActive,
      createdAt: event.createdAt.toISOString(),
    };
  }
}

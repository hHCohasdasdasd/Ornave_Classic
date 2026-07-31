import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { EventService } from '../services/eventService';
import { ApiResponseHandler } from '../utils/apiResponse';

export const eventRoutes = Router();

/**
 * Create a new event
 * POST /api/events
 */
eventRoutes.post(
  '/',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const { title, description, detailedDescription, coverImage, media, category, startAt, endAt, isVirtual, location, mapUrl, externalLink, price, currency, capacity, ticketProductId, isPromoted } = req.body;

    if (!title || !startAt) {
      return ApiResponseHandler.error(res, 'Title and start date are required', undefined, 400);
    }

    // Only company accounts can host/create events.
    const canPromote = req.user.userType === 'COMPANY_USER' && !!req.user.companyId;
    if (!canPromote) {
      return ApiResponseHandler.error(res, 'Only firm accounts can create events', undefined, 403);
    }

    if (ticketProductId) {
      const isValidTicketProduct = await EventService.validateTicketProduct(ticketProductId, req.user.companyId);
      if (!isValidTicketProduct) {
        return ApiResponseHandler.error(res, 'Invalid ticket product', undefined, 400);
      }
    }

    const event = await EventService.createEvent({
      authorId: req.user.userId,
      title,
      description,
      detailedDescription,
      coverImage,
      media: Array.isArray(media) ? media : undefined,
      category,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : undefined,
      isVirtual: !!isVirtual,
      location,
      mapUrl,
      externalLink,
      price: price ? Number(price) : undefined,
      currency,
      capacity: capacity ? Number(capacity) : undefined,
      ticketProductId: ticketProductId || undefined,
      isPromoted: canPromote && !!isPromoted,
    });

    return ApiResponseHandler.success(res, event, 'Event created successfully', 201);
  })
);

/**
 * List events (browse)
 * GET /api/events
 */
eventRoutes.get(
  '/',
  asyncHandler(async (req: any, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const category = req.query.category as string;
    const when = req.query.when as 'upcoming' | 'past' | undefined;

    const result = await EventService.listEvents({ limit, offset, category, when, viewerId: req.user?.userId });
    return ApiResponseHandler.success(res, result, 'Events retrieved successfully', 200);
  })
);

/**
 * Events I'm hosting
 * GET /api/events/mine
 */
eventRoutes.get(
  '/mine',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    const events = await EventService.getUserEvents(req.user.userId);
    return ApiResponseHandler.success(res, events, 'Your events retrieved successfully', 200);
  })
);

/**
 * Events I'm attending / interested in
 * GET /api/events/attending
 */
eventRoutes.get(
  '/attending',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    const events = await EventService.getAttendingEvents(req.user.userId);
    return ApiResponseHandler.success(res, events, 'Your RSVPs retrieved successfully', 200);
  })
);

/**
 * Promoted upcoming events (firm-boosted), for the featured carousel
 * GET /api/events/promoted
 */
eventRoutes.get(
  '/promoted',
  asyncHandler(async (req: any, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 8;
    const events = await EventService.getPromotedEvents(limit, req.user?.userId);
    return ApiResponseHandler.success(res, events, 'Promoted events retrieved successfully', 200);
  })
);

/**
 * Events I've saved / bookmarked
 * GET /api/events/saved
 */
eventRoutes.get(
  '/saved',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    const events = await EventService.getSavedEvents(req.user.userId);
    return ApiResponseHandler.success(res, events, 'Saved events retrieved successfully', 200);
  })
);

/**
 * Get a single event
 * GET /api/events/:eventId
 */
eventRoutes.get(
  '/:eventId',
  asyncHandler(async (req: any, res: Response) => {
    const event = await EventService.getEvent(req.params.eventId, req.user?.userId);
    if (!event) return ApiResponseHandler.error(res, 'Event not found', undefined, 404);
    return ApiResponseHandler.success(res, event, 'Event retrieved successfully', 200);
  })
);

/**
 * RSVP to an event
 * POST /api/events/:eventId/rsvp
 */
eventRoutes.post(
  '/:eventId/rsvp',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }
    const { status } = req.body;
    if (status !== 'GOING' && status !== 'INTERESTED') {
      return ApiResponseHandler.error(res, 'Invalid RSVP status', undefined, 400);
    }
    const event = await EventService.rsvp(req.params.eventId, req.user.userId, status);
    return ApiResponseHandler.success(res, event, 'RSVP saved successfully', 200);
  })
);

/**
 * Cancel an RSVP
 * DELETE /api/events/:eventId/rsvp
 */
eventRoutes.delete(
  '/:eventId/rsvp',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }
    const event = await EventService.cancelRsvp(req.params.eventId, req.user.userId);
    return ApiResponseHandler.success(res, event, 'RSVP cancelled successfully', 200);
  })
);

/**
 * Save / bookmark an event
 * POST /api/events/:eventId/save
 */
eventRoutes.post(
  '/:eventId/save',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }
    const event = await EventService.saveEvent(req.params.eventId, req.user.userId);
    return ApiResponseHandler.success(res, event, 'Event saved successfully', 200);
  })
);

/**
 * Remove a saved event
 * DELETE /api/events/:eventId/save
 */
eventRoutes.delete(
  '/:eventId/save',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }
    const event = await EventService.unsaveEvent(req.params.eventId, req.user.userId);
    return ApiResponseHandler.success(res, event, 'Event unsaved successfully', 200);
  })
);

/**
 * Delete (deactivate) an event
 * DELETE /api/events/:eventId
 */
eventRoutes.delete(
  '/:eventId',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }
    await EventService.deleteEvent(req.params.eventId, req.user.userId);
    return ApiResponseHandler.success(res, {}, 'Event deleted successfully', 200);
  })
);

export default eventRoutes;

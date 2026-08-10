import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from './auth';
import { ApiResponseHandler } from '../utils/apiResponse';
import { ERROR_MESSAGES } from '../constants';

const prisma = new PrismaClient();

/**
 * Restricts a route to platform administrators.
 *
 * `isPlatformAdmin` is deliberately NOT baked into the JWT payload — it's
 * looked up fresh from the database on every request. This is a low-traffic,
 * high-sensitivity action, so the extra query is worth it: revoking admin
 * access takes effect immediately instead of waiting out a 7-day token
 * lifetime. Company-scoped `OWNER`/`ADMIN` roles are NOT sufficient here —
 * those are scoped to a single company and must never grant cross-tenant
 * actions like unlocking an arbitrary user's account.
 */
export async function platformAdminMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    ApiResponseHandler.error(res, ERROR_MESSAGES.UNAUTHORIZED, undefined, 401);
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isPlatformAdmin: true },
    });

    if (!user?.isPlatformAdmin) {
      ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      return;
    }

    next();
  } catch (error) {
    ApiResponseHandler.error(res, 'Failed to verify admin access', undefined, 500);
  }
}

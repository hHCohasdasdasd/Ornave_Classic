import { Request, Response, NextFunction } from 'express';
import { ApiResponseHandler } from '../utils/apiResponse';
import { ERROR_MESSAGES } from '../constants';

/**
 * Global error handling middleware
 * Catches and formats all errors consistently
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[Error]', error);

  // Handle validation errors
  if (error.name === 'ValidationError') {
    ApiResponseHandler.error(res, ERROR_MESSAGES.INVALID_INPUT, error.message, 400);
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    ApiResponseHandler.error(res, ERROR_MESSAGES.INVALID_TOKEN, error.message, 401);
    return;
  }

  // Handle Prisma unique constraint errors
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'field';
    ApiResponseHandler.error(
      res,
      `${field} already exists`,
      `Duplicate ${field}`,
      400
    );
    return;
  }

  // Handle Prisma record not found
  if (error.code === 'P2025') {
    ApiResponseHandler.error(res, ERROR_MESSAGES.INTERNAL_ERROR, 'Record not found', 404);
    return;
  }

  // Default error response. Anything reaching here is an error type we
  // haven't specifically categorized above (unlike the branches for
  // validation/JWT/Prisma errors, which already return safe, generic
  // messages) — so in production, don't hand the client the raw
  // error.message, which can be a Prisma internals string, a JSON parser
  // message revealing request-body structure, or similar. Full detail is
  // still in the server log from the console.error above.
  const statusCode = error.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';
  const safeMessage = isProd && statusCode >= 500 ? ERROR_MESSAGES.INTERNAL_ERROR : (error.message || ERROR_MESSAGES.INTERNAL_ERROR);

  ApiResponseHandler.error(
    res,
    safeMessage,
    isProd ? undefined : error.message,
    statusCode
  );
}

/**
 * Async error wrapper for route handlers
 * Catches promise rejections in async functions
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

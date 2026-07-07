import { Response } from 'express';

/**
 * Standardized API Response wrapper
 * Ensures consistent response format across all endpoints
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export class ApiResponseHandler {
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
  ): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  static error(
    res: Response,
    message: string,
    error?: string,
    statusCode: number = 400
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      error: error || message,
      timestamp: new Date().toISOString(),
    });
  }

  static paginated<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number,
    message: string = 'Success',
    statusCode: number = 200
  ): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    });
  }
}

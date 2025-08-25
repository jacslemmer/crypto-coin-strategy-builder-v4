import type { Request, Response, NextFunction } from 'express';
import type { Logger } from '../../infra/logging/index.js';
import type { ApiError } from '../types.js';

export function errorHandler(logger: Logger) {
  return (err: Error, req: Request, res: Response, next: NextFunction): void => {
    // Log the error
    logger.error('Unhandled error occurred', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.headers['x-request-id'] || 'unknown',
    });

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'An internal server error occurred';
    let details: any = undefined;

    // Handle specific error types
    if (err.name === 'ValidationError') {
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
      message = 'Request validation failed';
      details = err.message;
    } else if (err.name === 'NotFoundError') {
      statusCode = 404;
      errorCode = 'NOT_FOUND';
      message = err.message;
    } else if (err.name === 'ConflictError') {
      statusCode = 409;
      errorCode = 'CONFLICT';
      message = err.message;
    } else if (err.name === 'RateLimitError') {
      statusCode = 429;
      errorCode = 'RATE_LIMIT_EXCEEDED';
      message = err.message;
    } else if (err.name === 'AuthenticationError') {
      statusCode = 401;
      errorCode = 'AUTHENTICATION_ERROR';
      message = err.message;
    } else if (err.name === 'AuthorizationError') {
      statusCode = 403;
      errorCode = 'AUTHORIZATION_ERROR';
      message = err.message;
    }

    // Create error response
    const errorResponse: ApiError = {
      code: errorCode,
      message,
      timestamp: new Date().toISOString(),
      request_id: (req.headers['x-request-id'] as string) || 'unknown',
    };

    // Add details in development or for specific error types
    if (details || isDevelopment) {
      errorResponse.details = details || {
        message: err.message,
        stack: err.stack,
        name: err.name,
      };
    }

    // Send error response
    res.status(statusCode).json({ error: errorResponse });
  };
}

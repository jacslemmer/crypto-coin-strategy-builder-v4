import type { Request, Response, NextFunction } from 'express';
import type { Logger } from '../../infra/logging/index.js';

export function requestLogger(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Generate request ID if not present
    if (!req.headers['x-request-id']) {
      req.headers['x-request-id'] = generateRequestId();
    }

    const startTime = Date.now();

    // Log request start
    logger.info('Request started', {
      requestId: req.headers['x-request-id'],
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length'),
      query: req.query,
      headers: sanitizeHeaders(req.headers),
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const duration = Date.now() - startTime;
      
      // Log request completion
      logger.info('Request completed', {
        requestId: req.headers['x-request-id'],
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        contentLength: res.get('Content-Length'),
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });

      // Call original end method
      return originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

// Generate unique request ID
function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Sanitize headers to remove sensitive information
function sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  
  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

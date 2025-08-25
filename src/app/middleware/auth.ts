import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types.js';

// API key validation middleware
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Authorization header is required',
        timestamp: new Date().toISOString(),
        request_id: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  const [scheme, token] = authHeader.split(' ');
  
  if (scheme !== 'Bearer') {
    res.status(401).json({
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid authorization scheme. Use Bearer token',
        timestamp: new Date().toISOString(),
        request_id: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  if (!token) {
    res.status(401).json({
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'API token is required',
        timestamp: new Date().toISOString(),
        request_id: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Validate API key
  const isValidKey = validateApiKey(token);
  
  if (!isValidKey) {
    res.status(401).json({
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid API token',
        timestamp: new Date().toISOString(),
        request_id: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Set user context
  req.user = {
    id: 'dev-user',
    apiKey: token,
    permissions: ['read', 'write'],
  };

  next();
}

// API key validation function
function validateApiKey(token: string): boolean {
  // For development, accept the default key
  if (process.env.NODE_ENV === 'development') {
    return token === 'dev-api-key-12345';
  }

  // For production, validate against stored keys
  // This would typically check against a database or external service
  const validKeys = process.env.VALID_API_KEYS?.split(',') || [];
  return validKeys.includes(token);
}



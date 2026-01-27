/**
 * Authentication Middleware - JWT verification
 * 
 * ARCHITECTURE DECISION:
 * - Validates JWT tokens on protected routes
 * - Extracts user info from token
 * - Attaches user to request object
 * - Returns 401 if token is missing/invalid
 * 
 * PATTERN: Middleware Chain
 * - Can be composed with other middleware
 * - Non-blocking for public routes
 * - Reusable across multiple routes
 */

import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt.util';
import { AppError } from '../utils/error.util';
import { HttpStatus } from '../constants/http-status';

/**
 * Extended Express Request with user data
 */
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    type?: 'access' | 'refresh';
  };
}

/**
 * JWT Authentication middleware
 * Usage: app.use('/api/protected', authMiddleware)
 */
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AppError('No authentication token provided', HttpStatus.UNAUTHORIZED);
    }

    const payload = JwtUtil.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    if (!payload.id) {
      throw new AppError('Invalid token payload', HttpStatus.UNAUTHORIZED);
    }

    // Attach user info to request
    req.user = payload;

    next();
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: 'AUTH_ERROR',
      });
    }

    return res.status(HttpStatus.UNAUTHORIZED).json({
      error: 'Invalid token',
      code: 'TOKEN_ERROR',
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Usage: app.use('/api/optional', optionalAuthMiddleware)
 */
export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);

    if (token) {
      const payload = JwtUtil.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      if (payload.id) {
        req.user = payload;
      }
    }
  } catch (error) {
    // Silently ignore auth errors
    console.debug('Optional auth failed:', error);
  }

  next();
};

/**
 * Refresh token middleware - validates refresh tokens
 * Usage: app.post('/api/auth/refresh', refreshTokenMiddleware)
 */
export const refreshTokenMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AppError('No refresh token provided', HttpStatus.UNAUTHORIZED);
    }

    const payload = JwtUtil.verify(token, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret');

    if (payload.type !== 'refresh') {
      throw new AppError('Not a refresh token', HttpStatus.UNAUTHORIZED);
    }

    req.user = payload;
    next();
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: 'AUTH_ERROR',
      });
    }

    return res.status(HttpStatus.UNAUTHORIZED).json({
      error: 'Invalid refresh token',
      code: 'REFRESH_ERROR',
    });
  }
};

/**
 * Helper to extract token from Authorization header or cookies
 */
function extractToken(req: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies (if using cookie-based auth)
  // const cookies = req.cookies;
  // if (cookies?.accessToken) {
  //   return cookies.accessToken;
  // }

  return null;
}

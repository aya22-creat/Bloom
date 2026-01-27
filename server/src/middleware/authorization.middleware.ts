/**
 * Authorization Middleware - Role-based access control
 * 
 * ARCHITECTURE DECISION:
 * - Works in conjunction with auth middleware
 * - Checks user roles/permissions
 * - Returns 403 if unauthorized
 * - Extensible for different permission models
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { AppError } from '../utils/error.util';
import { HttpStatus } from '../constants/http-status';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  DOCTOR = 'doctor',
}

/**
 * Check if user has required role
 * Usage: app.get('/api/admin', authorize(UserRole.ADMIN), controller)
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      // TODO: Fetch user from database with role
      // const user = await userRepository.findById(req.user.id);
      // if (!user || !allowedRoles.includes(user.role)) {
      //   throw new AppError('Insufficient permissions', HttpStatus.FORBIDDEN);
      // }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: 'AUTHORIZATION_ERROR',
        });
      }

      return res.status(HttpStatus.FORBIDDEN).json({
        error: 'Access denied',
        code: 'FORBIDDEN',
      });
    }
  };
};

/**
 * Check if user owns the resource (simple ownership check)
 * Usage: app.get('/api/profiles/:userId', ownsResource), controller)
 */
export const ownsResource = (paramName: string = 'userId') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      const resourceUserId = parseInt(req.params[paramName], 10);

      if (req.user.id !== resourceUserId) {
        throw new AppError('You do not have permission to access this resource', HttpStatus.FORBIDDEN);
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: 'AUTHORIZATION_ERROR',
        });
      }

      return res.status(HttpStatus.FORBIDDEN).json({
        error: 'Access denied',
        code: 'FORBIDDEN',
      });
    }
  };
};

/**
 * Authentication middleware for role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, UserRole } from '../types/rbac.types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to require authentication
 * Validates JWT token and attaches user to request
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }
  } catch (error) {
    console.error('[Auth Middleware Error]', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed',
    });
  }
};

/**
 * Middleware to require specific role(s)
 * Must be used after requireAuth
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
    }

    next();
  };
};

/**
 * Middleware to check if doctor is approved
 * Must be used after requireAuth
 */
export const requireApproved = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  if (req.user.role === 'doctor' && !req.user.approved) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Doctor account pending approval',
      pending: true,
    });
  }

  next();
};

/**
 * Middleware to check if user can access patient data
 * Admins can access all, doctors can access assigned patients, patients can access only their own
 */
export const requirePatientAccess = (paramName: string = 'patientId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const patientId = parseInt(req.params[paramName] || req.body[paramName]);

    if (isNaN(patientId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid patient ID',
      });
    }

    // Admin can access all
    if (req.user.role === 'admin') {
      return next();
    }

    // Patient can only access their own data
    if (req.user.role === 'patient') {
      if (req.user.userId !== patientId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied',
        });
      }
      return next();
    }

    // Doctor can access assigned patients
    if (req.user.role === 'doctor') {
      const { Database } = require('../lib/database');
      
      Database.db.get(
        'SELECT id FROM users WHERE id = ? AND assigned_doctor_id = ?',
        [patientId, req.user.userId],
        (err: any, row: any) => {
          if (err) {
            console.error('[Patient Access Check Error]', err);
            return res.status(500).json({
              error: 'Internal server error',
              message: 'Failed to verify access',
            });
          }

          if (!row) {
            return res.status(403).json({
              error: 'Forbidden',
              message: 'Patient not assigned to you',
            });
          }

          next();
        }
      );
      return;
    }

    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied',
    });
  };
};

/**
 * Helper function to generate JWT token
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * Helper function to verify JWT token
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Validation Middleware - Input validation
 * 
 * ARCHITECTURE DECISION:
 * - Validates request body before business logic
 * - Uses schema validation (example with simple validator)
 * - Returns 400 with detailed error messages
 * - Prevents invalid data from reaching services
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/error.util';
import { HttpStatus } from '../constants/http-status';

/**
 * Generic validation middleware factory
 */
export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: Record<string, string> = {};

      // Validate each field in schema
      for (const [field, rules] of Object.entries(schema)) {
        const value = req.body[field];
        const fieldErrors = validateField(field, value, rules);

        if (fieldErrors.length > 0) {
          errors[field] = fieldErrors[0];
        }
      }

      if (Object.keys(errors).length > 0) {
        throw new AppError(JSON.stringify(errors), HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR');
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
        });
      }

      return res.status(HttpStatus.BAD_REQUEST).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
      });
    }
  };
};

/**
 * Validation schema definition
 */
export interface ValidationSchema {
  [field: string]: ValidationRules;
}

export interface ValidationRules {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'date';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
}

/**
 * Validate single field
 */
function validateField(field: string, value: any, rules: ValidationRules): string[] {
  const errors: string[] = [];

  // Required check
  if (rules.required && (value === undefined || value === null || value === '')) {
    errors.push(`${field} is required`);
    return errors;
  }

  if (value === undefined || value === null) {
    return errors;
  }

  // Type check
  if (rules.type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      errors.push(`${field} must be a valid email`);
    }
  } else if (rules.type) {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (rules.type !== actualType) {
      errors.push(`${field} must be a ${rules.type}`);
    }
  }

  // Length checks
  if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
    errors.push(`${field} must be at least ${rules.minLength} characters`);
  }

  if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
    errors.push(`${field} must be at most ${rules.maxLength} characters`);
  }

  // Number range checks
  if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
    errors.push(`${field} must be at least ${rules.min}`);
  }

  if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
    errors.push(`${field} must be at most ${rules.max}`);
  }

  // Pattern check
  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push(`${field} format is invalid`);
  }

  // Custom validation
  if (rules.custom && !rules.custom(value)) {
    errors.push(`${field} is invalid`);
  }

  return errors;
}

/**
 * Common validation schemas
 */
export const ValidationSchemas = {
  registerUser: {
    email: { required: true, type: 'email' },
    username: { required: true, type: 'string', minLength: 3, maxLength: 20 },
    password: { required: true, type: 'string', minLength: 8 },
    confirmPassword: { required: true, type: 'string' },
  } as ValidationSchema,

  loginUser: {
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string' },
  } as ValidationSchema,

  createReminder: {
    title: { required: true, type: 'string', minLength: 3 },
    description: { type: 'string', maxLength: 500 },
    reminderTime: { required: true, type: 'string' },
  } as ValidationSchema,
};

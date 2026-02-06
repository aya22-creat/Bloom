/**
 * Validation schemas using Zod for request validation
 */

import { z } from 'zod';

// User validation schemas
export const registerSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['patient', 'doctor', 'admin']).default('patient'),
  userType: z.enum(['fighter', 'survivor', 'wellness']).optional(),
  language: z.enum(['ar', 'en']).default('en'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const assignDoctorSchema = z.object({
  doctorId: z.number().int().positive(),
});

// Chat validation schemas
export const createChatRoomSchema = z.object({
  type: z.enum(['global', 'private']),
  patientId: z.number().int().positive().optional(),
  doctorId: z.number().int().positive().optional(),
});

export const sendMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string(),
  })).optional(),
});

// Exercise evaluation schemas
export const exerciseEvaluationSchema = z.object({
  exercise_name: z.string().min(1).max(200),
  completed: z.boolean(),
  pain_level: z.number().int().min(0).max(10),
  fatigue_level: z.number().int().min(0).max(10),
  notes: z.string().max(1000).optional(),
});

// Reminder schemas
export const reminderSchema = z.object({
  target_type: z.enum(['patient', 'group', 'all']),
  target_id: z.number().int().positive().optional(),
  user_type: z.enum(['fighter', 'survivor', 'wellness']).optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(['medicine', 'appointment', 'exercise', 'self-exam', 'custom']),
  scheduled_time: z.string().datetime(),
  recurrence: z.enum(['once', 'daily', 'weekly', 'monthly']).default('once'),
});

export const updateReminderSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  scheduled_time: z.string().datetime().optional(),
  recurrence: z.enum(['once', 'daily', 'weekly', 'monthly']).optional(),
  is_active: z.boolean().optional(),
});

// Profile update schema
export const updateProfileSchema = z.object({
  username: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  language: z.enum(['ar', 'en']).optional(),
  userType: z.enum(['fighter', 'survivor', 'wellness']).optional(),
});

/**
 * Validation middleware factory
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

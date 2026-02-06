/**
 * Reminder routes
 */

import { Router, Request, Response } from 'express';
import { Database } from '../lib/database';
import { requireAuth, requireRole } from '../middleware/rbac.middleware';
import { validate, reminderSchema, updateReminderSchema } from '../middleware/validation.schemas';
import { logAudit } from '../services/audit.service';

const router = Router();

/**
 * POST /api/reminders
 * Create a reminder (admin or doctor)
 */
router.post('/', requireAuth, requireRole('admin', 'doctor'), validate(reminderSchema), async (req: Request, res: Response) => {
  try {
    const {
      target_type,
      target_id,
      user_type,
      title,
      description,
      type,
      scheduled_time,
      recurrence,
    } = req.body;

    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Doctors can only create reminders for their assigned patients
    if (userRole === 'doctor') {
      if (target_type !== 'patient' || !target_id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Doctors can only create reminders for specific patients',
        });
      }

      // Verify patient is assigned to this doctor
      const patient: any = await new Promise((resolve, reject) => {
        Database.db.get(
          'SELECT id FROM users WHERE id = ? AND assigned_doctor_id = ?',
          [target_id, userId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!patient) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Patient is not assigned to you',
        });
      }
    }

    // Validate target
    if (target_type === 'patient' && !target_id) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'target_id is required for patient reminders',
      });
    }

    if (target_type === 'group' && !user_type) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'user_type is required for group reminders',
      });
    }

    // Insert reminder
    const reminderId = await new Promise<number>((resolve, reject) => {
      Database.db.run(
        `INSERT INTO reminders (target_type, target_id, user_type, title, description, type, scheduled_time, recurrence, is_active, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)`,
        [
          target_type,
          target_id || null,
          user_type || null,
          title,
          description || null,
          type,
          scheduled_time,
          recurrence || 'once',
          userId,
        ],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Log audit
    await logAudit({
      user_id: userId,
      action: 'reminder_created',
      entity_type: 'reminder',
      entity_id: reminderId,
      details: JSON.stringify({ target_type, type, recurrence }),
      ip_address: req.ip,
    });

    res.status(201).json({
      message: 'Reminder created',
      reminderId,
    });
  } catch (error) {
    console.error('[Create Reminder Error]', error);
    res.status(500).json({
      error: 'Failed to create reminder',
      message: 'An error occurred while creating reminder',
    });
  }
});

/**
 * GET /api/reminders/:patientId
 * Get reminders for a patient
 */
router.get('/:patientId', requireAuth, async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Check access
    if (userRole === 'patient' && userId !== patientId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your own reminders',
      });
    }

    if (userRole === 'doctor') {
      // Verify patient is assigned to this doctor
      const patient: any = await new Promise((resolve, reject) => {
        Database.db.get(
          'SELECT id FROM users WHERE id = ? AND assigned_doctor_id = ?',
          [patientId, userId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!patient) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Patient is not assigned to you',
        });
      }
    }

    // Get patient's user_type
    const patient: any = await new Promise((resolve, reject) => {
      Database.db.get(
        'SELECT userType FROM users WHERE id = ?',
        [patientId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'Patient does not exist',
      });
    }

    // Get reminders: specific to patient + group (by userType) + all
    const reminders = await new Promise<any[]>((resolve, reject) => {
      Database.db.all(
        `SELECT r.*, u.username as created_by_name
         FROM reminders r
         LEFT JOIN users u ON r.created_by = u.id
         WHERE (
           (r.target_type = 'patient' AND r.target_id = ?) OR
           (r.target_type = 'group' AND r.user_type = ?) OR
           (r.target_type = 'all')
         ) AND r.is_active = 1
         ORDER BY r.scheduled_time ASC`,
        [patientId, patient.userType],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    res.json({ reminders });
  } catch (error) {
    console.error('[Get Reminders Error]', error);
    res.status(500).json({
      error: 'Failed to get reminders',
      message: 'An error occurred while fetching reminders',
    });
  }
});

/**
 * PUT /api/reminders/:id
 * Update a reminder
 */
router.put('/:id', requireAuth, requireRole('admin', 'doctor'), validate(updateReminderSchema), async (req: Request, res: Response) => {
  try {
    const reminderId = parseInt(req.params.id);
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Get reminder
    const reminder: any = await new Promise((resolve, reject) => {
      Database.db.get(
        'SELECT * FROM reminders WHERE id = ?',
        [reminderId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!reminder) {
      return res.status(404).json({
        error: 'Reminder not found',
        message: 'Reminder does not exist',
      });
    }

    // Check permission
    if (userRole === 'doctor') {
      if (reminder.created_by !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own reminders',
        });
      }
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    if (req.body.title !== undefined) {
      updates.push('title = ?');
      params.push(req.body.title);
    }

    if (req.body.description !== undefined) {
      updates.push('description = ?');
      params.push(req.body.description);
    }

    if (req.body.scheduled_time !== undefined) {
      updates.push('scheduled_time = ?');
      params.push(req.body.scheduled_time);
    }

    if (req.body.recurrence !== undefined) {
      updates.push('recurrence = ?');
      params.push(req.body.recurrence);
    }

    if (req.body.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(req.body.is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'No fields to update',
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(reminderId);

    // Update reminder
    await new Promise<void>((resolve, reject) => {
      Database.db.run(
        `UPDATE reminders SET ${updates.join(', ')} WHERE id = ?`,
        params,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Log audit
    await logAudit({
      user_id: userId,
      action: 'reminder_updated',
      entity_type: 'reminder',
      entity_id: reminderId,
      details: JSON.stringify(req.body),
      ip_address: req.ip,
    });

    res.json({ message: 'Reminder updated' });
  } catch (error) {
    console.error('[Update Reminder Error]', error);
    res.status(500).json({
      error: 'Failed to update reminder',
      message: 'An error occurred while updating reminder',
    });
  }
});

/**
 * DELETE /api/reminders/:id
 * Delete a reminder
 */
router.delete('/:id', requireAuth, requireRole('admin', 'doctor'), async (req: Request, res: Response) => {
  try {
    const reminderId = parseInt(req.params.id);
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Get reminder
    const reminder: any = await new Promise((resolve, reject) => {
      Database.db.get(
        'SELECT * FROM reminders WHERE id = ?',
        [reminderId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!reminder) {
      return res.status(404).json({
        error: 'Reminder not found',
        message: 'Reminder does not exist',
      });
    }

    // Check permission
    if (userRole === 'doctor') {
      if (reminder.created_by !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only delete your own reminders',
        });
      }
    }

    // Soft delete (set is_active = 0)
    await new Promise<void>((resolve, reject) => {
      Database.db.run(
        'UPDATE reminders SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [reminderId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Log audit
    await logAudit({
      user_id: userId,
      action: 'reminder_deleted',
      entity_type: 'reminder',
      entity_id: reminderId,
      ip_address: req.ip,
    });

    res.json({ message: 'Reminder deleted' });
  } catch (error) {
    console.error('[Delete Reminder Error]', error);
    res.status(500).json({
      error: 'Failed to delete reminder',
      message: 'An error occurred while deleting reminder',
    });
  }
});

export default router;

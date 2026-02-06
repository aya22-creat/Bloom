/**
 * Admin dashboard routes
 */

import { Router, Request, Response } from 'express';
import { Database } from '../lib/database';
import { requireAuth, requireRole } from '../middleware/rbac.middleware';
import { getAuditLogs } from '../services/audit.service';

const router = Router();

/**
 * GET /api/admin/stats
 * Get dashboard statistics (admin only)
 */
router.get('/stats', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    // Get total counts
    const userCounts: any = await new Promise((resolve, reject) => {
      Database.db.get(
        `SELECT 
          SUM(CASE WHEN role = 'patient' THEN 1 ELSE 0 END) as total_patients,
          SUM(CASE WHEN role = 'doctor' THEN 1 ELSE 0 END) as total_doctors,
          SUM(CASE WHEN role = 'doctor' AND approved = 0 THEN 1 ELSE 0 END) as pending_doctors,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as total_admins
         FROM users`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Active reminders
    const reminderCounts: any = await new Promise((resolve, reject) => {
      Database.db.get(
        `SELECT 
          COUNT(*) as active_reminders,
          SUM(CASE WHEN datetime(scheduled_time) <= datetime('now') THEN 1 ELSE 0 END) as due_reminders
         FROM reminders
         WHERE is_active = 1`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Flagged messages
    const flaggedMessages: any = await new Promise((resolve, reject) => {
      Database.db.get(
        'SELECT COUNT(*) as count FROM chat_messages WHERE is_reported = 1 AND is_deleted = 0',
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Today's evaluations
    const todayEvaluations: any = await new Promise((resolve, reject) => {
      Database.db.get(
        `SELECT COUNT(*) as count 
         FROM exercise_evaluations 
         WHERE date(created_at) = date('now')`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // High risk alerts (last 7 days)
    const highRiskAlerts: any = await new Promise((resolve, reject) => {
      Database.db.get(
        `SELECT COUNT(*) as count 
         FROM exercise_evaluations 
         WHERE (pain_level >= 7 OR score < 30)
         AND datetime(created_at) >= datetime('now', '-7 days')`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Low compliance patients (no evaluation in last 14 days)
    const lowCompliancePatients: any = await new Promise((resolve, reject) => {
      Database.db.get(
        `SELECT COUNT(DISTINCT u.id) as count
         FROM users u
         LEFT JOIN exercise_evaluations ee ON u.id = ee.patient_id 
           AND datetime(ee.created_at) >= datetime('now', '-14 days')
         WHERE u.role = 'patient' AND ee.id IS NULL`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    res.json({
      stats: {
        total_patients: userCounts.total_patients || 0,
        total_doctors: userCounts.total_doctors || 0,
        pending_doctors: userCounts.pending_doctors || 0,
        total_admins: userCounts.total_admins || 0,
        active_reminders: reminderCounts.active_reminders || 0,
        due_reminders: reminderCounts.due_reminders || 0,
        flagged_messages: flaggedMessages.count || 0,
        total_evaluations_today: todayEvaluations.count || 0,
        high_risk_alerts: highRiskAlerts.count || 0,
        low_compliance_patients: lowCompliancePatients.count || 0,
      },
    });
  } catch (error) {
    console.error('[Admin Stats Error]', error);
    res.status(500).json({
      error: 'Failed to get stats',
      message: 'An error occurred while fetching statistics',
    });
  }
});

/**
 * GET /api/admin/users/pending-doctors
 * Get list of pending doctor approvals
 */
router.get('/users/pending-doctors', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const doctors = await new Promise<any[]>((resolve, reject) => {
      Database.db.all(
        `SELECT id, username, email, language, created_at
         FROM users
         WHERE role = 'doctor' AND approved = 0
         ORDER BY created_at ASC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    res.json({ doctors });
  } catch (error) {
    console.error('[Get Pending Doctors Error]', error);
    res.status(500).json({
      error: 'Failed to get pending doctors',
      message: 'An error occurred while fetching pending doctors',
    });
  }
});

/**
 * GET /api/admin/users/unassigned-patients
 * Get patients without assigned doctors
 */
router.get('/users/unassigned-patients', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const patients = await new Promise<any[]>((resolve, reject) => {
      Database.db.all(
        `SELECT id, username, email, userType, language, created_at
         FROM users
         WHERE role = 'patient' AND assigned_doctor_id IS NULL
         ORDER BY created_at ASC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    res.json({ patients });
  } catch (error) {
    console.error('[Get Unassigned Patients Error]', error);
    res.status(500).json({
      error: 'Failed to get unassigned patients',
      message: 'An error occurred while fetching unassigned patients',
    });
  }
});

/**
 * GET /api/admin/messages/flagged
 * Get flagged messages for moderation
 */
router.get('/messages/flagged', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const messages = await new Promise<any[]>((resolve, reject) => {
      Database.db.all(
        `SELECT cm.*, 
                u.username as sender_name, u.email as sender_email,
                cr.type as room_type
         FROM chat_messages cm
         LEFT JOIN users u ON cm.sender_id = u.id
         LEFT JOIN chat_rooms cr ON cm.room_id = cr.id
         WHERE cm.is_reported = 1 AND cm.is_deleted = 0
         ORDER BY cm.created_at DESC
         LIMIT 100`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    res.json({ messages });
  } catch (error) {
    console.error('[Get Flagged Messages Error]', error);
    res.status(500).json({
      error: 'Failed to get flagged messages',
      message: 'An error occurred while fetching flagged messages',
    });
  }
});

/**
 * GET /api/admin/audit-logs
 * Get audit logs with filtering
 */
router.get('/audit-logs', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { userId, action, entityType, limit = 50, offset = 0 } = req.query;

    const logs = await getAuditLogs({
      userId: userId ? parseInt(userId as string) : undefined,
      action: action as string,
      entityType: entityType as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({ logs });
  } catch (error) {
    console.error('[Get Audit Logs Error]', error);
    res.status(500).json({
      error: 'Failed to get audit logs',
      message: 'An error occurred while fetching audit logs',
    });
  }
});

/**
 * GET /api/admin/low-compliance
 * Get patients with low compliance (no recent evaluations)
 */
router.get('/low-compliance', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { days = 14 } = req.query;

    const patients = await new Promise<any[]>((resolve, reject) => {
      Database.db.all(
        `SELECT 
          u.id, u.username, u.email, u.userType, u.language, u.assigned_doctor_id,
          d.username as doctor_name,
          MAX(ee.created_at) as last_evaluation_date
         FROM users u
         LEFT JOIN exercise_evaluations ee ON u.id = ee.patient_id
         LEFT JOIN users d ON u.assigned_doctor_id = d.id
         WHERE u.role = 'patient'
         GROUP BY u.id
         HAVING last_evaluation_date IS NULL 
           OR datetime(last_evaluation_date) < datetime('now', '-' || ? || ' days')
         ORDER BY last_evaluation_date ASC NULLS FIRST`,
        [parseInt(days as string)],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    res.json({ patients, days: parseInt(days as string) });
  } catch (error) {
    console.error('[Get Low Compliance Error]', error);
    res.status(500).json({
      error: 'Failed to get low compliance patients',
      message: 'An error occurred while fetching low compliance data',
    });
  }
});

/**
 * GET /api/admin/high-risk-alerts
 * Get recent high-risk exercise evaluations
 */
router.get('/high-risk-alerts', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { days = 7, limit = 50 } = req.query;

    const alerts = await new Promise<any[]>((resolve, reject) => {
      Database.db.all(
        `SELECT 
          ee.*,
          u.username as patient_name, u.email as patient_email, u.userType,
          d.username as doctor_name
         FROM exercise_evaluations ee
         LEFT JOIN users u ON ee.patient_id = u.id
         LEFT JOIN users d ON u.assigned_doctor_id = d.id
         WHERE (ee.pain_level >= 7 OR ee.score < 30)
           AND datetime(ee.created_at) >= datetime('now', '-' || ? || ' days')
         ORDER BY ee.created_at DESC
         LIMIT ?`,
        [parseInt(days as string), parseInt(limit as string)],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    res.json({ alerts, days: parseInt(days as string) });
  } catch (error) {
    console.error('[Get High Risk Alerts Error]', error);
    res.status(500).json({
      error: 'Failed to get high risk alerts',
      message: 'An error occurred while fetching high risk alerts',
    });
  }
});

export default router;

/**
 * Doctor dashboard routes
 */

import { Router, Request, Response } from 'express';
import { Database } from '../lib/database';
import { requireAuth, requireRole, requireApproved } from '../middleware/rbac.middleware';

const router = Router();

/**
 * GET /api/doctor/patients
 * Get all patients assigned to the doctor
 */
router.get('/patients', requireAuth, requireRole('doctor'), requireApproved, async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const { search, userType } = req.query;

    let query = `
      SELECT id, username, email, userType, language, created_at
      FROM users
      WHERE role = 'patient' AND assigned_doctor_id = ?
    `;
    const params: any[] = [doctorId];

    if (search) {
      query += ' AND (username LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (userType) {
      query += ' AND userType = ?';
      params.push(userType);
    }

    query += ' ORDER BY username ASC';

    const patients = await new Promise<any[]>((resolve, reject) => {
      Database.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({ patients, count: patients.length });
  } catch (error) {
    console.error('[Get Doctor Patients Error]', error);
    res.status(500).json({
      error: 'Failed to get patients',
      message: 'An error occurred while fetching patients',
    });
  }
});

/**
 * GET /api/doctor/patients/:patientId/summary
 * Get detailed summary for a specific patient
 */
router.get('/patients/:patientId/summary', requireAuth, requireRole('doctor'), requireApproved, async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const patientId = parseInt(req.params.patientId);

    // Verify patient is assigned to this doctor
    const patient: any = await new Promise((resolve, reject) => {
      Database.db.get(
        `SELECT id, username, email, userType, language, created_at
         FROM users
         WHERE id = ? AND role = 'patient' AND assigned_doctor_id = ?`,
        [patientId, doctorId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'Patient not found or not assigned to you',
      });
    }

    // Get exercise stats (last 30 days)
    const exerciseStats: any = await new Promise((resolve, reject) => {
      Database.db.get(
        `SELECT 
          COUNT(*) as total_evaluations,
          SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_count,
          AVG(score) as average_score,
          AVG(pain_level) as average_pain,
          AVG(fatigue_level) as average_fatigue,
          MAX(created_at) as last_evaluation_date
         FROM exercise_evaluations
         WHERE patient_id = ? AND datetime(created_at) >= datetime('now', '-30 days')`,
        [patientId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Get risk alerts (last 7 days)
    const riskAlerts = await new Promise<any[]>((resolve, reject) => {
      Database.db.all(
        `SELECT exercise_name, pain_level, score, created_at
         FROM exercise_evaluations
         WHERE patient_id = ? 
           AND (pain_level >= 7 OR score < 30)
           AND datetime(created_at) >= datetime('now', '-7 days')
         ORDER BY created_at DESC
         LIMIT 10`,
        [patientId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    // Get medication adherence (if medication logs exist)
    const medicationAdherence: any = await new Promise((resolve, reject) => {
      Database.db.get(
        `SELECT 
          COUNT(*) as total_logs,
          SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as taken_count
         FROM medication_logs ml
         JOIN medications m ON ml.medication_id = m.id
         WHERE m.user_id = ? AND date(ml.taken_at) >= date('now', '-30 days')`,
        [patientId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Calculate metrics
    const completionRate = exerciseStats.total_evaluations > 0
      ? Math.round((exerciseStats.completed_count / exerciseStats.total_evaluations) * 100)
      : 0;

    const medicationAdherenceRate = medicationAdherence.total_logs > 0
      ? Math.round((medicationAdherence.taken_count / medicationAdherence.total_logs) * 100)
      : null;

    // Format risk alerts
    const formattedAlerts = riskAlerts.map(alert => ({
      type: alert.pain_level >= 7 ? 'high_pain' : 'low_score',
      severity: alert.pain_level >= 9 || alert.score < 20 ? 'high' : alert.pain_level >= 7 || alert.score < 30 ? 'medium' : 'low',
      message: alert.pain_level >= 7
        ? `High pain level (${alert.pain_level}/10) during ${alert.exercise_name}`
        : `Low exercise score (${alert.score}/100) for ${alert.exercise_name}`,
      date: alert.created_at,
    }));

    res.json({
      patient: {
        ...patient,
        exercise_completion_rate: completionRate,
        last_evaluation_date: exerciseStats.last_evaluation_date,
        average_score: exerciseStats.average_score ? Math.round(exerciseStats.average_score) : null,
        average_pain: exerciseStats.average_pain ? parseFloat(exerciseStats.average_pain.toFixed(1)) : null,
        average_fatigue: exerciseStats.average_fatigue ? parseFloat(exerciseStats.average_fatigue.toFixed(1)) : null,
        medication_adherence: medicationAdherenceRate,
        total_evaluations_30d: exerciseStats.total_evaluations || 0,
        risk_alerts: formattedAlerts,
      },
    });
  } catch (error) {
    console.error('[Get Patient Summary Error]', error);
    res.status(500).json({
      error: 'Failed to get patient summary',
      message: 'An error occurred while fetching patient summary',
    });
  }
});

/**
 * GET /api/doctor/stats
 * Get doctor's dashboard statistics
 */
router.get('/stats', requireAuth, requireRole('doctor'), requireApproved, async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;

    // Total assigned patients
    const patientCount: any = await new Promise((resolve, reject) => {
      Database.db.get(
        "SELECT COUNT(*) as count FROM users WHERE role = 'patient' AND assigned_doctor_id = ?",
        [doctorId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // High risk alerts (last 7 days)
    const highRiskCount: any = await new Promise((resolve, reject) => {
      Database.db.get(
        `SELECT COUNT(DISTINCT ee.patient_id) as count
         FROM exercise_evaluations ee
         JOIN users u ON ee.patient_id = u.id
         WHERE u.assigned_doctor_id = ?
           AND (ee.pain_level >= 7 OR ee.score < 30)
           AND datetime(ee.created_at) >= datetime('now', '-7 days')`,
        [doctorId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Low compliance patients (no evaluation in 14 days)
    const lowComplianceCount: any = await new Promise((resolve, reject) => {
      Database.db.get(
        `SELECT COUNT(DISTINCT u.id) as count
         FROM users u
         LEFT JOIN exercise_evaluations ee ON u.id = ee.patient_id 
           AND datetime(ee.created_at) >= datetime('now', '-14 days')
         WHERE u.role = 'patient' AND u.assigned_doctor_id = ? AND ee.id IS NULL`,
        [doctorId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Evaluations today
    const evaluationsToday: any = await new Promise((resolve, reject) => {
      Database.db.get(
        `SELECT COUNT(*) as count
         FROM exercise_evaluations ee
         JOIN users u ON ee.patient_id = u.id
         WHERE u.assigned_doctor_id = ? AND date(ee.created_at) = date('now')`,
        [doctorId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Active private chat rooms
    const activeChatRooms: any = await new Promise((resolve, reject) => {
      Database.db.get(
        "SELECT COUNT(*) as count FROM chat_rooms WHERE type = 'private' AND doctor_id = ?",
        [doctorId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    res.json({
      stats: {
        total_patients: patientCount.count || 0,
        high_risk_alerts: highRiskCount.count || 0,
        low_compliance_patients: lowComplianceCount.count || 0,
        evaluations_today: evaluationsToday.count || 0,
        active_chat_rooms: activeChatRooms.count || 0,
      },
    });
  } catch (error) {
    console.error('[Get Doctor Stats Error]', error);
    res.status(500).json({
      error: 'Failed to get stats',
      message: 'An error occurred while fetching statistics',
    });
  }
});

/**
 * GET /api/doctor/recent-activity
 * Get recent patient activity
 */
router.get('/recent-activity', requireAuth, requireRole('doctor'), requireApproved, async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const { limit = 20 } = req.query;

    const activities = await new Promise<any[]>((resolve, reject) => {
      Database.db.all(
        `SELECT 
          ee.id, ee.patient_id, ee.exercise_name, ee.completed, 
          ee.pain_level, ee.score, ee.created_at,
          u.username as patient_name, u.userType
         FROM exercise_evaluations ee
         JOIN users u ON ee.patient_id = u.id
         WHERE u.assigned_doctor_id = ?
         ORDER BY ee.created_at DESC
         LIMIT ?`,
        [doctorId, parseInt(limit as string)],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    res.json({ activities });
  } catch (error) {
    console.error('[Get Recent Activity Error]', error);
    res.status(500).json({
      error: 'Failed to get recent activity',
      message: 'An error occurred while fetching recent activity',
    });
  }
});

export default router;

/**
 * Exercise evaluation routes
 */

import { Router, Request, Response } from 'express';
import { Database } from '../lib/database';
import { requireAuth, requirePatientAccess } from '../middleware/rbac.middleware';
import { validate, exerciseEvaluationSchema } from '../middleware/validation.schemas';
import { logAudit } from '../services/audit.service';

const router = Router();

/**
 * Calculate exercise evaluation score
 * Formula: base = completed ? 100 : 0; subtract pain_level * 5; subtract fatigue_level * 2; clamp 0-100
 */
function calculateScore(completed: boolean, painLevel: number, fatigueLevel: number): number {
  let score = completed ? 100 : 0;
  score -= painLevel * 5;
  score -= fatigueLevel * 2;
  return Math.max(0, Math.min(100, score));
}

/**
 * POST /api/exercises/evaluate
 * Submit exercise evaluation (patient only)
 */
router.post('/evaluate', requireAuth, validate(exerciseEvaluationSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    if (role !== 'patient') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only patients can submit exercise evaluations',
      });
    }

    const { exercise_name, completed, pain_level, fatigue_level, notes } = req.body;

    // Calculate score
    const score = calculateScore(completed, pain_level, fatigue_level);

    // Insert evaluation
    const evaluationId = await new Promise<number>((resolve, reject) => {
      Database.db.run(
        `INSERT INTO exercise_evaluations (patient_id, exercise_name, completed, pain_level, fatigue_level, notes, score, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, exercise_name, completed ? 1 : 0, pain_level, fatigue_level, notes || null, score],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Check for high-risk alerts
    const isHighRisk = pain_level >= 7 || score < 30;

    // High-risk alert handling could notify assigned doctor via Socket.IO
    // Temporarily disabled until per-user socket mapping is implemented

    // Log audit
    await logAudit({
      user_id: userId,
      action: 'exercise_evaluated',
      entity_type: 'exercise_evaluation',
      entity_id: evaluationId,
      details: JSON.stringify({ exercise_name, score, isHighRisk }),
    });

    res.status(201).json({
      message: 'Exercise evaluation submitted',
      evaluationId,
      score,
      isHighRisk,
    });
  } catch (error) {
    console.error('[Exercise Evaluation Error]', error);
    res.status(500).json({
      error: 'Failed to submit evaluation',
      message: 'An error occurred while submitting evaluation',
    });
  }
});

/**
 * GET /api/exercises/:patientId
 * Get exercise evaluations for a patient
 */
router.get('/:patientId', requireAuth, requirePatientAccess('patientId'), async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const { limit = 50, offset = 0, startDate, endDate } = req.query;

    let query = `
      SELECT * FROM exercise_evaluations
      WHERE patient_id = ?
    `;
    const params: any[] = [patientId];

    if (startDate) {
      query += ' AND datetime(created_at) >= datetime(?)';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND datetime(created_at) <= datetime(?)';
      params.push(endDate);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const evaluations = await new Promise<any[]>((resolve, reject) => {
      Database.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({ evaluations });
  } catch (error) {
    console.error('[Get Evaluations Error]', error);
    res.status(500).json({
      error: 'Failed to get evaluations',
      message: 'An error occurred while fetching evaluations',
    });
  }
});

/**
 * GET /api/exercises/:patientId/stats
 * Get exercise statistics for a patient
 */
router.get('/:patientId/stats', requireAuth, requirePatientAccess('patientId'), async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const { days = 30 } = req.query;

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    // Get stats
    const stats: any = await new Promise((resolve, reject) => {
      Database.db.get(
        `SELECT 
          COUNT(*) as total_evaluations,
          SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_count,
          AVG(score) as average_score,
          AVG(pain_level) as average_pain,
          AVG(fatigue_level) as average_fatigue,
          MAX(created_at) as last_evaluation_date
         FROM exercise_evaluations
         WHERE patient_id = ? AND datetime(created_at) >= datetime(?)`,
        [patientId, startDate.toISOString()],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Get high-risk evaluations
    const highRiskCount: any = await new Promise((resolve, reject) => {
      Database.db.get(
        `SELECT COUNT(*) as count
         FROM exercise_evaluations
         WHERE patient_id = ? AND datetime(created_at) >= datetime(?)
         AND (pain_level >= 7 OR score < 30)`,
        [patientId, startDate.toISOString()],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    const completionRate = stats.total_evaluations > 0
      ? (stats.completed_count / stats.total_evaluations) * 100
      : 0;

    res.json({
      stats: {
        total_evaluations: stats.total_evaluations || 0,
        completed_count: stats.completed_count || 0,
        completion_rate: Math.round(completionRate),
        average_score: stats.average_score ? Math.round(stats.average_score) : 0,
        average_pain: stats.average_pain ? parseFloat(stats.average_pain.toFixed(1)) : 0,
        average_fatigue: stats.average_fatigue ? parseFloat(stats.average_fatigue.toFixed(1)) : 0,
        high_risk_count: highRiskCount.count || 0,
        last_evaluation_date: stats.last_evaluation_date,
        period_days: parseInt(days as string),
      },
    });
  } catch (error) {
    console.error('[Get Exercise Stats Error]', error);
    res.status(500).json({
      error: 'Failed to get stats',
      message: 'An error occurred while calculating stats',
    });
  }
});

export default router;

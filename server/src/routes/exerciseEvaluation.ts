// @ts-nocheck
/**
 * Exercise Routes
 * API endpoints for exercise management and evaluation
 * 
 * Note: AuthMiddleware adds `user` property to req, but TypeScript doesn't track
 * middleware type modifications properly. We suppress these type warnings.
 */

// @ts-ignore - Express router doesn't properly infer types after middleware
import { Router, Request, Response } from 'express';
import { ExerciseService } from '../services/exercise.service';
import { EvaluationService } from '../services/evaluation.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { HttpStatus } from '../constants/http-status';

const router = Router();
const exerciseService = new ExerciseService();
const evaluationService = new EvaluationService();

// ==================== Exercise Management ====================

/**
 * POST /api/exercises
 * Create a new exercise (Doctor only)
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role_id;

    // Only doctors can create exercises
    if (userRole !== 2) { // Assuming role_id 2 = doctor
      return res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: 'Only doctors can create exercises'
      });
    }

    const exercise = await exerciseService.createExercise(req.body, userId);

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Exercise created successfully',
      data: exercise
    });
  } catch (error: any) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to create exercise'
    });
  }
});

/**
 * GET /api/exercises
 * Get all exercises (with optional filters)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { created_by, is_active, difficulty_level, target_body_part } = req.query;

    const filters: any = {};
    if (created_by) filters.created_by = Number(created_by);
    if (is_active !== undefined) filters.is_active = is_active === 'true';
    if (difficulty_level) filters.difficulty_level = difficulty_level as string;
    if (target_body_part) filters.target_body_part = target_body_part as string;

    const exercises = await exerciseService.getAllExercises(filters);

    res.json({
      success: true,
      data: exercises,
      count: exercises.length
    });
  } catch (error: any) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch exercises'
    });
  }
});

/**
 * GET /api/exercises/active
 * Get all active exercises (for patients)
 */
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const exercises = await exerciseService.getActiveExercises();

    res.json({
      success: true,
      data: exercises,
      count: exercises.length
    });
  } catch (error: any) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch active exercises'
    });
  }
});

/**
 * GET /api/exercises/:id
 * Get exercise by ID
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const exerciseId = Number(req.params.id);
    const exercise = await exerciseService.getExerciseById(exerciseId);

    if (!exercise) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    res.json({
      success: true,
      data: exercise
    });
  } catch (error: any) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch exercise'
    });
  }
});

/**
 * PUT /api/exercises/:id
 * Update exercise (Doctor only, creator only)
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const exerciseId = Number(req.params.id);

    const exercise = await exerciseService.updateExercise(exerciseId, req.body, userId);

    res.json({
      success: true,
      message: 'Exercise updated successfully',
      data: exercise
    });
  } catch (error: any) {
    const status = error.message.includes('Unauthorized') 
      ? HttpStatus.FORBIDDEN 
      : error.message.includes('not found')
      ? HttpStatus.NOT_FOUND
      : HttpStatus.BAD_REQUEST;

    res.status(status).json({
      success: false,
      message: error.message || 'Failed to update exercise'
    });
  }
});

/**
 * DELETE /api/exercises/:id
 * Delete exercise (Doctor only, creator only)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const exerciseId = Number(req.params.id);

    await exerciseService.deleteExercise(exerciseId, userId);

    res.json({
      success: true,
      message: 'Exercise deleted successfully'
    });
  } catch (error: any) {
    const status = error.message.includes('Unauthorized') 
      ? HttpStatus.FORBIDDEN 
      : error.message.includes('not found')
      ? HttpStatus.NOT_FOUND
      : HttpStatus.BAD_REQUEST;

    res.status(status).json({
      success: false,
      message: error.message || 'Failed to delete exercise'
    });
  }
});

// ==================== Exercise Evaluation ====================

/**
 * POST /api/exercises/evaluate
 * Submit exercise evaluation (Patient)
 */
router.post('/evaluate', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { exercise_id, patient_frames, pain_level, fatigue_level, patient_notes } = req.body;

    if (!exercise_id || !patient_frames || !Array.isArray(patient_frames)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'exercise_id and patient_frames are required'
      });
    }

    const evaluation = await evaluationService.evaluateExercise(
      exercise_id,
      userId,
      patient_frames,
      pain_level,
      fatigue_level,
      patient_notes
    );

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Exercise evaluation completed',
      data: evaluation
    });
  } catch (error: any) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to evaluate exercise'
    });
  }
});

/**
 * GET /api/exercises/evaluations
 * Get all evaluations (with filters)
 */
router.get('/evaluations/all', authMiddleware, async (req, res) => {
  try {
    const { exercise_id, patient_id, has_alerts, doctor_reviewed, date_from, date_to } = req.query;

    const filters: any = {};
    if (exercise_id) filters.exercise_id = Number(exercise_id);
    if (patient_id) filters.patient_id = Number(patient_id);
    if (has_alerts !== undefined) filters.has_alerts = has_alerts === 'true';
    if (doctor_reviewed !== undefined) filters.doctor_reviewed = doctor_reviewed === 'true';
    if (date_from) filters.date_from = date_from as string;
    if (date_to) filters.date_to = date_to as string;

    const evaluations = await evaluationService.getAllEvaluations(filters);

    res.json({
      success: true,
      data: evaluations,
      count: evaluations.length
    });
  } catch (error: any) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch evaluations'
    });
  }
});

/**
 * GET /api/exercises/evaluations/alerts
 * Get evaluations with alerts (for doctor review)
 */
router.get('/evaluations/alerts', authMiddleware, async (req, res) => {
  try {
    const userRole = (req as any).user.role_id;

    // Only doctors can view alerts
    if (userRole !== 2) {
      return res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: 'Only doctors can view alerts'
      });
    }

    const evaluations = await evaluationService.getEvaluationsWithAlerts();

    res.json({
      success: true,
      data: evaluations,
      count: evaluations.length
    });
  } catch (error: any) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch alerts'
    });
  }
});

/**
 * GET /api/exercises/evaluations/my
 * Get my evaluations (Patient)
 */
router.get('/evaluations/my', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const evaluations = await evaluationService.getPatientEvaluations(userId, limit);

    res.json({
      success: true,
      data: evaluations,
      count: evaluations.length
    });
  } catch (error: any) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch evaluations'
    });
  }
});

/**
 * GET /api/exercises/evaluations/:id
 * Get evaluation by ID
 */
router.get('/evaluations/:id', authMiddleware, async (req, res) => {
  try {
    const evaluationId = Number(req.params.id);
    const evaluation = await evaluationService.getEvaluationById(evaluationId);

    if (!evaluation) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'Evaluation not found'
      });
    }

    res.json({
      success: true,
      data: evaluation
    });
  } catch (error: any) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch evaluation'
    });
  }
});

/**
 * POST /api/exercises/evaluations/:id/review
 * Add doctor review to evaluation
 */
router.post('/evaluations/:id/review', authMiddleware, async (req, res) => {
  try {
    const doctorId = (req as any).user.id;
    const userRole = (req as any).user.role_id;
    const evaluationId = Number(req.params.id);
    const { notes } = req.body;

    // Only doctors can review
    if (userRole !== 2) {
      return res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: 'Only doctors can review evaluations'
      });
    }

    if (!notes) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Doctor notes are required'
      });
    }

    const evaluation = await evaluationService.addDoctorReview(evaluationId, doctorId, notes);

    res.json({
      success: true,
      message: 'Review added successfully',
      data: evaluation
    });
  } catch (error: any) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to add review'
    });
  }
});

// ==================== Statistics & Progress ====================

/**
 * GET /api/exercises/stats/my
 * Get my exercise statistics (Patient)
 */
router.get('/stats/my', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const exerciseId = req.query.exercise_id ? Number(req.query.exercise_id) : undefined;

    const stats = await evaluationService.getPatientExerciseStats(userId, exerciseId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch statistics'
    });
  }
});

/**
 * GET /api/exercises/progress/my
 * Get my progress summary (Patient)
 */
router.get('/progress/my', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const progress = await evaluationService.getPatientProgress(userId);

    res.json({
      success: true,
      data: progress
    });
  } catch (error: any) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch progress'
    });
  }
});

/**
 * GET /api/exercises/stats/patient/:patientId
 * Get patient statistics (Doctor view)
 */
router.get('/stats/patient/:patientId', authMiddleware, async (req, res) => {
  try {
    const userRole = (req as any).user.role_id;
    const patientId = Number(req.params.patientId);

    // Only doctors can view patient stats
    if (userRole !== 2) {
      return res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: 'Only doctors can view patient statistics'
      });
    }

    const exerciseId = req.query.exercise_id ? Number(req.query.exercise_id) : undefined;
    const stats = await evaluationService.getPatientExerciseStats(patientId, exerciseId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch patient statistics'
    });
  }
});

export default router;

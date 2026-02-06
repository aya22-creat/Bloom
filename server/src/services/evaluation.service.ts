/**
 * Evaluation Service
 * Business logic for exercise evaluations
 */

import { EvaluationRepository } from '../repositories/evaluation.repository';
import { ExerciseRepository } from '../repositories/exercise.repository';
import { 
  CreateEvaluationDto, 
  EvaluationDto, 
  DoctorReviewDto,
  ExerciseStatsDto,
  PoseFrame
} from '../dtos/exercise.dto';
import { 
  comparePoseFrames, 
  detectReps, 
  calculateStability,
  calculateExerciseScore 
} from '../utils/pose-comparison';

export class EvaluationService {
  private evaluationRepo: EvaluationRepository;
  private exerciseRepo: ExerciseRepository;

  constructor() {
    this.evaluationRepo = new EvaluationRepository();
    this.exerciseRepo = new ExerciseRepository();
  }

  /**
   * Evaluate patient exercise performance
   * Compares patient poses against reference exercise
   */
  async evaluateExercise(
    exerciseId: number,
    patientId: number,
    patientFrames: PoseFrame[],
    painLevel?: number,
    fatigueLevel?: number,
    patientNotes?: string
  ): Promise<EvaluationDto> {
    // Get reference exercise
    const exercise = await this.exerciseRepo.findById(exerciseId);
    if (!exercise) {
      throw new Error('Exercise not found');
    }

    const referenceFrames = exercise.reference_pose.frames;
    const tolerance = exercise.tolerance;

    // 1. Compare poses frame-by-frame
    const comparisons = patientFrames.map((patientFrame, idx) => {
      const refFrame = referenceFrames[Math.min(idx, referenceFrames.length - 1)];
      return comparePoseFrames(refFrame, patientFrame, tolerance);
    });

    // 2. Calculate average accuracy
    const avgSimilarity = comparisons.reduce((sum, c) => sum + c.similarity, 0) / comparisons.length;

    // 3. Detect reps (simplified - uses shoulder angle as example)
    const repDetection = detectReps(
      patientFrames,
      'left_shoulder' as keyof PoseFrame['angles'], // Target joint
      90, // Peak angle (arm raised)
      30, // Rest angle (arm down)
      tolerance
    );

    // 4. Calculate stability
    const stabilityScore = calculateStability(patientFrames);

    // 5. Check completion
    const hasCompleted = repDetection.reps >= exercise.expected_reps;

    // 6. Calculate overall score
    const scoreResult = calculateExerciseScore(
      avgSimilarity,
      repDetection.reps,
      exercise.expected_reps,
      stabilityScore,
      hasCompleted
    );

    // 7. Collect warnings
    const warnings: string[] = [];
    const allWarnings = comparisons.flatMap(c => c.warnings);
    const uniqueWarnings = [...new Set(allWarnings)];

    if (scoreResult.total < 40) {
      warnings.push('low_score');
    }
    if (stabilityScore < 50) {
      warnings.push('low_stability');
    }
    if (repDetection.reps < exercise.expected_reps * 0.7) {
      warnings.push('incomplete_reps');
    }
    if (uniqueWarnings.some(w => w.includes('unsafe'))) {
      warnings.push('safety_concern');
    }

    warnings.push(...uniqueWarnings.slice(0, 3)); // Add top 3 specific warnings

    // 8. Create simplified pose data (key frames only - privacy safe)
    const keyFrameIndices = [
      0, 
      Math.floor(patientFrames.length / 4),
      Math.floor(patientFrames.length / 2),
      Math.floor(patientFrames.length * 3 / 4),
      patientFrames.length - 1
    ];

    const simplifiedPose = {
      keyFrames: keyFrameIndices.map(idx => ({
        timestamp: patientFrames[idx].frame,
        angles: patientFrames[idx].angles || {}
      }))
    };

    // 9. Create evaluation DTO
    const evaluationData: CreateEvaluationDto = {
      exercise_id: exerciseId,
      patient_id: patientId,
      score: scoreResult.total,
      accuracy: Math.round(avgSimilarity),
      reps_completed: repDetection.reps,
      reps_expected: exercise.expected_reps,
      angle_score: scoreResult.breakdown.angle_score,
      rep_score: scoreResult.breakdown.rep_score,
      stability_score: scoreResult.breakdown.stability_score,
      completion_score: scoreResult.breakdown.completion_score,
      patient_pose: simplifiedPose,
      warnings,
      has_alerts: warnings.some(w => ['low_score', 'safety_concern', 'unsafe_angle'].includes(w)),
      pain_level: painLevel,
      fatigue_level: fatigueLevel,
      patient_notes: patientNotes
    };

    // 10. Save to database
    return this.evaluationRepo.create(evaluationData);
  }

  /**
   * Get evaluation by ID
   */
  async getEvaluationById(id: number): Promise<EvaluationDto | null> {
    return this.evaluationRepo.findById(id);
  }

  /**
   * Get all evaluations with filters
   */
  async getAllEvaluations(filters?: {
    exercise_id?: number;
    patient_id?: number;
    has_alerts?: boolean;
    doctor_reviewed?: boolean;
    date_from?: string;
    date_to?: string;
  }): Promise<EvaluationDto[]> {
    return this.evaluationRepo.findAll(filters);
  }

  /**
   * Get evaluations for a patient
   */
  async getPatientEvaluations(patientId: number, limit?: number): Promise<EvaluationDto[]> {
    return this.evaluationRepo.findByPatient(patientId, limit);
  }

  /**
   * Get evaluations with alerts (for doctor review)
   */
  async getEvaluationsWithAlerts(): Promise<EvaluationDto[]> {
    return this.evaluationRepo.findAll({ has_alerts: true, doctor_reviewed: false });
  }

  /**
   * Add doctor review to evaluation
   */
  async addDoctorReview(
    evaluationId: number,
    doctorId: number,
    notes: string
  ): Promise<EvaluationDto | null> {
    const evaluation = await this.evaluationRepo.findById(evaluationId);
    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    const review: DoctorReviewDto = {
      doctor_notes: notes,
      doctor_id: doctorId
    };

    const updated = this.evaluationRepo.addDoctorReview(evaluationId, review);
    if (!updated) {
      throw new Error('Failed to add doctor review');
    }

    return updated;
  }

  /**
   * Get exercise statistics for a patient
   */
  async getPatientExerciseStats(
    patientId: number,
    exerciseId?: number
  ): Promise<ExerciseStatsDto[]> {
    return this.evaluationRepo.getExerciseStats(patientId, exerciseId);
  }

  /**
   * Get patient progress summary
   */
  async getPatientProgress(patientId: number): Promise<{
    total_exercises: number;
    total_sessions: number;
    average_score: number;
    improvement_trend: number;
    last_session_date: string | null;
    alerts_count: number;
  }> {
    const stats = await this.evaluationRepo.getExerciseStats(patientId);

    const totalSessions = stats.reduce((sum, s) => sum + s.total_sessions, 0);
    const avgScore = stats.length > 0
      ? stats.reduce((sum, s) => sum + s.average_score, 0) / stats.length
      : 0;
    const totalAlerts = stats.reduce((sum, s) => sum + s.alerts_count, 0);
    const avgTrend = stats.length > 0
      ? stats.reduce((sum, s) => sum + s.improvement_trend, 0) / stats.length
      : 0;

    const lastSession = stats
      .map(s => s.last_session_date)
      .filter(d => d !== undefined)
      .sort()
      .reverse()[0] || null;

    return {
      total_exercises: stats.length,
      total_sessions: totalSessions,
      average_score: Math.round(avgScore),
      improvement_trend: Math.round(avgTrend),
      last_session_date: lastSession,
      alerts_count: totalAlerts
    };
  }
}

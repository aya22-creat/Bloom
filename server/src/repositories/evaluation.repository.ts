/**
 * Exercise Evaluation Repository
 * Database operations for exercise evaluations
 */

import { Database } from '../lib/database';
import { 
  CreateEvaluationDto, 
  EvaluationDto,
  DoctorReviewDto,
  SimplifiedPoseData,
  ExerciseStatsDto
} from '../dtos/exercise.dto';

export class EvaluationRepository {
  private get db() {
    return Database.syncDb;
  }

  /**
   * Create a new evaluation
   */
  create(data: CreateEvaluationDto): EvaluationDto {
    const stmt = this.db.prepare(`
      INSERT INTO exercise_evaluations (
        exercise_id, patient_id, score, accuracy,
        reps_completed, reps_expected,
        angle_score, rep_score, stability_score, completion_score,
        patient_pose, warnings, has_alerts,
        pain_level, fatigue_level, patient_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.exercise_id,
      data.patient_id,
      data.score,
      data.accuracy,
      data.reps_completed,
      data.reps_expected,
      data.angle_score,
      data.rep_score,
      data.stability_score,
      data.completion_score,
      data.patient_pose ? JSON.stringify(data.patient_pose) : null,
      data.warnings ? JSON.stringify(data.warnings) : null,
      data.has_alerts ? 1 : 0,
      data.pain_level || 0,
      data.fatigue_level || 0,
      data.patient_notes || null
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  /**
   * Find evaluation by ID
   */
  findById(id: number): EvaluationDto | null {
    const evaluation = this.db.prepare(`
      SELECT 
        ev.*,
        e.name as exercise_name,
        u.name as patient_name
      FROM exercise_evaluations ev
      LEFT JOIN exercises e ON ev.exercise_id = e.id
      LEFT JOIN users u ON ev.patient_id = u.id
      WHERE ev.id = ?
    `).get(id) as any;

    if (!evaluation) return null;

    return this.mapToDto(evaluation);
  }

  /**
   * Find all evaluations (with filters)
   */
  findAll(filters?: {
    exercise_id?: number;
    patient_id?: number;
    has_alerts?: boolean;
    doctor_reviewed?: boolean;
    date_from?: string;
    date_to?: string;
  }): EvaluationDto[] {
    let query = `
      SELECT 
        ev.*,
        e.name as exercise_name,
        u.name as patient_name
      FROM exercise_evaluations ev
      LEFT JOIN exercises e ON ev.exercise_id = e.id
      LEFT JOIN users u ON ev.patient_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.exercise_id) {
      query += ' AND ev.exercise_id = ?';
      params.push(filters.exercise_id);
    }

    if (filters?.patient_id) {
      query += ' AND ev.patient_id = ?';
      params.push(filters.patient_id);
    }

    if (filters?.has_alerts !== undefined) {
      query += ' AND ev.has_alerts = ?';
      params.push(filters.has_alerts ? 1 : 0);
    }

    if (filters?.doctor_reviewed !== undefined) {
      query += ' AND ev.doctor_reviewed = ?';
      params.push(filters.doctor_reviewed ? 1 : 0);
    }

    if (filters?.date_from) {
      query += ' AND ev.session_date >= ?';
      params.push(filters.date_from);
    }

    if (filters?.date_to) {
      query += ' AND ev.session_date <= ?';
      params.push(filters.date_to);
    }

    query += ' ORDER BY ev.session_date DESC';

    const evaluations = this.db.prepare(query).all(...params) as any[];

    return evaluations.map(e => this.mapToDto(e));
  }

  /**
   * Find evaluations by patient
   */
  findByPatient(patientId: number, limit?: number): EvaluationDto[] {
    let query = `
      SELECT 
        ev.*,
        e.name as exercise_name,
        u.name as patient_name
      FROM exercise_evaluations ev
      LEFT JOIN exercises e ON ev.exercise_id = e.id
      LEFT JOIN users u ON ev.patient_id = u.id
      WHERE ev.patient_id = ?
      ORDER BY ev.session_date DESC
    `;

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    const evaluations = this.db.prepare(query).all(patientId) as any[];

    return evaluations.map(e => this.mapToDto(e));
  }

  /**
   * Add doctor review to evaluation
   */
  addDoctorReview(evaluationId: number, review: DoctorReviewDto): EvaluationDto | null {
    const stmt = this.db.prepare(`
      UPDATE exercise_evaluations
      SET doctor_reviewed = 1,
          doctor_notes = ?,
          doctor_id = ?,
          reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(review.doctor_notes, review.doctor_id, evaluationId);

    return this.findById(evaluationId);
  }

  /**
   * Get exercise statistics for a patient
   */
  getExerciseStats(patientId: number, exerciseId?: number): ExerciseStatsDto[] {
    let query = `
      SELECT 
        e.id as exercise_id,
        e.name as exercise_name,
        COUNT(ev.id) as total_sessions,
        AVG(ev.score) as average_score,
        AVG(ev.accuracy) as average_accuracy,
        AVG(CAST(ev.reps_completed AS FLOAT) / ev.reps_expected * 100) as completion_rate,
        MAX(ev.session_date) as last_session_date,
        SUM(CASE WHEN ev.has_alerts = 1 THEN 1 ELSE 0 END) as alerts_count
      FROM exercises e
      LEFT JOIN exercise_evaluations ev ON e.id = ev.exercise_id AND ev.patient_id = ?
    `;
    const params: any[] = [patientId];

    if (exerciseId) {
      query += ' WHERE e.id = ?';
      params.push(exerciseId);
    }

    query += ' GROUP BY e.id, e.name';

    const stats = this.db.prepare(query).all(...params) as any[];

    return stats.map(stat => {
      // Calculate improvement trend (compare last 3 vs previous 3)
      const recentScores = this.db.prepare(`
        SELECT score FROM exercise_evaluations
        WHERE exercise_id = ? AND patient_id = ?
        ORDER BY session_date DESC
        LIMIT 6
      `).all(stat.exercise_id, patientId) as any[];

      let improvement_trend = 0;
      if (recentScores.length >= 6) {
        const recent = recentScores.slice(0, 3).reduce((sum: number, s: any) => sum + s.score, 0) / 3;
        const previous = recentScores.slice(3, 6).reduce((sum: number, s: any) => sum + s.score, 0) / 3;
        improvement_trend = recent - previous;
      }

      return {
        exercise_id: stat.exercise_id,
        exercise_name: stat.exercise_name,
        total_sessions: stat.total_sessions || 0,
        average_score: Math.round(stat.average_score || 0),
        average_accuracy: Math.round(stat.average_accuracy || 0),
        completion_rate: Math.round(stat.completion_rate || 0),
        improvement_trend: Math.round(improvement_trend),
        last_session_date: stat.last_session_date,
        alerts_count: stat.alerts_count || 0
      };
    });
  }

  /**
   * Map database row to DTO
   */
  private mapToDto(row: any): EvaluationDto {
    return {
      id: row.id,
      exercise_id: row.exercise_id,
      exercise_name: row.exercise_name,
      patient_id: row.patient_id,
      patient_name: row.patient_name,
      session_date: row.session_date,
      score: row.score,
      accuracy: row.accuracy,
      reps_completed: row.reps_completed,
      reps_expected: row.reps_expected,
      angle_score: row.angle_score,
      rep_score: row.rep_score,
      stability_score: row.stability_score,
      completion_score: row.completion_score,
      patient_pose: row.patient_pose ? JSON.parse(row.patient_pose) as SimplifiedPoseData : undefined,
      warnings: row.warnings ? JSON.parse(row.warnings) : undefined,
      has_alerts: Boolean(row.has_alerts),
      pain_level: row.pain_level,
      fatigue_level: row.fatigue_level,
      patient_notes: row.patient_notes,
      doctor_reviewed: Boolean(row.doctor_reviewed),
      doctor_notes: row.doctor_notes,
      doctor_id: row.doctor_id,
      reviewed_at: row.reviewed_at,
      created_at: row.created_at
    };
  }
}

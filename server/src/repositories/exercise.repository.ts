/**
 * Exercise Repository
 * Database operations for exercises
 */

import { Database } from '../lib/database';
import { 
  CreateExerciseDto, 
  UpdateExerciseDto, 
  ExerciseDto,
  ReferencePoseData 
} from '../dtos/exercise.dto';

export class ExerciseRepository {
  private get db() {
    return Database.syncDb;
  }

  /**
   * Create a new exercise
   */
  create(data: CreateExerciseDto, createdBy: number): ExerciseDto {
    const stmt = this.db.prepare(`
      INSERT INTO exercises (
        name, name_ar, description, description_ar,
        created_by, reference_pose, expected_reps, hold_seconds,
        tolerance, difficulty_level, target_body_part,
        instructions, instructions_ar, warnings
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.name,
      data.name_ar,
      data.description || null,
      data.description_ar || null,
      createdBy,
      JSON.stringify(data.reference_pose),
      data.expected_reps,
      data.hold_seconds || 0,
      data.tolerance || 15,
      data.difficulty_level || 'medium',
      data.target_body_part || null,
      data.instructions || null,
      data.instructions_ar || null,
      data.warnings ? JSON.stringify(data.warnings) : null
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  /**
   * Find exercise by ID
   */
  findById(id: number): ExerciseDto | null {
    const exercise = this.db.prepare(`
      SELECT 
        e.*,
        u.name as creator_name
      FROM exercises e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `).get(id) as any;

    if (!exercise) return null;

    return this.mapToDto(exercise);
  }

  /**
   * Find all exercises (with optional filters)
   */
  findAll(filters?: {
    created_by?: number;
    is_active?: boolean;
    difficulty_level?: string;
    target_body_part?: string;
  }): ExerciseDto[] {
    let query = `
      SELECT 
        e.*,
        u.name as creator_name
      FROM exercises e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.created_by) {
      query += ' AND e.created_by = ?';
      params.push(filters.created_by);
    }

    if (filters?.is_active !== undefined) {
      query += ' AND e.is_active = ?';
      params.push(filters.is_active ? 1 : 0);
    }

    if (filters?.difficulty_level) {
      query += ' AND e.difficulty_level = ?';
      params.push(filters.difficulty_level);
    }

    if (filters?.target_body_part) {
      query += ' AND e.target_body_part = ?';
      params.push(filters.target_body_part);
    }

    query += ' ORDER BY e.created_at DESC';

    const exercises = this.db.prepare(query).all(...params) as any[];

    return exercises.map(e => this.mapToDto(e));
  }

  /**
   * Update exercise
   */
  update(id: number, data: UpdateExerciseDto): ExerciseDto | null {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.name_ar !== undefined) {
      updates.push('name_ar = ?');
      params.push(data.name_ar);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }
    if (data.description_ar !== undefined) {
      updates.push('description_ar = ?');
      params.push(data.description_ar);
    }
    if (data.reference_pose !== undefined) {
      updates.push('reference_pose = ?');
      params.push(JSON.stringify(data.reference_pose));
    }
    if (data.expected_reps !== undefined) {
      updates.push('expected_reps = ?');
      params.push(data.expected_reps);
    }
    if (data.hold_seconds !== undefined) {
      updates.push('hold_seconds = ?');
      params.push(data.hold_seconds);
    }
    if (data.tolerance !== undefined) {
      updates.push('tolerance = ?');
      params.push(data.tolerance);
    }
    if (data.difficulty_level !== undefined) {
      updates.push('difficulty_level = ?');
      params.push(data.difficulty_level);
    }
    if (data.target_body_part !== undefined) {
      updates.push('target_body_part = ?');
      params.push(data.target_body_part);
    }
    if (data.instructions !== undefined) {
      updates.push('instructions = ?');
      params.push(data.instructions);
    }
    if (data.instructions_ar !== undefined) {
      updates.push('instructions_ar = ?');
      params.push(data.instructions_ar);
    }
    if (data.warnings !== undefined) {
      updates.push('warnings = ?');
      params.push(JSON.stringify(data.warnings));
    }
    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(data.is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = this.db.prepare(`
      UPDATE exercises
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...params);

    return this.findById(id);
  }

  /**
   * Delete exercise
   */
  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM exercises WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Map database row to DTO
   */
  private mapToDto(row: any): ExerciseDto {
    return {
      id: row.id,
      name: row.name,
      name_ar: row.name_ar,
      description: row.description,
      description_ar: row.description_ar,
      created_by: row.created_by,
      creator_name: row.creator_name,
      reference_pose: JSON.parse(row.reference_pose) as ReferencePoseData,
      expected_reps: row.expected_reps,
      hold_seconds: row.hold_seconds,
      tolerance: row.tolerance,
      difficulty_level: row.difficulty_level,
      target_body_part: row.target_body_part,
      instructions: row.instructions,
      instructions_ar: row.instructions_ar,
      warnings: row.warnings ? JSON.parse(row.warnings) : undefined,
      is_active: Boolean(row.is_active),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}

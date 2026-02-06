/**
 * Exercise Service
 * Business logic for exercise management
 */

import { ExerciseRepository } from '../repositories/exercise.repository';
import { CreateExerciseDto, UpdateExerciseDto, ExerciseDto, PoseFrame } from '../dtos/exercise.dto';
import { extractAngles } from '../utils/pose-comparison';

export class ExerciseService {
  private exerciseRepo: ExerciseRepository;

  constructor() {
    this.exerciseRepo = new ExerciseRepository();
  }

  /**
   * Create a new exercise
   * Validates and processes reference pose data
   */
  async createExercise(data: CreateExerciseDto, createdBy: number): Promise<ExerciseDto> {
    // Validate reference pose data
    if (!data.reference_pose || !data.reference_pose.frames || data.reference_pose.frames.length === 0) {
      throw new Error('Reference pose data is required');
    }

    // Extract angles from landmarks if not already present
    data.reference_pose.frames = data.reference_pose.frames.map(frame => {
      if (!frame.angles && frame.landmarks) {
        frame.angles = extractAngles(frame.landmarks);
      }
      return frame;
    });

    return this.exerciseRepo.create(data, createdBy);
  }

  /**
   * Get exercise by ID
   */
  async getExerciseById(id: number): Promise<ExerciseDto | null> {
    return this.exerciseRepo.findById(id);
  }

  /**
   * Get all exercises with optional filters
   */
  async getAllExercises(filters?: {
    created_by?: number;
    is_active?: boolean;
    difficulty_level?: string;
    target_body_part?: string;
  }): Promise<ExerciseDto[]> {
    return this.exerciseRepo.findAll(filters);
  }

  /**
   * Get active exercises for patients
   */
  async getActiveExercises(): Promise<ExerciseDto[]> {
    return this.exerciseRepo.findAll({ is_active: true });
  }

  /**
   * Get exercises created by a specific doctor
   */
  async getExercisesByDoctor(doctorId: number): Promise<ExerciseDto[]> {
    return this.exerciseRepo.findAll({ created_by: doctorId });
  }

  /**
   * Update exercise
   */
  async updateExercise(id: number, data: UpdateExerciseDto, userId: number): Promise<ExerciseDto | null> {
    // Check if exercise exists and user has permission
    const exercise = await this.exerciseRepo.findById(id);
    if (!exercise) {
      throw new Error('Exercise not found');
    }

    // Only creator can update (or admin - add role check if needed)
    if (exercise.created_by !== userId) {
      throw new Error('Unauthorized to update this exercise');
    }

    // Process reference pose if updated
    if (data.reference_pose && data.reference_pose.frames) {
      data.reference_pose.frames = data.reference_pose.frames.map(frame => {
        if (!frame.angles && frame.landmarks) {
          frame.angles = extractAngles(frame.landmarks);
        }
        return frame;
      });
    }

    const updated = this.exerciseRepo.update(id, data);
    if (!updated) {
      throw new Error('Failed to update exercise');
    }

    return updated;
  }

  /**
   * Delete exercise
   */
  async deleteExercise(id: number, userId: number): Promise<void> {
    // Check if exercise exists and user has permission
    const exercise = await this.exerciseRepo.findById(id);
    if (!exercise) {
      throw new Error('Exercise not found');
    }

    // Only creator can delete
    if (exercise.created_by !== userId) {
      throw new Error('Unauthorized to delete this exercise');
    }

    const deleted = this.exerciseRepo.delete(id);
    if (!deleted) {
      throw new Error('Failed to delete exercise');
    }
  }

  /**
   * Deactivate exercise (soft delete)
   */
  async deactivateExercise(id: number, userId: number): Promise<ExerciseDto | null> {
    return this.updateExercise(id, { is_active: false }, userId);
  }
}

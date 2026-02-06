/**
 * Data Transfer Objects for Exercise Evaluation System
 */

/**
 * Pose Landmark - Represents a single body keypoint
 * Based on MediaPipe Pose 33-point model
 */
export interface PoseLandmark {
  x: number; // Normalized 0-1 (horizontal position)
  y: number; // Normalized 0-1 (vertical position)
  z: number; // Depth (relative to hips)
  visibility: number; // 0-1 confidence score
}

/**
 * Pose Frame - Complete pose data for a single video frame
 */
export interface PoseFrame {
  frame: number; // Frame number or timestamp
  landmarks: PoseLandmark[]; // 33 keypoints from MediaPipe
  // Calculated angles for easier comparison
  angles?: {
    left_shoulder?: number;
    right_shoulder?: number;
    left_elbow?: number;
    right_elbow?: number;
    left_hip?: number;
    right_hip?: number;
    left_knee?: number;
    right_knee?: number;
  };
}

/**
 * Reference Pose Data - Stored with each exercise
 */
export interface ReferencePoseData {
  frames: PoseFrame[]; // Pose data for each frame
  fps: number; // Frames per second of original video
  duration: number; // Total duration in seconds
  keyFrames?: number[]; // Important frame indices (e.g., peak positions)
}

/**
 * Create Exercise DTO - Doctor uploads reference exercise
 */
export interface CreateExerciseDto {
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  reference_pose: ReferencePoseData; // Extracted from video
  expected_reps: number;
  hold_seconds?: number;
  tolerance?: number; // Angle tolerance in degrees (default: 15)
  difficulty_level?: 'easy' | 'medium' | 'hard';
  target_body_part?: string;
  instructions?: string;
  instructions_ar?: string;
  warnings?: string[]; // Safety warnings
}

/**
 * Update Exercise DTO
 */
export interface UpdateExerciseDto {
  name?: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  reference_pose?: ReferencePoseData;
  expected_reps?: number;
  hold_seconds?: number;
  tolerance?: number;
  difficulty_level?: 'easy' | 'medium' | 'hard';
  target_body_part?: string;
  instructions?: string;
  instructions_ar?: string;
  warnings?: string[];
  is_active?: boolean;
}

/**
 * Exercise Response DTO
 */
export interface ExerciseDto {
  id: number;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  created_by: number;
  creator_name?: string; // Populated via join
  reference_pose: ReferencePoseData;
  expected_reps: number;
  hold_seconds: number;
  tolerance: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
  target_body_part?: string;
  instructions?: string;
  instructions_ar?: string;
  warnings?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Exercise Evaluation Submission - Patient completes exercise
 */
export interface CreateEvaluationDto {
  exercise_id: number;
  patient_id: number;
  
  // Performance metrics
  score: number; // 0-100
  accuracy: number; // Pose accuracy percentage
  reps_completed: number;
  reps_expected: number;
  
  // Quality breakdown
  angle_score: number; // 0-40
  rep_score: number; // 0-30
  stability_score: number; // 0-20
  completion_score: number; // 0-10
  
  // Optional: Simplified pose data for review (no video!)
  patient_pose?: SimplifiedPoseData;
  
  // Warnings detected
  warnings?: string[]; // ["low_stability", "unsafe_angle", etc.]
  has_alerts?: boolean;
  
  // Patient feedback
  pain_level?: number; // 0-10
  fatigue_level?: number; // 0-10
  patient_notes?: string;
}

/**
 * Simplified Pose Data - Only key frames for review (privacy-safe)
 */
export interface SimplifiedPoseData {
  keyFrames: Array<{
    timestamp: number;
    angles: {
      left_shoulder?: number;
      right_shoulder?: number;
      left_elbow?: number;
      right_elbow?: number;
      left_knee?: number;
      right_knee?: number;
    };
  }>;
}

/**
 * Exercise Evaluation Response DTO
 */
export interface EvaluationDto {
  id: number;
  exercise_id: number;
  exercise_name?: string; // Populated via join
  patient_id: number;
  patient_name?: string;
  session_date: string;
  
  // Performance
  score: number;
  accuracy: number;
  reps_completed: number;
  reps_expected: number;
  
  // Quality
  angle_score: number;
  rep_score: number;
  stability_score: number;
  completion_score: number;
  
  // Data
  patient_pose?: SimplifiedPoseData;
  warnings?: string[];
  has_alerts: boolean;
  
  // Feedback
  pain_level: number;
  fatigue_level: number;
  patient_notes?: string;
  
  // Review
  doctor_reviewed: boolean;
  doctor_notes?: string;
  doctor_id?: number;
  reviewed_at?: string;
  
  created_at: string;
}

/**
 * Doctor Review DTO
 */
export interface DoctorReviewDto {
  doctor_notes: string;
  doctor_id: number;
}

/**
 * Pose Comparison Result
 */
export interface PoseComparisonResult {
  similarity: number; // 0-100
  angle_differences: {
    joint: string;
    reference_angle: number;
    patient_angle: number;
    difference: number;
  }[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Real-time Feedback Message
 */
export interface RealtimeFeedback {
  type: 'warning' | 'correction' | 'success' | 'info';
  message: string;
  message_ar: string;
  joint?: string; // Which joint needs correction
  severity?: 'low' | 'medium' | 'high';
}

/**
 * Exercise Statistics for Dashboard
 */
export interface ExerciseStatsDto {
  exercise_id: number;
  exercise_name: string;
  total_sessions: number;
  average_score: number;
  average_accuracy: number;
  completion_rate: number; // Percentage of expected reps completed
  improvement_trend: number; // Positive or negative
  last_session_date?: string;
  alerts_count: number;
}

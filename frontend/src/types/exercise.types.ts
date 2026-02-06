/**
 * Frontend Types for Exercise Evaluation System
 */

// Re-export types that match backend DTOs
export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PoseFrame {
  frame: number;
  landmarks: PoseLandmark[];
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

export interface ReferencePoseData {
  frames: PoseFrame[];
  fps: number;
  duration: number;
  keyFrames?: number[];
}

export interface Exercise {
  id: number;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  created_by: number;
  creator_name?: string;
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

export interface ExerciseEvaluation {
  id: number;
  exercise_id: number;
  exercise_name?: string;
  patient_id: number;
  patient_name?: string;
  session_date: string;
  score: number;
  accuracy: number;
  reps_completed: number;
  reps_expected: number;
  angle_score: number;
  rep_score: number;
  stability_score: number;
  completion_score: number;
  warnings?: string[];
  has_alerts: boolean;
  pain_level: number;
  fatigue_level: number;
  patient_notes?: string;
  doctor_reviewed: boolean;
  doctor_notes?: string;
  doctor_id?: number;
  reviewed_at?: string;
  created_at: string;
}

export interface RealtimeFeedback {
  type: 'warning' | 'correction' | 'success' | 'info';
  message: string;
  message_ar: string;
  joint?: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface ExerciseStats {
  exercise_id: number;
  exercise_name: string;
  total_sessions: number;
  average_score: number;
  average_accuracy: number;
  completion_rate: number;
  improvement_trend: number;
  last_session_date?: string;
  alerts_count: number;
}

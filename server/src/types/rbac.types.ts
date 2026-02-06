/**
 * Type definitions for role-based access control
 */

export type UserRole = 'patient' | 'doctor' | 'admin';

export type UserType = 'fighter' | 'survivor' | 'wellness';

export interface User {
  id: number;
  username: string;
  email: string;
  password?: string; // Only when creating/updating
  role: UserRole;
  userType?: UserType;
  approved: boolean;
  assigned_doctor_id?: number | null;
  language: 'ar' | 'en';
  created_at: string;
  updated_at?: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
  userType?: UserType;
  language: 'ar' | 'en';
  approved: boolean;
  iat?: number; // Issued at timestamp
  exp?: number; // Expiration timestamp
}

// Chat types
export type ChatRoomType = 'global' | 'private';

export interface ChatRoom {
  id: number;
  type: ChatRoomType;
  patient_id: number | null;
  doctor_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  room_id: number;
  sender_id: number;
  sender_name?: string;
  sender_role?: UserRole;
  message: string;
  attachments?: string; // JSON string
  is_reported: boolean;
  is_deleted: boolean;
  created_at: string;
}

// Exercise types
export interface ExerciseEvaluation {
  id: number;
  patient_id: number;
  exercise_id?: number | null;
  exercise_name: string;
  completed: boolean;
  pain_level: number; // 0-10
  fatigue_level: number; // 0-10
  notes?: string;
  score: number; // 0-100, calculated
  created_at: string;
}

export interface ExerciseEvaluationInput {
  exercise_name: string;
  completed: boolean;
  pain_level: number;
  fatigue_level: number;
  notes?: string;
}

// Reminder types
export type ReminderTargetType = 'patient' | 'group' | 'all';
export type ReminderType = 'medicine' | 'appointment' | 'exercise' | 'self-exam' | 'custom';
export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly';

export interface Reminder {
  id: number;
  target_type: ReminderTargetType;
  target_id?: number | null;
  user_type?: UserType;
  title: string;
  description?: string;
  type: ReminderType;
  scheduled_time: string;
  recurrence: RecurrenceType;
  is_active: boolean;
  last_sent_at?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface ReminderInput {
  target_type: ReminderTargetType;
  target_id?: number;
  user_type?: UserType;
  title: string;
  description?: string;
  type: ReminderType;
  scheduled_time: string;
  recurrence?: RecurrenceType;
}

// Audit log types
export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  entity_type?: string;
  entity_id?: number;
  details?: string; // JSON string
  ip_address?: string;
  created_at: string;
}

// Admin dashboard stats
export interface AdminStats {
  total_patients: number;
  total_doctors: number;
  pending_doctors: number;
  active_reminders: number;
  flagged_messages: number;
  low_compliance_patients: number;
  total_evaluations_today: number;
  high_risk_alerts: number;
}

// Doctor dashboard types
export interface PatientSummary {
  id: number;
  username: string;
  email: string;
  userType: UserType;
  language: 'ar' | 'en';
  exercise_completion_rate: number; // 0-100
  last_evaluation_date: string | null;
  risk_alerts: RiskAlert[];
  medication_adherence: number; // 0-100
}

export interface RiskAlert {
  type: 'high_pain' | 'low_score' | 'missed_medication' | 'no_evaluation';
  severity: 'low' | 'medium' | 'high';
  message: string;
  date: string;
}

// Socket.io events
export interface SocketEvents {
  'message:received': (data: ChatMessage) => void;
  'message:deleted': (data: { messageId: number; roomId: number }) => void;
  'user:typing': (data: { userId: number; userName: string; roomId: number }) => void;
  'room:joined': (data: { roomId: number; userId: number }) => void;
  'notification:reminder': (data: Reminder) => void;
}

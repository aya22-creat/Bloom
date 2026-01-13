export interface SelfExam {
  id?: number;
  user_id: number;
  performed_at?: string;
  findings?: string;
  pain_level?: number; // 0-10
  notes?: string;
  created_at?: string;
}
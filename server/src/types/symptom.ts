export interface Symptom {
  id?: number;
  user_id: number;
  date?: string;
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
  created_at?: string;
}
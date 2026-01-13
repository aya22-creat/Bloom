export interface Reminder {
  id?: number;
  user_id: number;
  title: string;
  description?: string;
  type: 'checkup' | 'appointment' | 'water' | 'exercise';
  time?: string;     // 'HH:MM'
  date?: string;     // 'YYYY-MM-DD'
  days?: string[];   // ['monday','wednesday']
  interval?: string; // 'every_2_hours'
  enabled?: number;  // 1 or 0
  created_at?: string;
}
export interface Reminder {
  id?: number;
  user_id: number;
  title: string;
  description?: string;
  type: 'checkup' | 'appointment' | 'water' | 'exercise';
  reminder_time?: string;
  time?: string;     // 'HH:MM'
  date?: string;     // 'YYYY-MM-DD'
  days?: string[];   // ['monday','wednesday']
  interval?: string; // 'every_2_hours'
  enabled?: number;  // 1 or 0
  mandatory?: number; // 1 or 0
  created_by?: 'user' | 'doctor';
  telegram_sent?: number; // 1 or 0
  telegram_sent_at?: string;
  telegram_attempts?: number;
  telegram_last_attempt_at?: string;
  created_at?: string;
}

export interface Cycle {
  id?: number;
  user_id: number;
  start_date: string;
  end_date?: string;
  cycle_length?: number;
  notes?: string;
  created_at?: string;
}

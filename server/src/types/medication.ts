export interface Medication {
  id?: number;
  user_id: number;
  name: string;
  dosage?: string;
  schedule?: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
}

export interface MedicationLog {
  id?: number;
  medication_id: number;
  user_id: number;
  taken_at?: string;
  status: 'taken' | 'missed';
  notes?: string;
}
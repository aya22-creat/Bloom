export interface QuestionnaireResponse {
  id?: number;
  user_id: number;
  submitted_at?: string;
  answers: unknown; // Store parsed JSON in code; persisted as TEXT
  result?: unknown; // Optional summary/result JSON
}
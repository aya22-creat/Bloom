/**
 * Symptom DTOs - Data Transfer Objects for symptom tracking
 */

export namespace SymptomDTO {
  export interface CreateRequest {
    symptomType: string;
    severity: 1 | 2 | 3 | 4 | 5;
    notes?: string;
    date: Date;
  }

  export interface UpdateRequest {
    severity?: 1 | 2 | 3 | 4 | 5;
    notes?: string;
  }

  export interface Response {
    id: number;
    userId: number;
    symptomType: string;
    severity: number;
    notes?: string;
    date: Date;
    createdAt: Date;
    updatedAt?: Date;
  }
}

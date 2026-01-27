/**
 * Medication DTOs - Data Transfer Objects for medication management
 */

export namespace MedicationDTO {
  export interface CreateRequest {
    name: string;
    dosage: string;
    frequency: string;
    reason: string;
    startDate: Date;
    endDate?: Date;
    sideEffects?: string[];
    notes?: string;
  }

  export interface UpdateRequest {
    dosage?: string;
    frequency?: string;
    reason?: string;
    endDate?: Date;
    sideEffects?: string[];
    notes?: string;
  }

  export interface Response {
    id: number;
    userId: number;
    name: string;
    dosage: string;
    frequency: string;
    reason: string;
    startDate: Date;
    endDate?: Date;
    sideEffects?: string[];
    notes?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
  }
}

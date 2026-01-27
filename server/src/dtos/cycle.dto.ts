/**
 * Cycle DTOs - Data Transfer Objects for cycle tracking
 */

export namespace CycleDTO {
  export interface CreateRequest {
    startDate: Date;
    endDate?: Date;
    flowIntensity?: 'light' | 'medium' | 'heavy';
    notes?: string;
  }

  export interface UpdateRequest {
    endDate?: Date;
    flowIntensity?: 'light' | 'medium' | 'heavy';
    notes?: string;
  }

  export interface Response {
    id: number;
    userId: number;
    startDate: Date;
    endDate?: Date;
    durationDays: number;
    flowIntensity?: string;
    notes?: string;
    createdAt: Date;
    updatedAt?: Date;
  }
}

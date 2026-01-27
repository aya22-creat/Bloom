/**
 * SymptomService - Business logic for symptom tracking
 */

import { Symptom } from '../types/symptom';

export interface ISymptomService {
  getUserSymptoms(userId: number): Promise<Symptom[]>;
  createSymptom(userId: number, data: Partial<Symptom>): Promise<Symptom>;
  updateSymptom(id: number, data: Partial<Symptom>): Promise<Symptom>;
  deleteSymptom(id: number): Promise<boolean>;
}

export class SymptomService implements ISymptomService {
  async getUserSymptoms(userId: number): Promise<Symptom[]> {
    // TODO: Implement when SymptomRepository is created
    return [];
  }

  async createSymptom(userId: number, data: Partial<Symptom>): Promise<Symptom> {
    // TODO: Implement business logic for symptom creation
    throw new Error('Not implemented');
  }

  async updateSymptom(id: number, data: Partial<Symptom>): Promise<Symptom> {
    // TODO: Implement when SymptomRepository is created
    throw new Error('Not implemented');
  }

  async deleteSymptom(id: number): Promise<boolean> {
    // TODO: Implement when SymptomRepository is created
    return false;
  }
}

export const symptomService = new SymptomService();

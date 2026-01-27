/**
 * MedicationService - Business logic for medication management
 */

import { Medication } from '../types/medication';

export interface IMedicationService {
  getUserMedications(userId: number): Promise<Medication[]>;
  createMedication(userId: number, data: Partial<Medication>): Promise<Medication>;
  updateMedication(id: number, data: Partial<Medication>): Promise<Medication>;
  deleteMedication(id: number): Promise<boolean>;
}

export class MedicationService implements IMedicationService {
  async getUserMedications(userId: number): Promise<Medication[]> {
    // TODO: Implement when MedicationRepository is created
    return [];
  }

  async createMedication(userId: number, data: Partial<Medication>): Promise<Medication> {
    // TODO: Implement business logic for medication creation
    throw new Error('Not implemented');
  }

  async updateMedication(id: number, data: Partial<Medication>): Promise<Medication> {
    // TODO: Implement when MedicationRepository is created
    throw new Error('Not implemented');
  }

  async deleteMedication(id: number): Promise<boolean> {
    // TODO: Implement when MedicationRepository is created
    return false;
  }
}

export const medicationService = new MedicationService();

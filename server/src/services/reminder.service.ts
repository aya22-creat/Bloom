/**
 * ReminderService - Business logic for health reminders
 */

import { Reminder } from '../types/reminder';

export interface IReminderService {
  getUserReminders(userId: number): Promise<Reminder[]>;
  createReminder(userId: number, data: Partial<Reminder>): Promise<Reminder>;
  updateReminder(id: number, data: Partial<Reminder>): Promise<Reminder>;
  deleteReminder(id: number): Promise<boolean>;
  getDueReminders(): Promise<Reminder[]>;
}

export class ReminderService implements IReminderService {
  async getUserReminders(userId: number): Promise<Reminder[]> {
    // TODO: Implement when ReminderRepository is created
    return [];
  }

  async createReminder(userId: number, data: Partial<Reminder>): Promise<Reminder> {
    // TODO: Implement business logic for reminder creation
    throw new Error('Not implemented');
  }

  async updateReminder(id: number, data: Partial<Reminder>): Promise<Reminder> {
    // TODO: Implement when ReminderRepository is created
    throw new Error('Not implemented');
  }

  async deleteReminder(id: number): Promise<boolean> {
    // TODO: Implement when ReminderRepository is created
    return false;
  }

  async getDueReminders(): Promise<Reminder[]> {
    // TODO: Implement business logic to fetch reminders that are due
    return [];
  }
}

export const reminderService = new ReminderService();

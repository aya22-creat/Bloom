/**
 * Reminder DTOs - Data Transfer Objects for reminders
 */

export namespace ReminderDTO {
  export interface CreateRequest {
    title: string;
    description?: string;
    type: 'medication' | 'checkup' | 'appointment' | 'selfexam' | 'general';
    reminderTime: Date;
    recurring?: boolean;
    recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  }

  export interface UpdateRequest {
    title?: string;
    description?: string;
    reminderTime?: Date;
    recurring?: boolean;
    recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    isCompleted?: boolean;
  }

  export interface Response {
    id: number;
    userId: number;
    title: string;
    description?: string;
    type: string;
    reminderTime: Date;
    recurring: boolean;
    recurringPattern?: string;
    isCompleted: boolean;
    lastSent?: Date;
    createdAt: Date;
    updatedAt?: Date;
  }
}

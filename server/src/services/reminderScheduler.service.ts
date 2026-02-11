import { Database, RunResult } from '../lib/database';
import { sendTelegramReminder } from './telegram.service';

let schedulerInterval: NodeJS.Timeout | null = null;

interface Reminder {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  date?: string;
  time?: string;
  created_by?: 'user' | 'doctor';
  enabled?: number;
  telegram_sent?: number;
}

const dbAll = <T = Record<string, unknown>>(query: string, params: unknown[] = []) =>
  new Promise<T[]>((resolve, reject) => {
    Database.db.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });

const dbRun = (query: string, params: unknown[] = []) =>
  new Promise<RunResult>((resolve, reject) => {
    Database.db.run(query, params, function (this: RunResult, err) {
      if (err) return reject(err);
      resolve({ lastID: this?.lastID || 0, changes: this?.changes || 0 });
    });
  });

// Start the reminder scheduler
export function startReminderScheduler() {
  if (schedulerInterval) {
    console.log('⚠️ Reminder scheduler already running');
    return;
  }

  console.log('🔔 Starting reminder scheduler...');

  // Check every minute
  schedulerInterval = setInterval(checkAndSendReminders, 60 * 1000);

  // Also check immediately
  checkAndSendReminders();

  console.log('✅ Reminder scheduler started (checks every minute)');
}

// Stop the scheduler
export function stopReminderScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('🛑 Reminder scheduler stopped');
  }
}

// Check for due reminders and send them
async function checkAndSendReminders() {
  const now = new Date();
  
  try {
    // Get current date and time
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    console.log(`🔍 Checking reminders at ${currentDate} ${currentTime}`);

    // Find reminders that are due (within the last 5 minutes to avoid missing)
    const reminders = await dbAll(
      `SELECT id, user_id, title, description, date, time, created_by, enabled, telegram_sent
       FROM reminders
       WHERE 
         (enabled = 1 OR enabled IS NULL) AND
         (telegram_sent = 0 OR telegram_sent IS NULL) AND
         date IS NOT NULL AND time IS NOT NULL AND
         (
           (date = ? AND time <= ?) OR
           (date < ?)
         )
       LIMIT 50`,
      [currentDate, currentTime, currentDate]
    ) as Reminder[];

    if (reminders.length > 0) {
      console.log(`📬 Found ${reminders.length} reminder(s) to send`);

      for (const reminder of reminders) {
        await sendReminder(reminder);
      }
    }
  } catch (error) {
    console.error('❌ Error checking reminders:', error);
  }
}

// Send a single reminder
async function sendReminder(reminder: Reminder) {
  try {
    const dateTime = `${reminder.date}T${reminder.time}:00`;
    
    // Send via Telegram
    const sent = await sendTelegramReminder(reminder.user_id, {
      title: reminder.title,
      description: reminder.description,
      dateTime: dateTime,
      type: reminder.created_by || 'user'
    });

    if (sent) {
      // Mark as sent
      await dbRun(
        `UPDATE reminders
         SET telegram_sent = 1, telegram_sent_at = ?
         WHERE id = ?`,
        [new Date().toISOString(), reminder.id]
      );

      console.log(`✅ Sent reminder ${reminder.id} to user ${reminder.user_id}`);
    } else {
      await dbRun(
        `UPDATE reminders
         SET telegram_attempts = COALESCE(telegram_attempts, 0) + 1,
             telegram_last_attempt_at = ?
         WHERE id = ?`,
        [new Date().toISOString(), reminder.id]
      );
      console.log(`⚠️ Failed to send reminder ${reminder.id} (user may not have Telegram linked)`);
    }
  } catch (error) {
    console.error(`❌ Error sending reminder ${reminder.id}:`, error);
  }
}

// Create a new reminder (called from API)
export async function createReminder(data: {
  userId: number;
  title: string;
  description?: string;
  reminderDate: string;
  reminderTime: string;
  createdBy: 'user' | 'doctor';
}): Promise<number> {
  const result = await dbRun(
    `INSERT INTO reminders (user_id, title, description, type, time, date, enabled, created_by, telegram_sent)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, 0)`,
    [
      data.userId,
      data.title,
      data.description || null,
      'custom',
      data.reminderTime,
      data.reminderDate,
      data.createdBy,
    ],
  );

  console.log(`📝 Created reminder ${result.lastID} for user ${data.userId}`);

  return Number(result.lastID || 0);
}

// Get user's reminders
export async function getUserReminders(userId: number, includeCompleted = false) {
  let query = `
    SELECT id, title, description, date, time, created_by, telegram_sent, telegram_sent_at
    FROM reminders
    WHERE user_id = ?
  `;

  if (!includeCompleted) {
    query += ` AND (telegram_sent = 0 OR telegram_sent IS NULL)`;
  }

  query += ` ORDER BY date DESC, time DESC`;

  return new Promise<Record<string, unknown>[]>((resolve, reject) => {
    Database.db.all(query, [userId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

// Delete a reminder
export async function deleteReminder(reminderId: number, userId: number): Promise<boolean> {
  const result = await dbRun(
    `DELETE FROM reminders 
     WHERE id = ? AND user_id = ?`,
    [reminderId, userId]
  );

  return result.changes > 0;
}

export default {
  startReminderScheduler,
  stopReminderScheduler,
  createReminder,
  getUserReminders,
  deleteReminder
};

/**
 * Database Migration: Add Telegram Integration Fields
 * Adds telegram_chat_id, country_code, telegram_verified to users table
 * Adds created_by, sent_at, reminder_date, reminder_time to reminders table
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/bloomhope.db');
const db = new Database(dbPath);

console.log('🔄 Migrating database for Telegram integration...\n');

try {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Check and add telegram_* columns to users table
  const userColumns = db.pragma('table_info(users)');
  const hasColumnChatId = userColumns.some((col: any) => col.name === 'telegram_chat_id');
  const hasColumnVerified = userColumns.some((col: any) => col.name === 'telegram_verified');
  const hasColumnCountry = userColumns.some((col: any) => col.name === 'country_code');

  if (!hasColumnChatId) {
    console.log('📝 Adding telegram_chat_id column to users table...');
    db.exec(`ALTER TABLE users ADD COLUMN telegram_chat_id TEXT`);
    console.log('✅ Added telegram_chat_id');
  } else {
    console.log('⏭️  telegram_chat_id column already exists');
  }

  if (!hasColumnVerified) {
    console.log('📝 Adding telegram_verified column to users table...');
    db.exec(`ALTER TABLE users ADD COLUMN telegram_verified INTEGER DEFAULT 0`);
    console.log('✅ Added telegram_verified');
  } else {
    console.log('⏭️  telegram_verified column already exists');
  }

  if (!hasColumnCountry) {
    console.log('📝 Adding country_code column to users table...');
    db.exec(`ALTER TABLE users ADD COLUMN country_code TEXT`);
    console.log('✅ Added country_code');
  } else {
    console.log('⏭️  country_code column already exists');
  }

  // Check reminders table columns
  const reminderColumns = db.pragma('table_info(reminders)');
  const hasCreatedBy = reminderColumns.some((col: any) => col.name === 'created_by');
  const hasSentAt = reminderColumns.some((col: any) => col.name === 'sent_at');
  const hasReminderDate = reminderColumns.some((col: any) => col.name === 'reminder_date');
  const hasReminderTime = reminderColumns.some((col: any) => col.name === 'reminder_time');
  const hasNotificationSent = reminderColumns.some((col: any) => col.name === 'notification_sent');
  const hasLegacyDate = reminderColumns.some((col: any) => col.name === 'date');
  const hasLegacyTime = reminderColumns.some((col: any) => col.name === 'time');

  if (!hasCreatedBy) {
    console.log('📝 Adding created_by column to reminders table...');
    db.exec(`ALTER TABLE reminders ADD COLUMN created_by TEXT DEFAULT 'user'`);
    console.log('✅ Added created_by');
  } else {
    console.log('⏭️  created_by column already exists');
  }

  if (!hasSentAt) {
    console.log('📝 Adding sent_at column to reminders table...');
    db.exec(`ALTER TABLE reminders ADD COLUMN sent_at TEXT`);
    console.log('✅ Added sent_at');
  } else {
    console.log('⏭️  sent_at column already exists');
  }

  if (!hasReminderDate) {
    console.log('📝 Adding reminder_date column to reminders table...');
    db.exec(`ALTER TABLE reminders ADD COLUMN reminder_date TEXT`);
    console.log('✅ Added reminder_date');
  } else {
    console.log('⏭️  reminder_date column already exists');
  }

  if (!hasReminderTime) {
    console.log('📝 Adding reminder_time column to reminders table...');
    db.exec(`ALTER TABLE reminders ADD COLUMN reminder_time TEXT`);
    console.log('✅ Added reminder_time');
  } else {
    console.log('⏭️  reminder_time column already exists');
  }

  if (!hasNotificationSent) {
    console.log('📝 Adding notification_sent column to reminders table...');
    db.exec(`ALTER TABLE reminders ADD COLUMN notification_sent INTEGER DEFAULT 0`);
    console.log('✅ Added notification_sent');
  } else {
    console.log('⏭️  notification_sent column already exists');
  }

  // Migrate existing reminder data if needed
  console.log('\n📝 Migrating existing reminder data...');

  if (hasLegacyDate || hasLegacyTime) {
    const existingReminders = db
      .prepare('SELECT id, date, time FROM reminders WHERE reminder_date IS NULL')
      .all();

    if (existingReminders.length > 0) {
      const updateStmt = db.prepare(`
        UPDATE reminders 
        SET reminder_date = ?, reminder_time = ? 
        WHERE id = ?
      `);

      for (const reminder of existingReminders) {
        updateStmt.run(reminder.date || '2024-01-01', reminder.time || '09:00', reminder.id);
      }

      console.log(`✅ Migrated ${existingReminders.length} existing reminders`);
    } else {
      console.log('⏭️  No existing reminders to migrate');
    }
  } else {
    console.log('⏭️  Legacy columns (date/time) not found; skipping legacy migration');
  }

  console.log('\n✅ Database migration completed successfully!');
  console.log('\n📊 Summary:');
  console.log('   - Users table: telegram_chat_id, telegram_verified, country_code');
  console.log('   - Reminders table: created_by, sent_at, reminder_date, reminder_time, notification_sent');

} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}

-- Migration 001: Add roles and RBAC tables
-- Run this migration to extend the existing users table and add new role-based tables

-- Step 1: Add role-related columns to users table
ALTER TABLE users ADD COLUMN role TEXT CHECK(role IN ('patient', 'doctor', 'admin')) DEFAULT 'patient';
ALTER TABLE users ADD COLUMN approved BOOLEAN DEFAULT 1;
ALTER TABLE users ADD COLUMN assigned_doctor_id INTEGER REFERENCES users(id);

-- Update existing users to be patients by default
UPDATE users SET role = 'patient' WHERE role IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_approved ON users(approved);
CREATE INDEX IF NOT EXISTS idx_users_assigned_doctor ON users(assigned_doctor_id);

-- Step 2: Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT CHECK(type IN ('global', 'private')) NOT NULL,
  patient_id INTEGER REFERENCES users(id),
  doctor_id INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON chat_rooms(type);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_patient ON chat_rooms(patient_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_doctor ON chat_rooms(doctor_id);

-- Step 3: Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  attachments TEXT, -- JSON string for attachments
  is_reported BOOLEAN DEFAULT 0,
  is_deleted BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reported ON chat_messages(is_reported);

-- Step 4: Create exercise_evaluations table
CREATE TABLE IF NOT EXISTS exercise_evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES users(id),
  exercise_id INTEGER, -- Reference to exercise if you have an exercises table
  exercise_name TEXT NOT NULL,
  completed BOOLEAN DEFAULT 0,
  pain_level INTEGER CHECK(pain_level >= 0 AND pain_level <= 10),
  fatigue_level INTEGER CHECK(fatigue_level >= 0 AND fatigue_level <= 10),
  notes TEXT,
  score REAL, -- Calculated score (0-100)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exercise_evaluations_patient ON exercise_evaluations(patient_id);
CREATE INDEX IF NOT EXISTS idx_exercise_evaluations_date ON exercise_evaluations(created_at);

-- Step 5: Create reminders table (extended version)
-- Note: If you already have a reminders table, you may need to drop and recreate or alter
DROP TABLE IF EXISTS reminders_backup;
CREATE TABLE IF NOT EXISTS reminders_backup AS SELECT * FROM reminders;

DROP TABLE IF EXISTS reminders;

CREATE TABLE reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_type TEXT CHECK(target_type IN ('patient', 'group', 'all')) NOT NULL DEFAULT 'patient',
  target_id INTEGER REFERENCES users(id), -- Nullable for 'group' or 'all'
  user_type TEXT, -- For group targeting: 'fighter', 'survivor', 'wellness'
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK(type IN ('medicine', 'appointment', 'exercise', 'self-exam', 'custom')) NOT NULL,
  scheduled_time DATETIME NOT NULL,
  recurrence TEXT CHECK(recurrence IN ('once', 'daily', 'weekly', 'monthly')) DEFAULT 'once',
  is_active BOOLEAN DEFAULT 1,
  last_sent_at DATETIME,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reminders_target_type ON reminders(target_type);
CREATE INDEX IF NOT EXISTS idx_reminders_target_id ON reminders(target_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_time ON reminders(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_reminders_is_active ON reminders(is_active);

-- Step 6: Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL, -- 'doctor_approved', 'message_deleted', 'user_banned', 'reminder_created', etc.
  entity_type TEXT, -- 'user', 'message', 'reminder', etc.
  entity_id INTEGER,
  details TEXT, -- JSON string with additional info
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs(created_at);

-- Step 7: Create global chat room for patients
INSERT INTO chat_rooms (type, patient_id, doctor_id, created_at)
VALUES ('global', NULL, NULL, CURRENT_TIMESTAMP);

-- Migration complete
-- Next steps: Run seed data if needed

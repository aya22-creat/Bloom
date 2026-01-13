import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../data/bloomhope.db');

export class Database {
  static db: sqlite3.Database;

  static init() {
    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Failed to connect to database:', err);
      } else {
        console.log('Connected to SQLite database.');
        this.createTables();
      }
    });
  }

  static createTables() {
    // User table
    this.db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    );

    // User Profile table
    this.db.run(
      `CREATE TABLE IF NOT EXISTS user_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        first_name TEXT,
        last_name TEXT,
        date_of_birth DATE,
        gender TEXT,
        country TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`
    );

    // Reminders
    this.db.run(
      `CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT CHECK (type IN ('checkup','appointment','water','exercise')) NOT NULL,
        time TEXT,                   -- 'HH:MM'
        date TEXT,                   -- 'YYYY-MM-DD'
        days TEXT,                   -- JSON array of days e.g. ["monday","wednesday"]
        interval TEXT,               -- e.g. 'every_2_hours'
        enabled INTEGER DEFAULT 1,   -- 1 true, 0 false
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`
    );

    // Symptoms
    this.db.run(
      `CREATE TABLE IF NOT EXISTS symptoms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT DEFAULT (date('now')),
        description TEXT NOT NULL,
        severity TEXT CHECK (severity IN ('mild','moderate','severe')) NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`
    );

    // Self Examinations
    this.db.run(
      `CREATE TABLE IF NOT EXISTS self_exams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        performed_at TEXT DEFAULT (date('now')),
        findings TEXT,
        pain_level INTEGER CHECK (pain_level BETWEEN 0 AND 10),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`
    );

    // Cycles
    this.db.run(
      `CREATE TABLE IF NOT EXISTS cycles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`
    );

    // Medications
    this.db.run(
      `CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        dosage TEXT,
        schedule TEXT,
        start_date TEXT,
        end_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`
    );

    // Medication Logs
    this.db.run(
      `CREATE TABLE IF NOT EXISTS medication_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medication_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        taken_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT CHECK (status IN ('taken','missed')) NOT NULL,
        notes TEXT,
        FOREIGN KEY (medication_id) REFERENCES medications (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`
    );

    // Health Questionnaire Responses (store as JSON)
    this.db.run(
      `CREATE TABLE IF NOT EXISTS questionnaire_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        answers TEXT NOT NULL,       -- JSON string of answers
        result TEXT,                 -- JSON or text summary
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`
    );
  }
}

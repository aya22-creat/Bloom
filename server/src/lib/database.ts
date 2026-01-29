import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

dotenv.config();

export interface RunResult {
  lastID: number;
  changes: number;
}

class SqliteAdapter {
  private db: sqlite3.Database;

  constructor(db: sqlite3.Database) {
    this.db = db;
  }

  run(
    query: string,
    params: any[] | ((this: RunResult, err: Error | null) => void),
    callback?: (this: RunResult, err: Error | null) => void
  ): void {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    params = params || [];

    this.db.run(query, params, function (this: sqlite3.RunResult, err: Error | null) {
      const runResult: RunResult = {
        lastID: this?.lastID || 0,
        changes: this?.changes || 0,
      };

      if (callback) {
        callback.call(runResult, err);
      }
    });
  }

  get(
    query: string,
    params: any[] | ((err: Error | null, row: any) => void),
    callback?: (err: Error | null, row: any) => void
  ): void {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    params = params || [];

    this.db.get(query, params, (err, row) => {
      if (callback) {
        callback(err, row);
      }
    });
  }

  all(
    query: string,
    params: any[] | ((err: Error | null, rows: any[]) => void),
    callback?: (err: Error | null, rows: any[]) => void
  ): void {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    params = params || [];

    this.db.all(query, params, (err, rows) => {
      if (callback) {
        callback(err, rows || []);
      }
    });
  }
}

export class Database {
  static db: SqliteAdapter;
  private static sqliteDb: sqlite3.Database;

  static async init() {
    try {
      const dbType = process.env.DB_TYPE || 'sqlite';

      if (dbType !== 'sqlite') {
        throw new Error(`Database type '${dbType}' is not supported. Please use DB_TYPE=sqlite in .env file.`);
      }

      const dbFile = process.env.DB_FILE || './data/bloomhope.db';
      const dbPath = path.resolve(dbFile);
      const dbDir = path.dirname(dbPath);

      // Ensure data directory exists
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      console.log('📦 Initializing SQLite database...');
      console.log(`   Database file: ${dbPath}`);

      return new Promise<void>((resolve, reject) => {
        this.sqliteDb = new sqlite3.Database(dbPath, (err) => {
          if (err) {
            console.error('❌ Failed to connect to SQLite database:', err);
            reject(err);
            return;
          }

          this.db = new SqliteAdapter(this.sqliteDb);
          console.log('✅ Connected to SQLite database');

          this.createTables()
            .then(() => resolve())
            .catch((err) => reject(err));
        });
      });
    } catch (err) {
      console.error('❌ Failed to initialize database:', err);
      throw err;
    }
  }

  static async createTables() {
    const runQuery = (query: string, tableName: string) => {
      return new Promise<void>((resolve, reject) => {
        this.db.run(query, [], function (err) {
          if (err) {
            console.error(`⚠️  Error creating ${tableName}:`, err.message);
            reject(err);
          } else {
            console.log(`✅ Table ${tableName} ready`);
            resolve();
          }
        });
      });
    };

    // Users table
    await runQuery(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        user_type TEXT DEFAULT 'wellness' CHECK(user_type IN ('fighter', 'survivor', 'wellness')),
        language TEXT DEFAULT 'en',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      'users'
    );

    // User Profiles table
    await runQuery(
      `CREATE TABLE IF NOT EXISTS user_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        first_name TEXT,
        last_name TEXT,
        date_of_birth DATE,
        gender TEXT,
        country TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      'user_profiles'
    );

    // Reminders table
    await runQuery(
      `CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        reminder_time DATETIME,
        is_completed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      'reminders'
    );

    // Symptoms table
    await runQuery(
      `CREATE TABLE IF NOT EXISTS symptoms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        symptom_name TEXT NOT NULL,
        severity INTEGER,
        notes TEXT,
        logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      'symptoms'
    );

    // Self Exams table
    await runQuery(
      `CREATE TABLE IF NOT EXISTS self_exams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        exam_date DATE NOT NULL,
        findings TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      'self_exams'
    );

    // Cycles table
    await runQuery(
      `CREATE TABLE IF NOT EXISTS cycles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        flow_type TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      'cycles'
    );

    // Medications table
    await runQuery(
      `CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        dosage TEXT,
        frequency TEXT,
        start_date DATE,
        end_date DATE,
        reason TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      'medications'
    );

    // Medication Logs table
    await runQuery(
      `CREATE TABLE IF NOT EXISTS medication_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medication_id INTEGER NOT NULL,
        logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        FOREIGN KEY (medication_id) REFERENCES medications (id) ON DELETE CASCADE
      )`,
      'medication_logs'
    );

    // Questionnaire table
    await runQuery(
      `CREATE TABLE IF NOT EXISTS questionnaire (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        health_status TEXT,
        risk_factors TEXT,
        family_history TEXT,
        lifestyle_info TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      'questionnaire'
    );

    // Journal table
    await runQuery(
      `CREATE TABLE IF NOT EXISTS journal (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT,
        content TEXT,
        mood TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      'journal'
    );

    // Progress table
    await runQuery(
      `CREATE TABLE IF NOT EXISTS progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        activity_type TEXT NOT NULL,
        activity_value REAL,
        unit TEXT,
        logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      'progress'
    );

    console.log('🎉 All database tables initialized');
  }
}

import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import path from 'path';
// @ts-ignore
const sql = require('msnodesqlv8');

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

    this.db.run(query, params, function(err: Error | null) {
      if (callback) {
        const result: RunResult = { lastID: this?.lastID || 0, changes: this?.changes || 0 };
        callback.call(result, err);
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

    this.db.get(query, params, (err: Error | null, row: any) => {
      if (callback) {
        callback(err, row || null);
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

    this.db.all(query, params, (err: Error | null, rows: any[]) => {
      if (callback) {
        callback(err, rows || []);
      }
    });
  }
}

class SqlServerAdapter {
  private conn: any;

  constructor(conn: any) {
    this.conn = conn;
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

    let finalQuery = query;
    const isInsert = /^\s*INSERT\s+INTO/i.test(query);
    const isUpdateOrDelete = /^\s*(UPDATE|DELETE)/i.test(query);

    if (isInsert) {
      finalQuery += '; SELECT SCOPE_IDENTITY() AS id;';
    } else if (isUpdateOrDelete) {
      finalQuery += '; SELECT @@ROWCOUNT AS changes;';
    }

    this.conn.query(finalQuery, params, (err: Error, rows: any[]) => {
      if (err) {
        if (callback) {
           callback.call({ lastID: 0, changes: 0 }, err);
        }
        return;
      }

      let lastID = 0;
      let changes = 0;

      if (isInsert && rows && rows.length > 0) {
        lastID = rows[0].id;
        changes = 1;
      } else if (isUpdateOrDelete && rows && rows.length > 0) {
        changes = rows[0].changes;
      }

      if (callback) {
        callback.call({ lastID, changes }, null);
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

    this.conn.query(query, params, (err: Error, rows: any[]) => {
      if (callback) {
        callback(err, rows && rows.length > 0 ? rows[0] : null);
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

    this.conn.query(query, params, (err: Error, rows: any[]) => {
      if (callback) {
        callback(err, rows || []);
      }
    });
  }
}

export class Database {
  static db: SqliteAdapter | SqlServerAdapter;

  private static async initializeSqliteSchema(): Promise<void> {
    const runAsync = (query: string) =>
      new Promise<void>((resolve, reject) => {
        this.db.run(query, [], function (err: Error | null) {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });

    const queries = [
      `CREATE TABLE IF NOT EXISTS questionnaire_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        submitted_at TEXT,
        answers TEXT NOT NULL,
        result TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS progress_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        activity_type TEXT NOT NULL,
        value REAL NOT NULL,
        notes TEXT,
        log_date TEXT DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS health_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT,
        value INTEGER,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    ];

    for (const query of queries) {
      await runAsync(query);
    }
  }

  static async init() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    if (nodeEnv === 'production') {
      console.log('📦 Initializing SQL Server connection...');
      const connString = `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || '.\\SQLEXPRESS'};Database=${process.env.DB_NAME || 'BloomHopeDB'};Trusted_Connection=yes;`;
      
      return new Promise<void>((resolve, reject) => {
        sql.open(connString, (err: Error, conn: any) => {
          if (err) {
            console.error('❌ Failed to connect to SQL Server:', err);
            reject(err);
            return;
          }
          this.db = new SqlServerAdapter(conn);
          console.log('✅ Connected to SQL Server');
          resolve();
        });
      });
    } else {
      console.log('📦 Initializing SQLite connection...');
      const dbPath = process.env.DB_FILE || path.join(__dirname, '../../data/bloomhope.db');
      
      return new Promise<void>((resolve, reject) => {
        const sqlite = new sqlite3.Database(dbPath, (err: Error | null) => {
          if (err) {
            console.error('❌ Failed to connect to SQLite:', err);
            reject(err);
            return;
          }
          this.db = new SqliteAdapter(sqlite);
          console.log('✅ Connected to SQLite at:', dbPath);
          this.initializeSqliteSchema()
            .then(() => resolve())
            .catch((schemaError) => {
              console.warn('⚠️  SQLite schema init failed:', schemaError);
              resolve();
            });
        });
      });
    }
}
}

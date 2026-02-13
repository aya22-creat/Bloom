import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let sql: any;

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

    let settled = false;
    const settle = (lastID: number, changes: number, err: Error | null) => {
      if (settled) return;
      settled = true;
      if (callback) {
        callback.call({ lastID, changes }, err);
      }
    };

    const timeoutId = setTimeout(() => {
      settle(0, 0, null);
    }, 3000);

    this.conn.query(finalQuery, params, (err: Error, rows: any[]) => {
      if (settled) return;
      if (err) {
        clearTimeout(timeoutId);
        settle(0, 0, err);
        return;
      }

      if (isInsert) {
        const idVal = rows && rows.length > 0 ? rows[0]?.id : undefined;
        if (idVal !== undefined && idVal !== null) {
          clearTimeout(timeoutId);
          settle(Number(idVal) || 0, 1, null);
        }
        return;
      }

      if (isUpdateOrDelete) {
        const chVal = rows && rows.length > 0 ? rows[0]?.changes : undefined;
        if (chVal !== undefined && chVal !== null) {
          clearTimeout(timeoutId);
          settle(0, Number(chVal) || 0, null);
        }
        return;
      }

      clearTimeout(timeoutId);
      settle(0, 0, null);
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

  private static async initializeSqlServerSchema(): Promise<void> {
    const runAsyncIgnore = (query: string) =>
      new Promise<void>((resolve) => {
        this.db.run(query, [], () => resolve());
      });

    const queries = [
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
       CREATE TABLE users (
         id INT IDENTITY(1,1) PRIMARY KEY,
         username NVARCHAR(255) UNIQUE NOT NULL,
         email NVARCHAR(255) UNIQUE NOT NULL,
         password NVARCHAR(MAX) NOT NULL,
         phone NVARCHAR(30) NULL,
         user_type NVARCHAR(50) NULL,
         language NVARCHAR(10) NULL,
         created_at DATETIME DEFAULT GETDATE()
       )`,
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='reminders' AND xtype='U')
       CREATE TABLE reminders (
         id INT IDENTITY(1,1) PRIMARY KEY,
         user_id INT NOT NULL,
         title NVARCHAR(255) NOT NULL,
         description NVARCHAR(MAX),
         type NVARCHAR(50) NULL,
         time NVARCHAR(10) NULL,
         date NVARCHAR(20) NULL,
         days NVARCHAR(MAX) NULL,
         interval NVARCHAR(50) NULL,
         enabled BIT DEFAULT 1,
         whatsapp_sent BIT DEFAULT 0,
         whatsapp_sent_at DATETIME NULL,
         whatsapp_error NVARCHAR(MAX) NULL,
         whatsapp_attempts INT DEFAULT 0,
         whatsapp_last_attempt_at DATETIME NULL,
         mandatory BIT DEFAULT 0,
         created_at DATETIME DEFAULT GETDATE()
       )`,
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cycles' AND xtype='U')
       CREATE TABLE cycles (
         id INT IDENTITY(1,1) PRIMARY KEY,
         user_id INT NOT NULL,
         start_date NVARCHAR(20) NOT NULL,
         end_date NVARCHAR(20) NULL,
         cycle_length INT NULL,
         notes NVARCHAR(MAX) NULL,
         created_at DATETIME DEFAULT GETDATE()
       )`,
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='self_exams' AND xtype='U')
       CREATE TABLE self_exams (
         id INT IDENTITY(1,1) PRIMARY KEY,
         user_id INT NOT NULL,
         exam_date NVARCHAR(20) NOT NULL,
         findings NVARCHAR(MAX) NULL,
         notes NVARCHAR(MAX) NULL,
         created_at DATETIME DEFAULT GETDATE()
       )`,
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_profiles' AND xtype='U')
       CREATE TABLE user_profiles (
         id INT IDENTITY(1,1) PRIMARY KEY,
         user_id INT UNIQUE NOT NULL,
         first_name NVARCHAR(255) NULL,
         last_name NVARCHAR(255) NULL,
         date_of_birth NVARCHAR(30) NULL,
         gender NVARCHAR(20) NULL,
         country NVARCHAR(100) NULL,
         medical_history NVARCHAR(MAX) NULL,
         created_at DATETIME DEFAULT GETDATE()
       )`,
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='whatsapp_message_logs' AND xtype='U')
       CREATE TABLE whatsapp_message_logs (
         id INT IDENTITY(1,1) PRIMARY KEY,
         user_id INT NULL,
         reminder_id INT NULL,
         to_phone NVARCHAR(30) NOT NULL,
         status NVARCHAR(50) NOT NULL,
         error NVARCHAR(MAX) NULL,
         provider_message_id NVARCHAR(255) NULL,
         created_at DATETIME DEFAULT GETDATE()
       )`,
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='reminder_completions' AND xtype='U')
       CREATE TABLE reminder_completions (
         id INT IDENTITY(1,1) PRIMARY KEY,
         user_id INT NOT NULL,
         type NVARCHAR(20) NOT NULL,
         completed_at DATETIME DEFAULT GETDATE()
       )`,
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='medications' AND xtype='U')
       CREATE TABLE medications (
         id INT IDENTITY(1,1) PRIMARY KEY,
         user_id INT NOT NULL,
         name NVARCHAR(255) NOT NULL,
         dosage NVARCHAR(100) NULL,
         frequency NVARCHAR(100) NULL,
         type NVARCHAR(100) NULL,
         start_date NVARCHAR(20) NULL,
         end_date NVARCHAR(20) NULL,
         reason NVARCHAR(MAX) NULL,
         notes NVARCHAR(MAX) NULL,
         created_at DATETIME DEFAULT GETDATE()
       )`,
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='medication_logs' AND xtype='U')
       CREATE TABLE medication_logs (
         id INT IDENTITY(1,1) PRIMARY KEY,
         medication_id INT NOT NULL,
         user_id INT NULL,
         taken_at DATETIME NULL,
         logged_at DATETIME NULL,
         status NVARCHAR(20) NULL,
         notes NVARCHAR(MAX) NULL
       )`,
    ];

    for (const q of queries) {
      await runAsyncIgnore(q);
    }

    const alters = [
      `IF COL_LENGTH('users','phone') IS NULL ALTER TABLE users ADD phone NVARCHAR(30) NULL`,
      `IF COL_LENGTH('users','user_type') IS NULL ALTER TABLE users ADD user_type NVARCHAR(50) NULL`,
      `IF COL_LENGTH('users','language') IS NULL ALTER TABLE users ADD language NVARCHAR(10) NULL`,
      `IF COL_LENGTH('reminders','whatsapp_sent') IS NULL ALTER TABLE reminders ADD whatsapp_sent BIT DEFAULT 0`,
      `IF COL_LENGTH('reminders','whatsapp_sent_at') IS NULL ALTER TABLE reminders ADD whatsapp_sent_at DATETIME NULL`,
      `IF COL_LENGTH('reminders','whatsapp_error') IS NULL ALTER TABLE reminders ADD whatsapp_error NVARCHAR(MAX) NULL`,
      `IF COL_LENGTH('reminders','whatsapp_attempts') IS NULL ALTER TABLE reminders ADD whatsapp_attempts INT DEFAULT 0`,
      `IF COL_LENGTH('reminders','whatsapp_last_attempt_at') IS NULL ALTER TABLE reminders ADD whatsapp_last_attempt_at DATETIME NULL`,
      `IF COL_LENGTH('reminders','mandatory') IS NULL ALTER TABLE reminders ADD mandatory BIT DEFAULT 0`,
      `IF OBJECT_ID('cycles','U') IS NOT NULL AND COL_LENGTH('cycles','cycle_length') IS NULL ALTER TABLE cycles ADD cycle_length INT NULL`,
      `IF OBJECT_ID('cycles','U') IS NOT NULL AND COL_LENGTH('cycles','notes') IS NULL ALTER TABLE cycles ADD notes NVARCHAR(MAX) NULL`,
      `IF OBJECT_ID('cycles','U') IS NOT NULL AND COL_LENGTH('cycles','end_date') IS NULL ALTER TABLE cycles ADD end_date NVARCHAR(20) NULL`,
      `IF OBJECT_ID('self_exams','U') IS NOT NULL AND COL_LENGTH('self_exams','findings') IS NULL ALTER TABLE self_exams ADD findings NVARCHAR(MAX) NULL`,
      `IF OBJECT_ID('self_exams','U') IS NOT NULL AND COL_LENGTH('self_exams','notes') IS NULL ALTER TABLE self_exams ADD notes NVARCHAR(MAX) NULL`,
      `IF OBJECT_ID('user_profiles','U') IS NOT NULL AND COL_LENGTH('user_profiles','date_of_birth') IS NULL ALTER TABLE user_profiles ADD date_of_birth NVARCHAR(30) NULL`,
      `IF OBJECT_ID('user_profiles','U') IS NOT NULL AND COL_LENGTH('user_profiles','gender') IS NULL ALTER TABLE user_profiles ADD gender NVARCHAR(20) NULL`,
      `IF OBJECT_ID('user_profiles','U') IS NOT NULL AND COL_LENGTH('user_profiles','medical_history') IS NULL ALTER TABLE user_profiles ADD medical_history NVARCHAR(MAX) NULL`,
      `IF OBJECT_ID('medications','U') IS NOT NULL AND COL_LENGTH('medications','type') IS NULL ALTER TABLE medications ADD type NVARCHAR(100) NULL`,
      `IF OBJECT_ID('medications','U') IS NOT NULL AND COL_LENGTH('medications','frequency') IS NULL ALTER TABLE medications ADD frequency NVARCHAR(100) NULL`,
      `IF OBJECT_ID('medications','U') IS NOT NULL AND COL_LENGTH('medications','reason') IS NULL ALTER TABLE medications ADD reason NVARCHAR(MAX) NULL`,
      `IF OBJECT_ID('medications','U') IS NOT NULL AND COL_LENGTH('medications','notes') IS NULL ALTER TABLE medications ADD notes NVARCHAR(MAX) NULL`,
    ];
    for (const q of alters) {
      await runAsyncIgnore(q);
    }
  }

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
    
    const runAsyncIgnore = (query: string) =>
      new Promise<void>((resolve) => {
        this.db.run(query, [], function () {
          resolve();
        });
      });

    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        user_type TEXT,
        language TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        time TEXT,
        date TEXT,
        days TEXT,
        interval TEXT,
        enabled INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS cycles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        cycle_length INTEGER,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS self_exams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        exam_date TEXT NOT NULL,
        findings TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS user_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        first_name TEXT,
        last_name TEXT,
        date_of_birth TEXT,
        gender TEXT,
        country TEXT,
        medical_history TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
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
      ,
      `CREATE TABLE IF NOT EXISTS medical_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        mime_type TEXT,
        size_kb INTEGER,
        file_path TEXT NOT NULL,
        uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      )`
      ,
      `CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        dosage TEXT,
        frequency TEXT,
        type TEXT,
        start_date TEXT,
        end_date TEXT,
        reason TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS medication_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medication_id INTEGER NOT NULL,
        user_id INTEGER,
        taken_at TEXT,
        logged_at TEXT,
        status TEXT,
        notes TEXT,
        FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS reminder_completions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        completed_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`
      ,
      `CREATE TABLE IF NOT EXISTS symptoms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        symptom_name TEXT NOT NULL,
        severity INTEGER,
        notes TEXT,
        logged_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`
      ,
      `CREATE TABLE IF NOT EXISTS vendors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_email TEXT,
        contact_phone TEXT,
        verified INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        price REAL,
        currency TEXT,
        verified INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        source TEXT,
        sponsored INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        start_date TEXT,
        end_date TEXT,
        location TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS forum_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        topic TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )`
    ];

    for (const query of queries) {
      await runAsync(query);
    }

    const reminderAlters = [
      `ALTER TABLE reminders ADD COLUMN type TEXT`,
      `ALTER TABLE reminders ADD COLUMN time TEXT`,
      `ALTER TABLE reminders ADD COLUMN date TEXT`,
      `ALTER TABLE reminders ADD COLUMN days TEXT`,
      `ALTER TABLE reminders ADD COLUMN interval TEXT`,
      `ALTER TABLE reminders ADD COLUMN enabled INTEGER DEFAULT 1`,
      `ALTER TABLE reminders ADD COLUMN whatsapp_sent INTEGER DEFAULT 0`,
      `ALTER TABLE reminders ADD COLUMN whatsapp_sent_at TEXT`,
      `ALTER TABLE reminders ADD COLUMN whatsapp_error TEXT`,
      `ALTER TABLE reminders ADD COLUMN whatsapp_attempts INTEGER DEFAULT 0`,
      `ALTER TABLE reminders ADD COLUMN whatsapp_last_attempt_at TEXT`,
      `ALTER TABLE reminders ADD COLUMN mandatory INTEGER DEFAULT 0`,
      `ALTER TABLE reminders ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP`,
    ];
    for (const q of reminderAlters) {
      await runAsyncIgnore(q);
    }

    const userAlters = [
      `ALTER TABLE users ADD COLUMN phone TEXT`,
      `ALTER TABLE users ADD COLUMN user_type TEXT`,
      `ALTER TABLE users ADD COLUMN language TEXT`,
      `ALTER TABLE user_profiles ADD COLUMN medical_history TEXT`,
    ];
    for (const q of userAlters) {
      await runAsyncIgnore(q);
    }

    const cycleAlters = [
      `ALTER TABLE cycles ADD COLUMN end_date TEXT`,
      `ALTER TABLE cycles ADD COLUMN cycle_length INTEGER`,
      `ALTER TABLE cycles ADD COLUMN notes TEXT`,
    ];
    for (const q of cycleAlters) {
      await runAsyncIgnore(q);
    }

    const selfExamAlters = [
      `ALTER TABLE self_exams ADD COLUMN findings TEXT`,
      `ALTER TABLE self_exams ADD COLUMN notes TEXT`,
    ];
    for (const q of selfExamAlters) {
      await runAsyncIgnore(q);
    }

    // Medication alters
    const medicationAlters = [
      `ALTER TABLE medications ADD COLUMN frequency TEXT`,
      `ALTER TABLE medications ADD COLUMN type TEXT`,
      `ALTER TABLE medications ADD COLUMN reason TEXT`,
      `ALTER TABLE medications ADD COLUMN notes TEXT`,
      `ALTER TABLE medications ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP`
    ];
    for (const q of medicationAlters) {
      await runAsyncIgnore(q);
    }

    await runAsyncIgnore(
      `ALTER TABLE products ADD COLUMN image_url TEXT`
    );


    await runAsyncIgnore(
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id INTEGER,
        details TEXT,
        ip_address TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`
    );

    await runAsyncIgnore(
      `CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        reminder_id INTEGER,
        to_phone TEXT NOT NULL,
        status TEXT NOT NULL,
        error TEXT,
        provider_message_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`
    );
  }

  static async init() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const dbType = (process.env.DB_TYPE || (nodeEnv === 'production' ? 'sqlserver' : 'sqlite')).toLowerCase();

    if (dbType === 'sqlserver' || dbType === 'mssql') {
      console.log('📦 Initializing SQL Server connection...');
      if (!sql) {
        sql = await import('msnodesqlv8');
      }

      const server = process.env.DB_SERVER || '.\\SQLEXPRESS';
      const database = process.env.DB_NAME || 'BloomHopeDB';
      const trusted = (process.env.DB_TRUSTED_CONNECTION || 'true').toLowerCase() !== 'false';

      const authPart = trusted
        ? 'Trusted_Connection=yes;'
        : `UID=${process.env.DB_USER || ''};PWD=${process.env.DB_PASSWORD || ''};`;

      const connString = `Driver={ODBC Driver 17 for SQL Server};Server=${server};Database=${database};${authPart}`;

      return new Promise<void>((resolve, reject) => {
        sql.open(connString, (err: Error, conn: any) => {
          if (err) {
            console.error('❌ Failed to connect to SQL Server:', err);
            reject(err);
            return;
          }
          this.db = new SqlServerAdapter(conn);
          console.log('✅ Connected to SQL Server');
          this.initializeSqlServerSchema()
            .then(() => resolve())
            .catch((schemaError) => {
              console.warn('⚠️  SQL Server schema init failed:', schemaError);
              resolve();
            });
        });
      });
    }

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

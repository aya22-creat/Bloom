import dotenv from 'dotenv';
const sql = require('msnodesqlv8');

dotenv.config();

// Using local SQLEXPRESS with Windows Authentication (ODBC)
// Ensure DB_SERVER in .env matches, or fallback to .\SQLEXPRESS
const connectionString = `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || '.\\SQLEXPRESS'};Database=${process.env.DB_NAME || 'BloomHopeDB'};Trusted_Connection=yes;`;

export interface RunResult {
  lastID: number;
  changes: number;
}

class SQLiteToMSSQLAdapter {
  private conn: any;

  constructor(conn: any) {
    this.conn = conn;
  }

  async run(
    query: string, 
    params: any[] | ((this: RunResult, err: Error | null) => void), 
    callback?: (this: RunResult, err: Error | null) => void
  ) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    params = params || [];

    // Append ID selection for INSERTs
    const isInsert = query.trim().toUpperCase().startsWith('INSERT');
    let sqlToRun = query;
    if (isInsert) {
        sqlToRun += '; SELECT SCOPE_IDENTITY() AS id;';
    }

    try {
      this.conn.query(sqlToRun, params, (err: Error, rows: any[]) => {
        if (err) {
             console.error('Database Run Error:', err);
             if (callback) callback.call({ lastID: 0, changes: 0 }, err);
             return;
        }

        const context: RunResult = {
            lastID: isInsert && rows && rows.length > 0 ? rows[0].id : 0,
            changes: 0 
        };
        
        if (callback) callback.call(context, null);
      });
    } catch (err) {
      console.error('Database Run Error:', err);
      if (callback) callback.call({ lastID: 0, changes: 0 }, err as Error);
    }
  }

  async get(query: string, params: any[] | ((err: Error | null, row: any) => void), callback?: (err: Error | null, row: any) => void) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    params = params || [];

    try {
        this.conn.query(query, params, (err: Error, rows: any[]) => {
            if (err) {
                console.error('Database Get Error:', err);
                if (callback) callback(err, null);
                return;
            }
            if (callback) callback(null, rows && rows.length > 0 ? rows[0] : undefined);
        });
    } catch (err) {
      console.error('Database Get Error:', err);
      if (callback) callback(err as Error, null);
    }
  }

  async all(query: string, params: any[] | ((err: Error | null, rows: any[]) => void), callback?: (err: Error | null, rows: any[]) => void) {
     if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    params = params || [];

    try {
        this.conn.query(query, params, (err: Error, rows: any[]) => {
            if (err) {
                console.error('Database All Error:', err);
                if (callback) callback(err, []);
                return;
            }
            if (callback) callback(null, rows);
        });
    } catch (err) {
      console.error('Database All Error:', err);
      if (callback) callback(err as Error, []);
    }
  }
}

export class Database {
  static db: SQLiteToMSSQLAdapter;

  static async init() {
    return new Promise<void>((resolve, reject) => {
        console.log('Connecting to database with string:', connectionString);
        sql.open(connectionString, (err: Error, conn: any) => {
            if (err) {
                console.error('Failed to connect to database:', err);
                reject(err);
                return;
            }
            this.db = new SQLiteToMSSQLAdapter(conn);
            console.log('Connected to SQL Server database.');
            this.createTables().then(resolve).catch(reject);
        });
    });
  }

  static async createTables() {
    const runQuery = (query: string) => {
        return new Promise<void>((resolve, reject) => {
            this.db.run(query, [], function(err) {
                if (err) {
                    console.error('Error creating table:', err);
                    // Log but don't fail, as tables might partially exist or have minor issues
                }
                resolve();
            });
        });
    };

    // Users
    await runQuery(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
    CREATE TABLE users (
      id INT IDENTITY(1,1) PRIMARY KEY,
      username NVARCHAR(255) UNIQUE NOT NULL,
      email NVARCHAR(255) UNIQUE NOT NULL,
      password NVARCHAR(MAX) NOT NULL,
      created_at DATETIME DEFAULT GETDATE()
    )`);

    // User Profiles
    await runQuery(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_profiles' AND xtype='U')
    CREATE TABLE user_profiles (
      id INT IDENTITY(1,1) PRIMARY KEY,
      user_id INT UNIQUE NOT NULL,
      user_type NVARCHAR(50) CHECK (user_type IN ('fighter','survivor','wellness')) DEFAULT 'wellness',
      first_name NVARCHAR(100),
      last_name NVARCHAR(100),
      date_of_birth DATE,
      gender NVARCHAR(50),
      country NVARCHAR(100),
      created_at DATETIME DEFAULT GETDATE(),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    // Reminders
    await runQuery(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='reminders' AND xtype='U')
    CREATE TABLE reminders (
      id INT IDENTITY(1,1) PRIMARY KEY,
      user_id INT NOT NULL,
      title NVARCHAR(255) NOT NULL,
      description NVARCHAR(MAX),
      type NVARCHAR(50) CHECK (type IN ('checkup','appointment','water','exercise')) NOT NULL,
      time NVARCHAR(10),
      date NVARCHAR(20),
      days NVARCHAR(MAX),
      interval NVARCHAR(50),
      enabled BIT DEFAULT 1,
      created_at DATETIME DEFAULT GETDATE(),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    // Symptoms
    await runQuery(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='symptoms' AND xtype='U')
    CREATE TABLE symptoms (
      id INT IDENTITY(1,1) PRIMARY KEY,
      user_id INT NOT NULL,
      date DATE DEFAULT GETDATE(),
      description NVARCHAR(MAX) NOT NULL,
      severity NVARCHAR(50) CHECK (severity IN ('mild','moderate','severe')) NOT NULL,
      notes NVARCHAR(MAX),
      created_at DATETIME DEFAULT GETDATE(),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    // Self Examinations
    await runQuery(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='self_exams' AND xtype='U')
    CREATE TABLE self_exams (
      id INT IDENTITY(1,1) PRIMARY KEY,
      user_id INT NOT NULL,
      performed_at DATE DEFAULT GETDATE(),
      findings NVARCHAR(MAX),
      pain_level INT CHECK (pain_level BETWEEN 0 AND 10),
      notes NVARCHAR(MAX),
      created_at DATETIME DEFAULT GETDATE(),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    // Cycles
    await runQuery(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cycles' AND xtype='U')
    CREATE TABLE cycles (
      id INT IDENTITY(1,1) PRIMARY KEY,
      user_id INT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      created_at DATETIME DEFAULT GETDATE(),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    // Health Logs
    await runQuery(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='health_logs' AND xtype='U')
    CREATE TABLE health_logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        weight FLOAT,
        blood_pressure NVARCHAR(20),
        mood NVARCHAR(50),
        sleep_hours FLOAT,
        date DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    // Medications
    await runQuery(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='medications' AND xtype='U')
    CREATE TABLE medications (
      id INT IDENTITY(1,1) PRIMARY KEY,
      user_id INT NOT NULL,
      name NVARCHAR(255) NOT NULL,
      dosage NVARCHAR(100),
      schedule NVARCHAR(100),
      start_date DATE,
      end_date DATE,
      created_at DATETIME DEFAULT GETDATE(),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    // Medication Logs
    await runQuery(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='medication_logs' AND xtype='U')
    CREATE TABLE medication_logs (
      id INT IDENTITY(1,1) PRIMARY KEY,
      medication_id INT NOT NULL,
      user_id INT NOT NULL,
      taken_at DATETIME,
      status NVARCHAR(50),
      notes NVARCHAR(MAX),
      FOREIGN KEY (medication_id) REFERENCES medications (id) ON DELETE CASCADE
      -- user_id FK omitted to avoid multiple cascade paths (Cycle)
    )`);
  }
}

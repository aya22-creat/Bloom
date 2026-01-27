import dotenv from 'dotenv';
import sql from 'mssql';

dotenv.config();

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

export interface RunResult {
  lastID: number;
  changes: number;
}

class SqlServerAdapter {
  private pool: sql.ConnectionPool;

  constructor(pool: sql.ConnectionPool) {
    this.pool = pool;
  }

  async run(
    query: string,
    params: any[] | ((this: RunResult, err: Error | null) => void),
    callback?: (this: RunResult, err: Error | null) => void
  ): Promise<void> {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    params = params || [];

    try {
      const request = this.pool.request();
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });

      const result = await request.query(query);
      const runResult: RunResult = {
        lastID: result.recordset && result.recordset.length > 0 ? result.recordset[0].id : 0,
        changes: result.rowsAffected[0] || 0,
      };
      
      if (callback) {
        callback.call(runResult, null);
      }
    } catch (err) {
      if (callback) {
        const runResult: RunResult = { lastID: 0, changes: 0 };
        callback.call(runResult, err as Error);
      }
    }
  }

  async get(
    query: string,
    params: any[] | ((err: Error | null, row: any) => void),
    callback?: (err: Error | null, row: any) => void
  ): Promise<void> {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    params = params || [];

    try {
      const request = this.pool.request();
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });

      const result = await request.query(query);
      const row = result.recordset && result.recordset.length > 0 ? result.recordset[0] : null;
      
      if (callback) {
        callback(null, row);
      }
    } catch (err) {
      if (callback) {
        callback(err as Error, null);
      }
    }
  }

  async all(
    query: string,
    params: any[] | ((err: Error | null, rows: any[]) => void),
    callback?: (err: Error | null, rows: any[]) => void
  ): Promise<void> {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    params = params || [];

    try {
      const request = this.pool.request();
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });

      const result = await request.query(query);
      const rows = result.recordset || [];
      
      if (callback) {
        callback(null, rows);
      }
    } catch (err) {
      if (callback) {
        callback(err as Error, []);
      }
    }
  }
}

export class Database {
  static db: SqlServerAdapter;
  private static pool: sql.ConnectionPool;

  static async init() {
    try {
      console.log('📦 Initializing SQL Server connection...');
      console.log(`   Server: ${config.server}`);
      console.log(`   Database: ${config.database}`);
      
      this.pool = await sql.connect(config);
      this.db = new SqlServerAdapter(this.pool);
      
      console.log('✅ Connected to SQL Server database');
      await this.createTables();
    } catch (err) {
      console.error('❌ Failed to connect to SQL Server:', err);
      throw err;
    }
  }

  static async createTables() {
    const runQuery = (query: string, tableName: string) => {
      return new Promise<void>((resolve, reject) => {
        this.db.run(query, [], function (err) {
          if (err) {
            console.error(`⚠️  Error creating ${tableName}:`, err.message);
          } else {
            console.log(`✅ Table ${tableName} ready`);
          }
          resolve();
        });
      });
    };

    // Users table
    await runQuery(
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      CREATE TABLE users (
        id INT PRIMARY KEY IDENTITY(1,1),
        username NVARCHAR(255) UNIQUE NOT NULL,
        email NVARCHAR(255) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        user_type NVARCHAR(50) DEFAULT 'wellness' CHECK(user_type IN ('fighter', 'survivor', 'wellness')),
        language NVARCHAR(10) DEFAULT 'en',
        created_at DATETIME2 DEFAULT GETDATE()
      )`,
      'users'
    );

    // User Profiles table
    await runQuery(
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_profiles' AND xtype='U')
      CREATE TABLE user_profiles (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT UNIQUE NOT NULL,
        first_name NVARCHAR(255),
        last_name NVARCHAR(255),
        date_of_birth DATE,
        gender NVARCHAR(50),
        country NVARCHAR(255),
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      'user_profiles'
    );

    // Reminders table
    await runQuery(
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='reminders' AND xtype='U')
      CREATE TABLE reminders (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        reminder_time DATETIME2,
        is_completed BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      'reminders'
    );

    // Symptoms table
    await runQuery(
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='symptoms' AND xtype='U')
      CREATE TABLE symptoms (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        symptom_name NVARCHAR(255) NOT NULL,
        severity INT,
        notes NVARCHAR(MAX),
        logged_at DATETIME2 DEFAULT GETDATE(),
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      'symptoms'
    );

    // Self Exams table
    await runQuery(
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='self_exams' AND xtype='U')
      CREATE TABLE self_exams (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        exam_date DATE NOT NULL,
        findings NVARCHAR(MAX),
        notes NVARCHAR(MAX),
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      'self_exams'
    );

    // Cycles table
    await runQuery(
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cycles' AND xtype='U')
      CREATE TABLE cycles (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        flow_type NVARCHAR(50),
        notes NVARCHAR(MAX),
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      'cycles'
    );

    // Medications table
    await runQuery(
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='medications' AND xtype='U')
      CREATE TABLE medications (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        name NVARCHAR(255) NOT NULL,
        dosage NVARCHAR(255),
        frequency NVARCHAR(255),
        start_date DATE,
        end_date DATE,
        reason NVARCHAR(MAX),
        notes NVARCHAR(MAX),
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      'medications'
    );

    // Medication Logs table
    await runQuery(
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='medication_logs' AND xtype='U')
      CREATE TABLE medication_logs (
        id INT PRIMARY KEY IDENTITY(1,1),
        medication_id INT NOT NULL,
        logged_at DATETIME2 DEFAULT GETDATE(),
        notes NVARCHAR(MAX),
        FOREIGN KEY (medication_id) REFERENCES medications (id) ON DELETE CASCADE
      )`,
      'medication_logs'
    );

    // Questionnaire table
    await runQuery(
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='questionnaire' AND xtype='U')
      CREATE TABLE questionnaire (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT UNIQUE NOT NULL,
        health_status NVARCHAR(MAX),
        risk_factors NVARCHAR(MAX),
        family_history NVARCHAR(MAX),
        lifestyle_info NVARCHAR(MAX),
        submitted_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      'questionnaire'
    );

    // Journal table
    await runQuery(
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='journal' AND xtype='U')
      CREATE TABLE journal (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        title NVARCHAR(255),
        content NVARCHAR(MAX),
        mood NVARCHAR(50),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      'journal'
    );

    // Progress table
    await runQuery(
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='progress' AND xtype='U')
      CREATE TABLE progress (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        activity_type NVARCHAR(255) NOT NULL,
        activity_value FLOAT,
        unit NVARCHAR(50),
        logged_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      'progress'
    );

    console.log('🎉 All database tables initialized');
  }
}

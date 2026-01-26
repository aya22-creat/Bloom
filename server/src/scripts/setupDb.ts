import dotenv from 'dotenv';
import path from 'path';

// @ts-ignore
const sql = require('msnodesqlv8');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbName = process.env.DB_NAME || 'BloomHopeDB';
// Use local SQLEXPRESS with Windows Authentication
const connStringMaster = "Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=master;Trusted_Connection=yes;";
const connStringApp = `Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=${dbName};Trusted_Connection=yes;`;

function query(conn: any, sqlQuery: string): Promise<any> {
  return new Promise((resolve, reject) => {
    conn.query(sqlQuery, (err: Error, rows: any) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function setup() {
  console.log('Connecting to SQL Server (master)...');

  sql.open(connStringMaster, async (err: Error, conn: any) => {
    if (err) {
      console.error('Setup failed: ConnectionError:', err);
      return;
    }
    console.log('Connected to master.');

    try {
      // Check if DB exists
      const result = await query(conn, `SELECT name FROM sys.databases WHERE name = '${dbName}'`);
      if (result.length === 0) {
        console.log(`Creating database ${dbName}...`);
        await query(conn, `CREATE DATABASE ${dbName}`);
        console.log('Database created.');
      } else {
        console.log(`Database ${dbName} already exists.`);
      }

      conn.close(() => {
        console.log(`Connecting to ${dbName}...`);
        
        sql.open(connStringApp, async (err: Error, appConn: any) => {
          if (err) {
             console.error('Failed to connect to app DB:', err);
             return;
          }

          try {
            // Users
            await query(appConn, `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
            CREATE TABLE users (
              id INT IDENTITY(1,1) PRIMARY KEY,
              username NVARCHAR(255) UNIQUE NOT NULL,
              email NVARCHAR(255) UNIQUE NOT NULL,
              password NVARCHAR(MAX) NOT NULL,
              created_at DATETIME DEFAULT GETDATE()
            )`);

            // User Profiles
            await query(appConn, `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_profiles' AND xtype='U')
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
            await query(appConn, `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='reminders' AND xtype='U')
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
            await query(appConn, `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='symptoms' AND xtype='U')
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

            // Self Exams
            await query(appConn, `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='self_exams' AND xtype='U')
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
            await query(appConn, `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cycles' AND xtype='U')
            CREATE TABLE cycles (
              id INT IDENTITY(1,1) PRIMARY KEY,
              user_id INT NOT NULL,
              start_date DATE NOT NULL,
              end_date DATE,
              created_at DATETIME DEFAULT GETDATE(),
              FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )`);

            // Health Logs
            await query(appConn, `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='health_logs' AND xtype='U')
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

            console.log('Setup completed successfully.');
            appConn.close();
          } catch (err) {
            console.error('Error creating tables:', err);
            appConn.close();
          }
        });
      });
    } catch (err) {
      console.error('Setup failed:', err);
      conn.close();
    }
  });
}

setup();
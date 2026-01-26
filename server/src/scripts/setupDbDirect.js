const sql = require('msnodesqlv8');

const dbName = 'BloomHopeDB';
const connStringMaster = "Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=master;Trusted_Connection=yes;";
const connStringApp = `Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=${dbName};Trusted_Connection=yes;`;

function query(conn, sqlQuery) {
  return new Promise((resolve, reject) => {
    conn.query(sqlQuery, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function run() {
  console.log('Connecting to master...');
  
  sql.open(connStringMaster, async (err, conn) => {
    if (err) {
      console.error('Failed to connect to master:', err);
      return;
    }
    console.log('Connected to master.');

    try {
      // Check DB
      const result = await query(conn, `SELECT name FROM sys.databases WHERE name = '${dbName}'`);
      if (result.length === 0) {
        console.log(`Creating database ${dbName}...`);
        await query(conn, `CREATE DATABASE ${dbName}`);
        console.log('Database created.');
      } else {
        console.log('Database exists.');
      }
      
      // Close master connection
      conn.close(() => {
        console.log('Closed master connection. Connecting to app DB...');
        
        // Connect to App DB
        sql.open(connStringApp, async (err, appConn) => {
          if (err) {
            console.error('Failed to connect to app DB:', err);
            return;
          }
          console.log('Connected to app DB.');

          try {
            // Create Users Table
            await query(appConn, `
              IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
              CREATE TABLE users (
                id INT IDENTITY(1,1) PRIMARY KEY,
                username NVARCHAR(255) UNIQUE NOT NULL,
                email NVARCHAR(255) UNIQUE NOT NULL,
                password NVARCHAR(MAX) NOT NULL,
                created_at DATETIME DEFAULT GETDATE()
              )
            `);
            console.log('Users table ready.');

            // Create User Profiles
            await query(appConn, `
              IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_profiles' AND xtype='U')
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
              )
            `);
            console.log('User Profiles table ready.');

            // Reminders
            await query(appConn, `
              IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='reminders' AND xtype='U')
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
              )
            `);
            console.log('Reminders table ready.');

            // Symptoms
            await query(appConn, `
              IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='symptoms' AND xtype='U')
              CREATE TABLE symptoms (
                id INT IDENTITY(1,1) PRIMARY KEY,
                user_id INT NOT NULL,
                symptom_name NVARCHAR(255) NOT NULL,
                severity INT CHECK (severity >= 1 AND severity <= 10),
                note NVARCHAR(MAX),
                date DATETIME DEFAULT GETDATE(),
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
              )
            `);
            console.log('Symptoms table ready.');

            // Health Logs
            await query(appConn, `
               IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='health_logs' AND xtype='U')
               CREATE TABLE health_logs (
                 id INT IDENTITY(1,1) PRIMARY KEY,
                 user_id INT NOT NULL,
                 weight FLOAT,
                 blood_pressure NVARCHAR(20),
                 mood NVARCHAR(50),
                 sleep_hours FLOAT,
                 date DATETIME DEFAULT GETDATE(),
                 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
               )
            `);
            console.log('Health Logs table ready.');

            console.log('All tables setup successfully!');
            appConn.close();
            
          } catch (err) {
            console.error('Error creating tables:', err);
            appConn.close();
          }
        });
      });

    } catch (err) {
      console.error('Error in master setup:', err);
      conn.close();
    }
  });
}

run();
/**
 * Database Migration Script
 * Adds user_type and language columns to users table if they don't exist
 */

import dotenv from 'dotenv';
const sql = require('msnodesqlv8');

dotenv.config();

const connectionString = `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || '.\\SQLEXPRESS'};Database=${process.env.DB_NAME || 'BloomHopeDB'};Trusted_Connection=yes;`;

async function migrate() {
  return new Promise<void>((resolve, reject) => {
    console.log('🔄 Starting database migration...');
    console.log('Connection string:', connectionString);

    sql.open(connectionString, (err: Error, conn: any) => {
      if (err) {
        console.error('❌ Failed to connect to database:', err);
        reject(err);
        return;
      }

      console.log('✅ Connected to database');

      // Check if columns exist and add them if they don't
      const migrations = [
        {
          name: 'Add user_type column',
          check: `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
                  WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'user_type'`,
          migrate: `ALTER TABLE users 
                    ADD user_type NVARCHAR(50) 
                    CHECK (user_type IN ('fighter','survivor','wellness')) 
                    DEFAULT 'wellness'`
        },
        {
          name: 'Add language column',
          check: `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
                  WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'language'`,
          migrate: `ALTER TABLE users ADD language NVARCHAR(10) DEFAULT 'en'`
        }
      ];

      let completed = 0;

      migrations.forEach((migration) => {
        conn.query(migration.check, (err: Error, rows: any[]) => {
          if (err) {
            console.error(`❌ Error checking ${migration.name}:`, err);
            return;
          }

          const exists = rows && rows[0] && rows[0].count > 0;

          if (exists) {
            console.log(`✓ ${migration.name} - already exists`);
            completed++;
            if (completed === migrations.length) {
              console.log('✅ Migration complete!');
              conn.close();
              resolve();
            }
          } else {
            console.log(`🔧 ${migration.name} - adding...`);
            conn.query(migration.migrate, (err: Error) => {
              if (err) {
                console.error(`❌ Error adding ${migration.name}:`, err);
              } else {
                console.log(`✅ ${migration.name} - added successfully`);
              }
              completed++;
              if (completed === migrations.length) {
                console.log('✅ Migration complete!');
                conn.close();
                resolve();
              }
            });
          }
        });
      });
    });
  });
}

// Run migration
migrate()
  .then(() => {
    console.log('Migration finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

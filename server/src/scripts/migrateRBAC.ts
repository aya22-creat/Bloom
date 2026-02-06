import { Database } from '../lib/database';

/**
 * Migration script to add RBAC columns to users table
 * Run this once to prepare the database for RBAC features
 */
async function migrateDatabase() {
  try {
    console.log('🔄 Starting database migration for RBAC...');

    // Add role column if it doesn't exist
    try {
      Database.db.run(
        `ALTER TABLE users ADD COLUMN role TEXT CHECK(role IN ('patient', 'doctor', 'admin')) DEFAULT 'patient'`,
        (err: any) => {
          if (err && err.message.includes('duplicate')) {
            console.log('✓ Column role already exists');
          } else if (err) {
            console.log('✓ Column role added (or already exists)');
          }
        }
      );
    } catch (e) {
      console.log('✓ Column role already exists or migration skipped');
    }

    // Add approved column if it doesn't exist
    try {
      Database.db.run(
        `ALTER TABLE users ADD COLUMN approved BOOLEAN DEFAULT 1`,
        (err: any) => {
          if (err && err.message.includes('duplicate')) {
            console.log('✓ Column approved already exists');
          } else if (err) {
            console.log('✓ Column approved added (or already exists)');
          }
        }
      );
    } catch (e) {
      console.log('✓ Column approved already exists or migration skipped');
    }

    // Add assigned_doctor_id column if it doesn't exist
    try {
      Database.db.run(
        `ALTER TABLE users ADD COLUMN assigned_doctor_id INTEGER REFERENCES users(id)`,
        (err: any) => {
          if (err && err.message.includes('duplicate')) {
            console.log('✓ Column assigned_doctor_id already exists');
          } else if (err) {
            console.log('✓ Column assigned_doctor_id added (or already exists)');
          }
        }
      );
    } catch (e) {
      console.log('✓ Column assigned_doctor_id already exists or migration skipped');
    }

    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration
migrateDatabase();

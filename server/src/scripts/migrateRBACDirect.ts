import BetterSqlite3 from 'better-sqlite3';
import path from 'path';

/**
 * Direct database migration using better-sqlite3
 */
function migrateDatabase() {
  try {
    const dbFile = './data/bloomhope.db';
    const dbPath = path.resolve(dbFile);
    
    console.log('🔄 Opening database:', dbPath);
    const db = new BetterSqlite3(dbPath);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Check and add role column
    try {
      const tableInfo = db.prepare("PRAGMA table_info(users)").all();
      const hasRole = tableInfo.some((col: any) => col.name === 'role');
      
      if (!hasRole) {
        console.log('📝 Adding role column...');
        db.exec(`ALTER TABLE users ADD COLUMN role TEXT CHECK(role IN ('patient', 'doctor', 'admin')) DEFAULT 'patient'`);
        console.log('✓ role column added');
      } else {
        console.log('✓ role column already exists');
      }
    } catch (e: any) {
      console.log('⚠️  role column check/add:', e.message);
    }

    // Check and add approved column
    try {
      const tableInfo = db.prepare("PRAGMA table_info(users)").all();
      const hasApproved = tableInfo.some((col: any) => col.name === 'approved');
      
      if (!hasApproved) {
        console.log('📝 Adding approved column...');
        db.exec(`ALTER TABLE users ADD COLUMN approved BOOLEAN DEFAULT 1`);
        console.log('✓ approved column added');
      } else {
        console.log('✓ approved column already exists');
      }
    } catch (e: any) {
      console.log('⚠️  approved column check/add:', e.message);
    }

    // Check and add assigned_doctor_id column
    try {
      const tableInfo = db.prepare("PRAGMA table_info(users)").all();
      const hasAssignedDoctorId = tableInfo.some((col: any) => col.name === 'assigned_doctor_id');
      
      if (!hasAssignedDoctorId) {
        console.log('📝 Adding assigned_doctor_id column...');
        db.exec(`ALTER TABLE users ADD COLUMN assigned_doctor_id INTEGER REFERENCES users(id)`);
        console.log('✓ assigned_doctor_id column added');
      } else {
        console.log('✓ assigned_doctor_id column already exists');
      }
    } catch (e: any) {
      console.log('⚠️  assigned_doctor_id column check/add:', e.message);
    }

    // Check final schema
    console.log('\n📋 Final users table schema:');
    const schema = db.prepare("PRAGMA table_info(users)").all();
    schema.forEach((col: any) => {
      console.log(`  - ${col.name} (${col.type})`);
    });

    db.close();
    console.log('\n✅ Database migration completed successfully!');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrateDatabase();

/**
 * Seed script for test users
 * Creates default admin, doctor, and patient accounts
 */

import { Database } from '../lib/database';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

interface SeedUser {
  username: string;
  email: string;
  password: string;
  user_type: 'fighter' | 'survivor' | 'wellness' | 'doctor' | 'admin';
  language?: 'ar' | 'en';
}

const seedUsers: SeedUser[] = [
  // Admin Account
  {
    username: 'Admin',
    email: 'admin@bloom.com',
    password: 'Admin@123',
    user_type: 'admin',
    language: 'en',
  },
  // Doctor Accounts
  {
    username: 'Dr. Sarah',
    email: 'doctor@bloom.com',
    password: 'Doctor@123',
    user_type: 'doctor',
    language: 'en',
  },
  {
    username: 'د. فاطمة',
    email: 'doctor.ar@bloom.com',
    password: 'Doctor@123',
    user_type: 'doctor',
    language: 'ar',
  },
  // Patient Accounts
  {
    username: 'Patient Fighter',
    email: 'fighter@bloom.com',
    password: 'Patient@123',
    user_type: 'fighter',
    language: 'en',
  },
  {
    username: 'Patient Survivor',
    email: 'survivor@bloom.com',
    password: 'Patient@123',
    user_type: 'survivor',
    language: 'en',
  },
  {
    username: 'Patient Wellness',
    email: 'wellness@bloom.com',
    password: 'Patient@123',
    user_type: 'wellness',
    language: 'en',
  },
];

async function seedTestUsers() {
  console.log('🌱 Starting test users seed...\n');

  try {
    // Initialize database
    await Database.init();

    for (const user of seedUsers) {
      // Check if user exists
      const existingUser = await new Promise<any>((resolve, reject) => {
        Database.db.get(
          'SELECT id FROM users WHERE email = ?',
          [user.email],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (existingUser) {
        console.log(`⏭️  User ${user.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

      // Insert user
      const userId = await new Promise<number>((resolve, reject) => {
        Database.db.run(
          `INSERT INTO users (username, email, password, user_type, language, created_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            user.username,
            user.email,
            hashedPassword,
            user.user_type,
            user.language || 'en',
          ],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      console.log(`✅ Created ${user.user_type.toUpperCase()}: ${user.username} (${user.email})`);
    }

    console.log('\n🎉 Test users created successfully!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 TEST CREDENTIALS:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n👤 ADMIN:');
    console.log('   Email: admin@bloom.com');
    console.log('   Password: Admin@123');
    console.log('\n🏥 DOCTORS:');
    console.log('   Email: doctor@bloom.com');
    console.log('   Password: Doctor@123');
    console.log('   ---');
    console.log('   Email: doctor.ar@bloom.com (Arabic)');
    console.log('   Password: Doctor@123');
    console.log('\n🩺 PATIENTS:');
    console.log('   Fighter: fighter@bloom.com / Patient@123');
    console.log('   Survivor: survivor@bloom.com / Patient@123');
    console.log('   Wellness: wellness@bloom.com / Patient@123');
    console.log('\n═══════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    process.exit(1);
  }
}

// Run the seed function
seedTestUsers();

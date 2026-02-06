/**
 * Seed script for role-based data
 * Creates sample admin, doctor, and patient users for testing
 */

import { Database } from '../lib/database';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

interface SeedUser {
  username: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor' | 'admin';
  userType?: 'fighter' | 'survivor' | 'wellness';
  approved?: boolean;
  language?: 'ar' | 'en';
}

const seedUsers: SeedUser[] = [
  {
    username: 'Admin User',
    email: 'admin@bloomhope.com',
    password: 'Admin123!',
    role: 'admin',
    approved: true,
    language: 'en',
  },
  {
    username: 'Dr. Sarah Ahmed',
    email: 'dr.sarah@bloomhope.com',
    password: 'Doctor123!',
    role: 'doctor',
    approved: true,
    language: 'en',
  },
  {
    username: 'Dr. Fatima Hassan',
    email: 'dr.fatima@bloomhope.com',
    password: 'Doctor123!',
    role: 'doctor',
    approved: true,
    language: 'ar',
  },
  {
    username: 'Dr. Pending Approval',
    email: 'dr.pending@bloomhope.com',
    password: 'Doctor123!',
    role: 'doctor',
    approved: false, // This doctor needs approval
    language: 'en',
  },
  {
    username: 'Aisha Mohamed',
    email: 'aisha@example.com',
    password: 'Patient123!',
    role: 'patient',
    userType: 'fighter',
    approved: true,
    language: 'ar',
  },
  {
    username: 'Maria Garcia',
    email: 'maria@example.com',
    password: 'Patient123!',
    role: 'patient',
    userType: 'survivor',
    approved: true,
    language: 'en',
  },
  {
    username: 'Layla Ibrahim',
    email: 'layla@example.com',
    password: 'Patient123!',
    role: 'patient',
    userType: 'wellness',
    approved: true,
    language: 'ar',
  },
];

async function seedRoles() {
  console.log('🌱 Starting role-based seed data...');

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
          `INSERT INTO users (username, email, password, role, userType, approved, language, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            user.username,
            user.email,
            hashedPassword,
            user.role,
            user.userType || null,
            user.approved ? 1 : 0,
            user.language || 'en',
          ],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      console.log(`✅ Created ${user.role}: ${user.username} (ID: ${userId})`);
    }

    // Assign patients to approved doctors
    const doctor = await new Promise<any>((resolve, reject) => {
      Database.db.get(
        "SELECT id FROM users WHERE role = 'doctor' AND approved = 1 LIMIT 1",
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (doctor) {
      const patients = await new Promise<any[]>((resolve, reject) => {
        Database.db.all(
          "SELECT id FROM users WHERE role = 'patient'",
          [],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          }
        );
      });

      for (const patient of patients) {
        await new Promise<void>((resolve, reject) => {
          Database.db.run(
            'UPDATE users SET assigned_doctor_id = ? WHERE id = ?',
            [doctor.id, patient.id],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

      console.log(`✅ Assigned ${patients.length} patients to Dr. Sarah Ahmed`);
    }

    console.log('\n🎉 Seed data created successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Admin: admin@bloomhope.com / Admin123!');
    console.log('Doctor (Approved): dr.sarah@bloomhope.com / Doctor123!');
    console.log('Doctor (Pending): dr.pending@bloomhope.com / Doctor123!');
    console.log('Patient: aisha@example.com / Patient123!');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedRoles();

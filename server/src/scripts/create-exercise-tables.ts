/**
 * Database Migration: Exercise Evaluation System
 * Creates tables for reference exercises and patient evaluations
 */

import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../data/bloomhope.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('🏗️  Creating exercise evaluation tables...');

try {
  // Table: exercises
  // Stores doctor-uploaded reference exercises with pose data
  db.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      description TEXT,
      description_ar TEXT,
      created_by INTEGER NOT NULL,
      reference_pose TEXT NOT NULL, -- JSON: Array of pose landmarks per frame
      expected_reps INTEGER DEFAULT 1,
      hold_seconds INTEGER DEFAULT 0,
      tolerance INTEGER DEFAULT 15, -- Angle tolerance in degrees
      difficulty_level TEXT DEFAULT 'medium' CHECK(difficulty_level IN ('easy', 'medium', 'hard')),
      target_body_part TEXT, -- e.g., "shoulder", "knee", "back"
      instructions TEXT,
      instructions_ar TEXT,
      warnings TEXT, -- JSON: Array of safety warnings
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Table "exercises" created');

  // Table: exercise_evaluations
  // Stores patient exercise performance results
  db.exec(`
    CREATE TABLE IF NOT EXISTS exercise_evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER NOT NULL,
      patient_id INTEGER NOT NULL,
      session_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      -- Performance metrics
      score INTEGER NOT NULL CHECK(score >= 0 AND score <= 100),
      accuracy REAL NOT NULL, -- Pose accuracy percentage
      reps_completed INTEGER DEFAULT 0,
      reps_expected INTEGER NOT NULL,
      
      -- Quality indicators
      angle_score REAL DEFAULT 0, -- 0-40 points
      rep_score REAL DEFAULT 0, -- 0-30 points
      stability_score REAL DEFAULT 0, -- 0-20 points
      completion_score REAL DEFAULT 0, -- 0-10 points
      
      -- Pose data (for replay/analysis)
      patient_pose TEXT, -- JSON: Simplified pose keypoints (optional, for review)
      
      -- Warnings and flags
      warnings TEXT, -- JSON: Array of detected issues ["low_stability", "unsafe_angle"]
      has_alerts BOOLEAN DEFAULT 0,
      
      -- Patient feedback
      pain_level INTEGER DEFAULT 0 CHECK(pain_level >= 0 AND pain_level <= 10),
      fatigue_level INTEGER DEFAULT 0 CHECK(fatigue_level >= 0 AND fatigue_level <= 10),
      patient_notes TEXT,
      
      -- Doctor review
      doctor_reviewed BOOLEAN DEFAULT 0,
      doctor_notes TEXT,
      doctor_id INTEGER,
      reviewed_at DATETIME,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  console.log('✅ Table "exercise_evaluations" created');

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_exercises_created_by ON exercises(created_by);
    CREATE INDEX IF NOT EXISTS idx_exercises_active ON exercises(is_active);
    CREATE INDEX IF NOT EXISTS idx_evaluations_exercise ON exercise_evaluations(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_evaluations_patient ON exercise_evaluations(patient_id);
    CREATE INDEX IF NOT EXISTS idx_evaluations_date ON exercise_evaluations(session_date);
    CREATE INDEX IF NOT EXISTS idx_evaluations_alerts ON exercise_evaluations(has_alerts);
  `);
  console.log('✅ Indexes created');

  // Create sample exercise for testing
  const sampleExercise = db.prepare(`
    INSERT INTO exercises (
      name, name_ar, description, description_ar, created_by, 
      reference_pose, expected_reps, hold_seconds, tolerance, 
      difficulty_level, target_body_part, instructions, instructions_ar
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Get a doctor user (role_id = 2) for testing
  const doctor = db.prepare('SELECT id FROM users WHERE role_id = 2 LIMIT 1').get() as { id: number } | undefined;
  
  if (doctor) {
    const referencePose = JSON.stringify([
      { frame: 0, left_shoulder_angle: 30, right_shoulder_angle: 28, left_elbow_angle: 180, right_elbow_angle: 180 },
      { frame: 30, left_shoulder_angle: 90, right_shoulder_angle: 88, left_elbow_angle: 180, right_elbow_angle: 180 },
      { frame: 60, left_shoulder_angle: 30, right_shoulder_angle: 28, left_elbow_angle: 180, right_elbow_angle: 180 }
    ]);

    sampleExercise.run(
      'Shoulder Abduction',
      'رفع الذراع الجانبي',
      'Raise arms sideways to shoulder level',
      'ارفع ذراعيك جانبياً حتى مستوى الكتف',
      doctor.id,
      referencePose,
      5,
      2,
      15,
      'medium',
      'shoulder',
      'Stand straight, raise both arms sideways to 90 degrees, hold for 2 seconds, then lower slowly.',
      'قف بشكل مستقيم، ارفع ذراعيك جانباً حتى 90 درجة، ثبت لمدة ثانيتين، ثم اخفضهما ببطء.'
    );
    console.log('✅ Sample exercise created');
  }

  console.log('\n✨ Exercise evaluation system tables created successfully!');
  console.log('📊 Tables: exercises, exercise_evaluations');
  console.log('🔍 Run queries to verify:\n');
  console.log('   SELECT * FROM exercises;');
  console.log('   SELECT * FROM exercise_evaluations;');

} catch (error) {
  console.error('❌ Error creating tables:', error);
  throw error;
} finally {
  db.close();
}


require('dotenv').config();
import { Database } from './src/lib/database';
import bcrypt from 'bcryptjs';

async function debug() {
  try {
    console.log('Initializing DB...');
    await Database.init();
    
    const email = 'test_reg_' + Date.now() + '@test.com';
    const password = await bcrypt.hash('password123', 10);
    
    console.log('Attempting insert with:', email);
    
    // Simulate what userController does
    Database.db.run(
      `INSERT INTO users (username, email, password, user_type, language) VALUES (?, ?, ?, ?, ?)`,
      ['test_user', email, password, 'wellness', 'en'],
      function (err) {
        if (err) {
          console.error('INSERT FAILED:', err);
        } else {
          console.log('INSERT SUCCESS. New ID:', this.lastID);
        }
      }
    );
    
  } catch (e) {
    console.error('Init failed:', e);
  }
}

debug();

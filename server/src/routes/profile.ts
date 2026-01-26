import { Router } from 'express';
import { Database, RunResult } from '../lib/database';
import { UserProfile } from '../types/profile';

const router = Router();

// Create or update user profile
router.post('/', (req, res) => {
  const {
    userId,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    country,
  } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  Database.db.get(
    `SELECT id FROM user_profiles WHERE user_id = ?`,
    [userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to check profile.' });
      }

      if (row) {
        // Update existing profile
        const fields = [];
        const params = [];
        if (firstName) {
          fields.push('first_name = ?');
          params.push(firstName);
        }
        if (lastName) {
          fields.push('last_name = ?');
          params.push(lastName);
        }
        if (dateOfBirth) {
          fields.push('date_of_birth = ?');
          params.push(dateOfBirth);
        }
        if (gender) {
          fields.push('gender = ?');
          params.push(gender);
        }
        if (country) {
          fields.push('country = ?');
          params.push(country);
        }
        params.push(userId);

        Database.db.run(
          `UPDATE user_profiles SET ${fields.join(
            ', '
          )} WHERE user_id = ?`,
          params,
          function (this: RunResult, err) {
            if (err) {
              return res.status(400).json({ error: 'Failed to update profile.' });
            }
            res.json({ message: 'Profile updated successfully.' });
          }
        );
      } else {
        // Create new profile
        Database.db.run(
          `INSERT INTO user_profiles (user_id, first_name, last_name, date_of_birth, gender, country)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, firstName, lastName, dateOfBirth, gender, country],
          function (this: RunResult, err) {
            if (err) {
              return res.status(400).json({ error: 'Failed to create profile.' });
            }
            res.status(201).json({ id: this.lastID });
          }
        );
      }
    }
  );
});

// Get user profile
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  Database.db.get(
    `SELECT * FROM user_profiles WHERE user_id = ?`,
    [userId],
    (err, row: UserProfile) => {
      if (err || !row) {
        return res.status(404).json({ error: 'Profile not found.' });
      }
      res.json(row);
    }
  );
});

export default router;


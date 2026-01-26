import { Router } from 'express';
import { Database, RunResult } from '../lib/database';

const router = Router();

// List progress logs by user
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  Database.db.all(
    `SELECT * FROM progress_logs WHERE user_id = ? ORDER BY log_date DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch progress logs.' });
      }
      res.json(rows);
    }
  );
});

// Get progress by activity type
router.get('/:userId/activity/:activityType', (req, res) => {
  const { userId, activityType } = req.params;
  Database.db.all(
    `SELECT * FROM progress_logs WHERE user_id = ? AND activity_type = ? ORDER BY log_date DESC`,
    [userId, activityType],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch progress logs.' });
      }
      res.json(rows);
    }
  );
});

// Create progress log
router.post('/', (req, res) => {
  const { user_id, activity_type, value, notes } = req.body;
  
  if (!user_id || !activity_type || value === undefined) {
    return res.status(400).json({ error: 'user_id, activity_type, and value are required.' });
  }

  Database.db.run(
    `INSERT INTO progress_logs (user_id, activity_type, value, notes)
     VALUES (?, ?, ?, ?)`,
    [user_id, activity_type, value, notes || null],
    function (this: RunResult, err) {
      if (err) {
        return res.status(400).json({ error: 'Failed to create progress log.' });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Delete progress log
router.delete('/:logId', (req, res) => {
  const { logId } = req.params;

  Database.db.run(
    `DELETE FROM progress_logs WHERE id = ?`,
    [logId],
    function (this: RunResult, err) {
      if (err) {
        return res.status(400).json({ error: 'Failed to delete progress log.' });
      }
      res.json({ message: 'Progress log deleted successfully.' });
    }
  );
});

export default router;


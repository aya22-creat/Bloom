import { Router } from 'express';
import { Database, RunResult } from '../lib/database';
import { SelfExam } from '../types/selfExam';

const router = Router();

// List self exams by user
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  Database.db.all(
    `SELECT * FROM self_exams WHERE user_id = ? ORDER BY performed_at DESC`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch self exams.' });
      res.json(rows);
    }
  );
});

// Create self exam
router.post('/', (req, res) => {
  const e = req.body as SelfExam;
  if (!e.user_id) return res.status(400).json({ error: 'user_id is required.' });

  Database.db.run(
    `INSERT INTO self_exams (user_id, performed_at, findings, pain_level, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [e.user_id, e.performed_at || null, e.findings || null, e.pain_level ?? null, e.notes || null],
    function (this: RunResult, err) {
      if (err) return res.status(400).json({ error: 'Failed to create self exam.' });
      res.status(201).json({ id: this.lastID });
    }
  );
});

export default router;

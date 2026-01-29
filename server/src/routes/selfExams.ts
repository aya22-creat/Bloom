import { Router } from 'express';
import { Database, RunResult } from '../lib/database';
import { SelfExam } from '../types/selfExam';

const router = Router();

// List self exams by user
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  Database.db.all(
    `SELECT * FROM self_exams WHERE user_id = ? ORDER BY exam_date DESC`,
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

  // Accept various date field names
  const examDate = (e as any).exam_date || e.date || (e as any).performed_at || new Date().toISOString().split('T')[0];

  Database.db.run(
    `INSERT INTO self_exams (user_id, exam_date, findings, notes)
     VALUES (?, ?, ?, ?)`,
    [e.user_id, examDate, e.findings || null, e.notes || null],
    function (this: RunResult, err) {
      if (err) return res.status(400).json({ error: 'Failed to create self exam.' });
      res.status(201).json({ id: this.lastID });
    }
  );
});

export default router;

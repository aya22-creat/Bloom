import { Router } from 'express';
import { Database, RunResult } from '../lib/database';
import { SelfExam } from '../types/selfExam';

const router = Router();

router.get('/mandatory-status/:userId', (req, res) => {
  const userId = Number(req.params.userId);
  if (!userId || userId <= 0) {
    return res.status(400).json({ error: 'Valid userId is required' });
  }

  Database.db.get(
    `SELECT end_date FROM cycles WHERE user_id = ? AND end_date IS NOT NULL ORDER BY end_date DESC`,
    [userId],
    (err, row: any) => {
      if (err || !row?.end_date) {
        return res.json({ required: false });
      }

      const end =
        row.end_date instanceof Date ? new Date(row.end_date.getTime()) : new Date(String(row.end_date));
      if (Number.isNaN(end.getTime())) {
        return res.json({ required: false });
      }

      const requiredFrom = new Date(end.getTime());
      requiredFrom.setDate(requiredFrom.getDate() + 1);
      requiredFrom.setHours(0, 0, 0, 0);

      const requiredFromStr = `${requiredFrom.getFullYear()}-${String(requiredFrom.getMonth() + 1).padStart(2, '0')}-${String(requiredFrom.getDate()).padStart(2, '0')}`;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (today.getTime() < requiredFrom.getTime()) {
        return res.json({ required: false, requiredFrom: requiredFromStr });
      }

      Database.db.get(
        `SELECT id, exam_date FROM self_exams WHERE user_id = ? AND exam_date >= ? ORDER BY exam_date DESC`,
        [userId, requiredFromStr],
        (err2, examRow: any) => {
          if (err2) {
            return res.json({ required: true, requiredFrom: requiredFromStr });
          }
          const completed = Boolean(examRow?.id);
          return res.json({ required: !completed, requiredFrom: requiredFromStr, completedAt: examRow?.exam_date || null });
        }
      );
    }
  );
});

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
  const raw = req.body || {};
  const e = raw as SelfExam;
  const userId = Number((e as any).user_id ?? (e as any).userId);
  if (!userId) return res.status(400).json({ error: 'user_id is required.' });

  // Accept various date field names
  const examDate = (e as any).exam_date || (e as any).examDate || e.date || (e as any).performed_at || new Date().toISOString().split('T')[0];

  Database.db.run(
    `INSERT INTO self_exams (user_id, exam_date, findings, notes)
     VALUES (?, ?, ?, ?)`,
    [userId, examDate, (e as any).findings || null, (e as any).notes || null],
    function (this: RunResult, err) {
      if (err) return res.status(400).json({ error: 'Failed to create self exam.' });
      res.status(201).json({ id: this.lastID });
    }
  );
});

export default router;

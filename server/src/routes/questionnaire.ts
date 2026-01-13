import { Router } from 'express';
import { Database } from '../lib/database';
import { QuestionnaireResponse } from '../types/questionnaire';

const router = Router();

// List responses by user
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  Database.db.all(
    `SELECT * FROM questionnaire_responses WHERE user_id = ? ORDER BY submitted_at DESC`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch responses.' });
      const parsed = rows.map((r: any) => ({
        ...r,
        answers: r.answers ? JSON.parse(r.answers) : null,
        result: r.result ? JSON.parse(r.result) : null,
      }));
      res.json(parsed);
    }
  );
});

// Submit response
router.post('/', (req, res) => {
  const q = req.body as QuestionnaireResponse;
  if (!q.user_id || !q.answers) {
    return res.status(400).json({ error: 'user_id and answers are required.' });
  }
  Database.db.run(
    `INSERT INTO questionnaire_responses (user_id, submitted_at, answers, result)
     VALUES (?, ?, ?, ?)`,
    [q.user_id, q.submitted_at || null, JSON.stringify(q.answers), q.result ? JSON.stringify(q.result) : null],
    function (err) {
      if (err) return res.status(400).json({ error: 'Failed to submit response.' });
      res.status(201).json({ id: this.lastID });
    }
  );
});

export default router;
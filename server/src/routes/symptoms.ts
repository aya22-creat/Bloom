import { Router } from 'express';
import { Database, RunResult } from '../lib/database';
import { Symptom } from '../types/symptom';

const router = Router();

// List symptoms by user
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  Database.db.all(
    `SELECT * FROM symptoms WHERE user_id = ? ORDER BY logged_at DESC`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch symptoms.' });
      res.json(rows);
    }
  );
});

// Create symptom
router.post('/', (req, res) => {
  const s = req.body as Symptom;
  // Accept both description and symptom_name for flexibility
  const symptomName = s.description || (s as any).symptom_name || '';
  const severity = s.severity;
  
  if (!s.user_id || !symptomName) {
    return res.status(400).json({ error: 'user_id and description/symptom_name are required.' });
  }
  
  Database.db.run(
    `INSERT INTO symptoms (user_id, symptom_name, severity, notes)
     VALUES (?, ?, ?, ?)`,
    [s.user_id, symptomName, severity || null, s.notes || null],
    function (this: RunResult, err) {
      if (err) return res.status(400).json({ error: 'Failed to create symptom.' });
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Update symptom
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const s = req.body as Partial<Symptom>;
  const fields: string[] = [];
  const params: any[] = [];

  const setter = (key: string, val: any) => { fields.push(`${key} = ?`); params.push(val); };

  if (s.date !== undefined) setter('date', s.date);
  if (s.description !== undefined) setter('description', s.description);
  if (s.severity !== undefined) setter('severity', s.severity);
  if (s.notes !== undefined) setter('notes', s.notes);
  params.push(id);

  Database.db.run(
    `UPDATE symptoms SET ${fields.join(', ')} WHERE id = ?`,
    params,
    function (this: RunResult, err) {
      if (err) return res.status(400).json({ error: 'Failed to update symptom.' });
      res.json({ message: 'Symptom updated successfully.' });
    }
  );
});

// Delete symptom
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  Database.db.run(`DELETE FROM symptoms WHERE id = ?`, [id], function (this: RunResult, err) {
    if (err) return res.status(500).json({ error: 'Failed to delete symptom.' });
    if (this.changes === 0) return res.status(404).json({ error: 'Symptom not found.' });
    res.json({ message: 'Symptom deleted successfully.' });
  });
});

export default router;

import { Router } from 'express';
import { Database, RunResult } from '../lib/database';
import { Cycle } from '../types/cycle';

const router = Router();

router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  Database.db.all(
    `SELECT * FROM cycles WHERE user_id = ? ORDER BY start_date DESC`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch cycles.' });
      res.json(rows);
    }
  );
});

router.post('/', (req, res) => {
  const c = req.body as Cycle;
  if (!c.user_id || !c.start_date) {
    return res.status(400).json({ error: 'user_id and start_date are required.' });
  }
  Database.db.run(
    `INSERT INTO cycles (user_id, start_date, end_date, notes)
     VALUES (?, ?, ?, ?)`,
    [c.user_id, c.start_date, c.end_date || null, c.notes || null],
    function (this: RunResult, err) {
      if (err) return res.status(400).json({ error: 'Failed to create cycle.' });
      res.status(201).json({ id: this.lastID });
    }
  );
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const c = req.body as Partial<Cycle>;
  const fields: string[] = [];
  const params: any[] = [];
  const setter = (k: string, v: any) => { fields.push(`${k} = ?`); params.push(v); };
  if (c.start_date !== undefined) setter('start_date', c.start_date);
  if (c.end_date !== undefined) setter('end_date', c.end_date);
  if (c.notes !== undefined) setter('notes', c.notes);
  params.push(id);
  Database.db.run(
    `UPDATE cycles SET ${fields.join(', ')} WHERE id = ?`,
    params,
    function (this: RunResult, err) {
      if (err) return res.status(400).json({ error: 'Failed to update cycle.' });
      res.json({ message: 'Cycle updated successfully.' });
    }
  );
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  Database.db.run(`DELETE FROM cycles WHERE id = ?`, [id], function (this: RunResult, err) {
    if (err) return res.status(500).json({ error: 'Failed to delete cycle.' });
    if (this.changes === 0) return res.status(404).json({ error: 'Cycle not found.' });
    res.json({ message: 'Cycle deleted successfully.' });
  });
});

export default router;

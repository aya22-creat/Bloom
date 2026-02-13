import { Router } from 'express';
import { Database, RunResult } from '../lib/database';
import { Medication } from '../types/medication';

const router = Router();

router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  Database.db.all(
    `SELECT * FROM medications WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch medications.' });
      res.json(rows);
    }
  );
});

router.post('/', (req, res) => {
  const m = req.body as Medication;
  if (!m.user_id || !m.name) {
    return res.status(400).json({ error: 'user_id and name are required.' });
  }
  // Map frequency/schedule to match database columns
  const frequency = m.frequency || (m as any).schedule || null;
  const type = m.type || (m as any).medication_type || null;
  
  Database.db.run(
    `INSERT INTO medications (user_id, name, dosage, frequency, type, start_date, end_date, reason, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [m.user_id, m.name, m.dosage || null, frequency, type, m.start_date || null, m.end_date || null, (m as any).reason || null, m.notes || null],
    function (this: RunResult, err) {
      if (err) return res.status(400).json({ error: 'Failed to create medication.' });
      res.status(201).json({ id: this.lastID });
    }
  );
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const m = req.body as Partial<Medication>;
  const fields: string[] = [];
  const params: any[] = [];
  const setter = (k: string, v: any) => { fields.push(`${k} = ?`); params.push(v); };
  if (m.name !== undefined) setter('name', m.name);
  if (m.dosage !== undefined) setter('dosage', m.dosage);
  if (m.frequency !== undefined) setter('frequency', m.frequency);
  if ((m as any).schedule !== undefined) setter('frequency', (m as any).schedule);
  if (m.type !== undefined) setter('type', m.type);
  if (m.start_date !== undefined) setter('start_date', m.start_date);
  if (m.end_date !== undefined) setter('end_date', m.end_date);
  if (m.reason !== undefined) setter('reason', m.reason);
  if (m.notes !== undefined) setter('notes', m.notes);
  params.push(id);
  Database.db.run(
    `UPDATE medications SET ${fields.join(', ')} WHERE id = ?`,
    params,
    function (this: RunResult, err) {
      if (err) return res.status(400).json({ error: 'Failed to update medication.' });
      res.json({ message: 'Medication updated successfully.' });
    }
  );
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  Database.db.run(`DELETE FROM medications WHERE id = ?`, [id], function (this: RunResult, err) {
    if (err) return res.status(500).json({ error: 'Failed to delete medication.' });
    if (this.changes === 0) return res.status(404).json({ error: 'Medication not found.' });
    res.json({ message: 'Medication deleted successfully.' });
  });
});

export default router;

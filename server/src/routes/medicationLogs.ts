import { Router } from 'express';
import { Database, RunResult } from '../lib/database';
import { MedicationLog } from '../types/medication';

const router = Router();

router.get('/:medicationId', (req, res) => {
  const { medicationId } = req.params;
  Database.db.all(
    `SELECT * FROM medication_logs WHERE medication_id = ? ORDER BY taken_at DESC`,
    [medicationId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch logs.' });
      res.json(rows);
    }
  );
});

router.post('/', (req, res) => {
  const log = req.body as MedicationLog;
  if (!log.medication_id || !log.user_id || !log.status) {
    return res.status(400).json({ error: 'medication_id, user_id and status are required.' });
  }
  Database.db.run(
    `INSERT INTO medication_logs (medication_id, user_id, taken_at, status, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [log.medication_id, log.user_id, log.taken_at || null, log.status, log.notes || null],
    function (this: RunResult, err) {
      if (err) return res.status(400).json({ error: 'Failed to create log.' });
      res.status(201).json({ id: this.lastID });
    }
  );
});

export default router;

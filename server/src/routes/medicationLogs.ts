import { Router } from 'express';
import { Database, RunResult } from '../lib/database';
import { MedicationLog } from '../types/medication';

const router = Router();

router.get('/:medicationId', (req, res) => {
  const { medicationId } = req.params;
  Database.db.all(
    `SELECT * FROM medication_logs WHERE medication_id = ? ORDER BY logged_at DESC`,
    [medicationId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch logs.' });
      res.json(rows);
    }
  );
});

// Also support getting logs by user_id for convenience (query medications first)
router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;
  Database.db.all(
    `SELECT ml.* FROM medication_logs ml 
     JOIN medications m ON ml.medication_id = m.id 
     WHERE m.user_id = ? 
     ORDER BY ml.logged_at DESC`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch logs.' });
      res.json(rows);
    }
  );
});

router.post('/', (req, res) => {
  const log = req.body as MedicationLog;
  if (!log.medication_id) {
    return res.status(400).json({ error: 'medication_id is required.' });
  }
  
  // logged_at can be provided or defaults to current timestamp
  const loggedAt = log.logged_at || log.taken_at || new Date().toISOString();
  
  Database.db.run(
    `INSERT INTO medication_logs (medication_id, logged_at, notes)
     VALUES (?, ?, ?)`,
    [log.medication_id, loggedAt, log.notes || null],
    function (this: RunResult, err) {
      if (err) return res.status(400).json({ error: 'Failed to create log.' });
      res.status(201).json({ id: this.lastID });
    }
  );
});

export default router;

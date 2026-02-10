import { Router } from 'express';
import { Database, RunResult } from '../lib/database';
import { Reminder } from '../types/reminder';

const router = Router();

// List reminders by user
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  Database.db.all(
    `SELECT * FROM reminders WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
    (err, rows: any[]) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch reminders.' });
      }
      const parsed = rows.map((r) => ({
        ...r,
        enabled: r.enabled === 1 || r.enabled === true,
        days: r.days ? JSON.parse(r.days) : undefined,
      }));
      res.json(parsed);
    }
  );
});

// Create reminder
router.post('/', (req, res) => {
  const raw = (req.body || {}) as any;

  const reminder: Reminder = {
    user_id: Number(raw.user_id ?? raw.userId),
    title: String(raw.title || ''),
    description: raw.description ? String(raw.description) : undefined,
    type: raw.type,
    time: raw.time ? String(raw.time) : undefined,
    date: raw.date ? String(raw.date) : undefined,
    days: Array.isArray(raw.days) ? raw.days : undefined,
    interval: raw.interval ? String(raw.interval) : undefined,
    enabled:
      raw.enabled !== undefined
        ? (raw.enabled === true || raw.enabled === 1 ? 1 : 0)
        : raw.is_active !== undefined
          ? (raw.is_active === true || raw.is_active === 1 ? 1 : 0)
          : 1,
    mandatory: raw.mandatory === true || raw.mandatory === 1 ? 1 : 0,
  };

  if (!reminder.user_id || !reminder.title || !reminder.type) {
    return res.status(400).json({ error: 'user_id, title, and type are required.' });
  }

  Database.db.run(
    `INSERT INTO reminders (user_id, title, description, type, time, date, days, interval, enabled, mandatory)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      reminder.user_id,
      reminder.title,
      reminder.description || null,
      reminder.type,
      reminder.time || null,
      reminder.date || null,
      reminder.days ? JSON.stringify(reminder.days) : null,
      reminder.interval || null,
      reminder.enabled ? 1 : 0,
      reminder.mandatory ? 1 : 0,
    ],
    function (this: RunResult, err) {
      if (err) {
        return res.status(400).json({ error: 'Failed to create reminder.' });
      }
      const insertedId = Number(this?.lastID || 0);
      if (insertedId && insertedId > 0) {
        return res.status(201).json({ id: insertedId });
      }
      Database.db.get(
        `SELECT id FROM reminders WHERE user_id = ? ORDER BY created_at DESC`,
        [reminder.user_id],
        (e2, row: any) => {
          if (e2 || !row?.id) return res.status(201).json({ id: 0 });
          return res.status(201).json({ id: Number(row.id) });
        }
      );
    }
  );
});

// Update reminder
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const reminder = req.body as Partial<Reminder>;
  const fields: string[] = [];
  const params: any[] = [];

  const setter = (key: string, val: any) => {
    fields.push(`${key} = ?`);
    params.push(val);
  };

  if (reminder.title !== undefined) setter('title', reminder.title);
  if (reminder.description !== undefined) setter('description', reminder.description);
  if (reminder.type !== undefined) setter('type', reminder.type);
  if (reminder.time !== undefined) setter('time', reminder.time);
  if (reminder.date !== undefined) setter('date', reminder.date);
  if (reminder.days !== undefined) setter('days', JSON.stringify(reminder.days));
  if (reminder.interval !== undefined) setter('interval', reminder.interval);
  if (reminder.enabled !== undefined) setter('enabled', reminder.enabled ? 1 : 0);
  if ((reminder as any).mandatory !== undefined) setter('mandatory', (reminder as any).mandatory ? 1 : 0);

  params.push(id);

  Database.db.run(
    `UPDATE reminders SET ${fields.join(', ')} WHERE id = ?`,
    params,
    function (this: RunResult, err) {
      if (err) {
        return res.status(400).json({ error: 'Failed to update reminder.' });
      }
      res.json({ message: 'Reminder updated successfully.' });
    }
  );
});

// Delete reminder
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  Database.db.run(`DELETE FROM reminders WHERE id = ?`, [id], function (this: RunResult, err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete reminder.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Reminder not found.' });
    }
    res.json({ message: 'Reminder deleted successfully.' });
  });
});

export default router;
// Record completion of a reminder action (water or medication)
router.post('/complete', (req, res) => {
  const raw = (req.body || {}) as any;
  const userId = Number(raw.user_id ?? raw.userId);
  const type = String(raw.type || '').toLowerCase();
  if (!userId || !type || (type !== 'water' && type !== 'medication')) {
    return res.status(400).json({ error: 'user_id and type (water|medication) are required.' });
  }

  Database.db.run(
    `INSERT INTO reminder_completions (user_id, type, completed_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
    [userId, type],
    function (this: RunResult, err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to record completion.' });
      }
      res.status(201).json({ id: Number(this.lastID || 0), success: true });
    }
  );
});

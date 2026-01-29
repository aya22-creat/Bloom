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
        enabled: r.enabled === 1,
        days: r.days ? JSON.parse(r.days) : undefined,
      }));
      res.json(parsed);
    }
  );
});

// Create reminder
router.post('/', (req, res) => {
  const reminder = req.body as Reminder;
  if (!reminder.user_id || !reminder.title) {
    return res.status(400).json({ error: 'user_id and title are required.' });
  }
  
  // Build reminder_time from time and date if provided
  let reminderTime = reminder.reminder_time || null;
  if (!reminderTime && reminder.time && reminder.date) {
    reminderTime = `${reminder.date} ${reminder.time}`;
  } else if (!reminderTime && reminder.time) {
    reminderTime = reminder.time;
  }
  
  Database.db.run(
    `INSERT INTO reminders (user_id, title, description, reminder_time)
     VALUES (?, ?, ?, ?)`,
    [
      reminder.user_id,
      reminder.title,
      reminder.description || null,
      reminderTime,
    ],
    function (this: RunResult, err) {
      if (err) {
        return res.status(400).json({ error: 'Failed to create reminder.' });
      }
      res.status(201).json({ id: this.lastID });
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

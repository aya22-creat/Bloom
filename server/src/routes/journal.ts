import { Router } from 'express';
import { Database, RunResult } from '../lib/database';

const router = Router();

// List journal entries by user
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  Database.db.all(
    `SELECT * FROM journal_entries WHERE user_id = ? ORDER BY entry_date DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch journal entries.' });
      }
      const parsed = rows.map((r: any) => ({
        ...r,
        tags: r.tags ? JSON.parse(r.tags) : []
      }));
      res.json(parsed);
    }
  );
});

// Get single journal entry
router.get('/:userId/:entryId', (req, res) => {
  const { userId, entryId } = req.params;
  Database.db.get(
    `SELECT * FROM journal_entries WHERE id = ? AND user_id = ?`,
    [entryId, userId],
    (err, row: any) => {
      if (err || !row) {
        return res.status(404).json({ error: 'Journal entry not found.' });
      }
      row.tags = row.tags ? JSON.parse(row.tags) : [];
      res.json(row);
    }
  );
});

// Create journal entry
router.post('/', (req, res) => {
  const { user_id, entry_text, mood, tags } = req.body;
  
  if (!user_id || !entry_text) {
    return res.status(400).json({ error: 'user_id and entry_text are required.' });
  }

  Database.db.run(
    `INSERT INTO journal_entries (user_id, entry_text, mood, tags)
     VALUES (?, ?, ?, ?)`,
    [user_id, entry_text, mood || null, tags ? JSON.stringify(tags) : null],
    function (this: RunResult, err) {
      if (err) {
        return res.status(400).json({ error: 'Failed to create journal entry.' });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Update journal entry
router.put('/:entryId', (req, res) => {
  const { entryId } = req.params;
  const { entry_text, mood, tags } = req.body;

  if (!entry_text) {
    return res.status(400).json({ error: 'entry_text is required.' });
  }

  Database.db.run(
    `UPDATE journal_entries SET entry_text = ?, mood = ?, tags = ? WHERE id = ?`,
    [entry_text, mood || null, tags ? JSON.stringify(tags) : null, entryId],
    function (this: RunResult, err) {
      if (err) {
        return res.status(400).json({ error: 'Failed to update journal entry.' });
      }
      res.json({ message: 'Journal entry updated successfully.' });
    }
  );
});

// Delete journal entry
router.delete('/:entryId', (req, res) => {
  const { entryId } = req.params;

  Database.db.run(
    `DELETE FROM journal_entries WHERE id = ?`,
    [entryId],
    function (this: RunResult, err) {
      if (err) {
        return res.status(400).json({ error: 'Failed to delete journal entry.' });
      }
      res.json({ message: 'Journal entry deleted successfully.' });
    }
  );
});

export default router;


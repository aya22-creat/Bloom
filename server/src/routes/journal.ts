import { Router } from 'express';
import { Database, RunResult } from '../lib/database';

const router = Router();

// List journal entries by user
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  Database.db.all(
    `SELECT * FROM journal WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch journal entries.' });
      }
      res.json(rows);
    }
  );
});

// Get single journal entry
router.get('/:userId/:entryId', (req, res) => {
  const { userId, entryId } = req.params;
  Database.db.get(
    `SELECT * FROM journal WHERE id = ? AND user_id = ?`,
    [entryId, userId],
    (err, row: any) => {
      if (err || !row) {
        return res.status(404).json({ error: 'Journal entry not found.' });
      }
      res.json(row);
    }
  );
});

// Create journal entry
router.post('/', (req, res) => {
  // Accept both entry_text and content for flexibility
  const { user_id, entry_text, content, mood, tags } = req.body;
  const entryContent = entry_text || content || '';
  
  if (!user_id || !entryContent) {
    return res.status(400).json({ error: 'user_id and entry_text/content are required.' });
  }

  Database.db.run(
    `INSERT INTO journal (user_id, title, content, mood)
     VALUES (?, ?, ?, ?)`,
    [user_id, 'Entry', entryContent, mood || null],
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
  const { entry_text, content, mood } = req.body;
  const entryContent = entry_text || content;

  if (!entryContent) {
    return res.status(400).json({ error: 'entry_text/content is required.' });
  }

  Database.db.run(
    `UPDATE journal SET content = ?, mood = ? WHERE id = ?`,
    [entryContent, mood || null, entryId],
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
    `DELETE FROM journal WHERE id = ?`,
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


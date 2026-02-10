import { Router, Request, Response, NextFunction } from 'express';
import { Database, RunResult } from '../lib/database';
import { Cycle } from '../types/cycle';

const router = Router();

// Validation middleware
const validateUserId = (req: Request, res: Response, next: NextFunction) => {
  const userId = parseInt(req.params.userId || req.body.user_id || req.body.userId);
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Valid user ID is required' 
    });
  }
  next();
};

const validateCycleData = (req: Request, res: Response, next: NextFunction) => {
  const user_id = req.body.user_id ?? req.body.userId;
  const start_date = req.body.start_date ?? req.body.startDate;
  
  if (!user_id || !start_date) {
    return res.status(400).json({ 
      success: false, 
      error: 'user_id and start_date are required' 
    });
  }
  
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}/.test(start_date)) {
    return res.status(400).json({ 
      success: false, 
      error: 'start_date must be in valid date format (YYYY-MM-DD)' 
    });
  }
  
  next();
};

const validateId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Valid cycle ID is required' 
    });
  }
  next();
};

router.get('/:userId', validateUserId, (req, res) => {
  const { userId } = req.params;
  
  try {
    Database.db.all(
      `SELECT * FROM cycles WHERE user_id = ? ORDER BY start_date DESC`,
      [userId],
      (err, rows) => {
        if (err) {
          console.error('[Cycles GET Error]', err);
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch cycles',
            details: err.message 
          });
        }
        res.json({ success: true, data: rows || [] });
      }
    );
  } catch (error: any) {
    console.error('[Cycles GET Exception]', error);
    res.status(500).json({ 
      success: false, 
      error: 'Unexpected error fetching cycles' 
    });
  }
});

router.post('/', validateCycleData, (req, res) => {
  const raw = req.body || {};
  const c: Cycle = {
    user_id: Number(raw.user_id ?? raw.userId),
    start_date: String(raw.start_date ?? raw.startDate),
    end_date: raw.end_date ?? raw.endDate ?? undefined,
    cycle_length: raw.cycle_length ?? raw.cycleLength ?? undefined,
    notes: raw.notes ?? undefined,
  };
  
  try {
    Database.db.run(
      `INSERT INTO cycles (user_id, start_date, end_date, cycle_length, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [c.user_id, c.start_date, c.end_date || null, c.cycle_length ?? null, c.notes || null],
      function (this: RunResult, err) {
        if (err) {
          console.error('[Cycles POST Error]', err);
          return res.status(400).json({ 
            success: false, 
            error: 'Failed to create cycle',
            details: err.message 
          });
        }
        const insertedId = Number(this?.lastID || 0);
        if (insertedId && insertedId > 0) {
          return res.status(201).json({ success: true, data: { id: insertedId }, message: 'Cycle created successfully' });
        }
        Database.db.get(
          `SELECT id FROM cycles WHERE user_id = ? ORDER BY start_date DESC`,
          [c.user_id],
          (e2, row: any) => {
            const id = e2 || !row?.id ? 0 : Number(row.id);
            return res.status(201).json({ success: true, data: { id }, message: 'Cycle created successfully' });
          }
        );
      }
    );
  } catch (error: any) {
    console.error('[Cycles POST Exception]', error);
    res.status(500).json({ 
      success: false, 
      error: 'Unexpected error creating cycle' 
    });
  }
});

router.put('/:id', validateId, (req, res) => {
  const { id } = req.params;
  const raw = req.body || {};
  const c: Partial<Cycle> = {
    start_date: raw.start_date ?? raw.startDate ?? undefined,
    end_date: raw.end_date ?? raw.endDate ?? undefined,
    cycle_length: raw.cycle_length ?? raw.cycleLength ?? undefined,
    notes: raw.notes ?? undefined,
  };
  
  const fields: string[] = [];
  const params: any[] = [];
  
  const setter = (k: string, v: any) => { 
    fields.push(`${k} = ?`); 
    params.push(v); 
  };
  
  if (c.start_date !== undefined) setter('start_date', c.start_date);
  if (c.end_date !== undefined) setter('end_date', c.end_date);
  if (c.cycle_length !== undefined) setter('cycle_length', c.cycle_length);
  if (c.notes !== undefined) setter('notes', c.notes);
  
  if (fields.length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'No fields to update' 
    });
  }
  
  params.push(id);
  
  try {
    Database.db.run(
      `UPDATE cycles SET ${fields.join(', ')} WHERE id = ?`,
      params,
      function (this: RunResult, err) {
        if (err) {
          console.error('[Cycles PUT Error]', err);
          return res.status(400).json({ 
            success: false, 
            error: 'Failed to update cycle',
            details: err.message 
          });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ 
            success: false, 
            error: 'Cycle not found' 
          });
        }
        
        if (c.end_date) {
          const end = new Date(String(c.end_date));
          if (!Number.isNaN(end.getTime())) {
            const next = new Date(end.getTime());
            next.setDate(next.getDate() + 1);
            const nextDay = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
            const time = '09:00';
            const title = '🩺 Self Breast Exam (Mandatory)';
            const description = 'Reminder: Please perform your self-breast examination today.';
            Database.db.all(
              `SELECT id FROM reminders WHERE user_id = (SELECT user_id FROM cycles WHERE id = ?) AND type = 'checkup' AND date = ? AND mandatory = 1`,
              [id, nextDay],
              (checkErr, rows) => {
                if (!checkErr && (!rows || rows.length === 0)) {
                  Database.db.run(
                    `INSERT INTO reminders (user_id, title, description, type, time, date, enabled, mandatory)
                     SELECT user_id, ?, ?, 'checkup', ?, ?, 1, 1 FROM cycles WHERE id = ?`,
                    [title, description, time, nextDay, id],
                    () => {}
                  );
                }
              }
            );
          }
        }

        res.json({ 
          success: true, 
          message: 'Cycle updated successfully' 
        });
      }
    );
  } catch (error: any) {
    console.error('[Cycles PUT Exception]', error);
    res.status(500).json({ 
      success: false, 
      error: 'Unexpected error updating cycle' 
    });
  }
});

router.delete('/:id', validateId, (req, res) => {
  const { id } = req.params;
  
  try {
    Database.db.run(
      `DELETE FROM cycles WHERE id = ?`, 
      [id], 
      function (this: RunResult, err) {
        if (err) {
          console.error('[Cycles DELETE Error]', err);
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to delete cycle',
            details: err.message 
          });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ 
            success: false, 
            error: 'Cycle not found' 
          });
        }
        
        res.json({ 
          success: true, 
          message: 'Cycle deleted successfully' 
        });
      }
    );
  } catch (error: any) {
    console.error('[Cycles DELETE Exception]', error);
    res.status(500).json({ 
      success: false, 
      error: 'Unexpected error deleting cycle' 
    });
  }
});

export default router;

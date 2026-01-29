import { Router, Request, Response, NextFunction } from 'express';
import { Database, RunResult } from '../lib/database';
import { Cycle } from '../types/cycle';

const router = Router();

// Validation middleware
const validateUserId = (req: Request, res: Response, next: NextFunction) => {
  const userId = parseInt(req.params.userId || req.body.user_id);
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Valid user ID is required' 
    });
  }
  next();
};

const validateCycleData = (req: Request, res: Response, next: NextFunction) => {
  const { user_id, start_date } = req.body;
  
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
  const c = req.body as Cycle;
  
  try {
    Database.db.run(
      `INSERT INTO cycles (user_id, start_date, end_date, notes)
       VALUES (?, ?, ?, ?)`,
      [c.user_id, c.start_date, c.end_date || null, c.notes || null],
      function (this: RunResult, err) {
        if (err) {
          console.error('[Cycles POST Error]', err);
          return res.status(400).json({ 
            success: false, 
            error: 'Failed to create cycle',
            details: err.message 
          });
        }
        res.status(201).json({ 
          success: true, 
          data: { id: this.lastID },
          message: 'Cycle created successfully' 
        });
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
  const c = req.body as Partial<Cycle>;
  
  const fields: string[] = [];
  const params: any[] = [];
  
  const setter = (k: string, v: any) => { 
    fields.push(`${k} = ?`); 
    params.push(v); 
  };
  
  if (c.start_date !== undefined) setter('start_date', c.start_date);
  if (c.end_date !== undefined) setter('end_date', c.end_date);
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

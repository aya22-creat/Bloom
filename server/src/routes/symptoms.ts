import { Router, Request, Response, NextFunction } from 'express';
import { Database, RunResult } from '../lib/database';
import { Symptom } from '../types/symptom';

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

const validateSymptomData = (req: Request, res: Response, next: NextFunction) => {
  const s = req.body as Symptom;
  const symptomName = s.description || (s as any).symptom_name || '';
  
  if (!s.user_id || !symptomName) {
    return res.status(400).json({ 
      success: false, 
      error: 'user_id and description/symptom_name are required' 
    });
  }
  
  // Validate severity if provided
  if (s.severity !== undefined) {
    const severity = parseInt(String(s.severity));
    if (isNaN(severity) || severity < 1 || severity > 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'severity must be between 1 and 10' 
      });
    }
  }
  
  next();
};

const validateId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Valid symptom ID is required' 
    });
  }
  next();
};

// List symptoms by user
router.get('/:userId', validateUserId, (req, res) => {
  const { userId } = req.params;
  
  try {
    Database.db.all(
      `SELECT * FROM symptoms WHERE user_id = ? ORDER BY logged_at DESC`,
      [userId],
      (err, rows) => {
        if (err) {
          console.error('[Symptoms GET Error]', err);
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch symptoms',
            details: err.message 
          });
        }
        res.json({ success: true, data: rows || [] });
      }
    );
  } catch (error: any) {
    console.error('[Symptoms GET Exception]', error);
    res.status(500).json({ 
      success: false, 
      error: 'Unexpected error fetching symptoms' 
    });
  }
});

// Create symptom
router.post('/', validateSymptomData, (req, res) => {
  const s = req.body as Symptom;
  const symptomName = s.description || (s as any).symptom_name || '';
  const severity = s.severity;
  
  try {
    Database.db.run(
      `INSERT INTO symptoms (user_id, symptom_name, severity, notes)
       VALUES (?, ?, ?, ?)`,
      [s.user_id, symptomName, severity || null, s.notes || null],
      function (this: RunResult, err) {
        if (err) {
          console.error('[Symptoms POST Error]', err);
          return res.status(400).json({ 
            success: false, 
            error: 'Failed to create symptom',
            details: err.message 
          });
        }
        res.status(201).json({ 
          success: true, 
          data: { id: this.lastID },
          message: 'Symptom created successfully' 
        });
      }
    );
  } catch (error: any) {
    console.error('[Symptoms POST Exception]', error);
    res.status(500).json({ 
      success: false, 
      error: 'Unexpected error creating symptom' 
    });
  }
});

// Update symptom
router.put('/:id', validateId, (req, res) => {
  const { id } = req.params;
  const s = req.body as Partial<Symptom>;
  const fields: string[] = [];
  const params: any[] = [];

  const setter = (key: string, val: any) => { fields.push(`${key} = ?`); params.push(val); };

  if (s.date !== undefined) setter('date', s.date);
  if (s.description !== undefined) setter('description', s.description);
  if (s.severity !== undefined) {
    const severity = parseInt(String(s.severity));
    if (isNaN(severity) || severity < 1 || severity > 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'severity must be between 1 and 10' 
      });
    }
    setter('severity', severity);
  }
  if (s.notes !== undefined) setter('notes', s.notes);
  
  if (fields.length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'No fields to update' 
    });
  }
  
  params.push(id);

  try {
    Database.db.run(
      `UPDATE symptoms SET ${fields.join(', ')} WHERE id = ?`,
      params,
      function (this: RunResult, err) {
        if (err) {
          console.error('[Symptoms PUT Error]', err);
          return res.status(400).json({ 
            success: false, 
            error: 'Failed to update symptom',
            details: err.message 
          });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ 
            success: false, 
            error: 'Symptom not found' 
          });
        }
        
        res.json({ 
          success: true, 
          message: 'Symptom updated successfully' 
        });
      }
    );
  } catch (error: any) {
    console.error('[Symptoms PUT Exception]', error);
    res.status(500).json({ 
      success: false, 
      error: 'Unexpected error updating symptom' 
    });
  }
});

// Delete symptom
router.delete('/:id', validateId, (req, res) => {
  const { id } = req.params;
  
  try {
    Database.db.run(`DELETE FROM symptoms WHERE id = ?`, [id], function (this: RunResult, err) {
      if (err) {
        console.error('[Symptoms DELETE Error]', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to delete symptom',
          details: err.message 
        });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Symptom not found' 
        });
      }
      
      res.json({ 
        success: true, 
        message: 'Symptom deleted successfully' 
      });
    });
  } catch (error: any) {
    console.error('[Symptoms DELETE Exception]', error);
    res.status(500).json({ 
      success: false, 
      error: 'Unexpected error deleting symptom' 
    });
  }
});

export default router;

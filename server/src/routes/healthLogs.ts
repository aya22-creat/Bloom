import { Router, Request, Response } from 'express';
import { Database } from '../lib/database';

const router = Router();

// Ensure table exists (Lazy Init for Pain Trends)
setTimeout(() => {
  const createTableQuery = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='health_logs' AND xtype='U')
    CREATE TABLE health_logs (
      id INT IDENTITY(1,1) PRIMARY KEY,
      user_id INT,
      type NVARCHAR(50), -- 'pain', 'mood', 'fatigue'
      value INT, -- 1-10
      notes NVARCHAR(MAX),
      created_at DATETIME DEFAULT GETDATE(),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try { 
    Database.db.run(createTableQuery, [], (err) => {
      if (!err) console.log('✅ Health Trends: Pain analysis database ready');
    }); 
  } catch (e) { console.error('Health Logs DB Init Error', e); }
}, 6000);

// POST: Add Log (Pain, Mood, etc.)
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 1; // Fallback to 1 for dev
    const { type, value, notes } = req.body;

    if (!type || value === undefined) {
      return res.status(400).json({ error: 'Type and value are required' });
    }

    const query = `INSERT INTO health_logs (user_id, type, value, notes) VALUES (?, ?, ?, ?)`;
    
    Database.db.run(query, [userId, type, value, notes || ''], function (this: any, err: Error | null) {
      if (err) {
        console.error('Add Log Error:', err);
        return res.status(500).json({ error: 'Failed to add log' });
      }
      res.json({ success: true, message: 'Health log recorded successfully' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET: Trends (Last 30 days) for Charting
router.get('/trends', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 1;
    const { type } = req.query;

    const query = `
      SELECT FORMAT(created_at, 'yyyy-MM-dd') as date, AVG(value) as value 
      FROM health_logs 
      WHERE user_id = ? AND type = ? 
      GROUP BY FORMAT(created_at, 'yyyy-MM-dd')
      ORDER BY date ASC
    `;
    
    Database.db.all(query, [userId, type || 'pain'], (err, rows) => {
      if (err) {
        console.error('Fetch Trends Error:', err);
        return res.status(500).json({ error: 'Failed to fetch trends' });
      }
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

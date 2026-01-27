import { Router } from 'express';
import { MenstrualApi } from '../services/menstrualApi';
import { Database } from '../lib/database';

const router = Router();

router.post('/predict', async (req, res) => {
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    // Fetch user cycles from DB
    Database.db.all(
      'SELECT start_date, end_date FROM cycles WHERE user_id = ? ORDER BY start_date ASC',
      [userId],
      async (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        if (!rows || rows.length < 1) {
          // If no history, we can't predict much, but maybe the API handles single dates.
          // Let's forward what we have if at least 1.
          return res.status(400).json({ error: 'No cycle history found. Please log at least one cycle.' });
        }

        try {
          // Call RapidAPI
          const prediction = await MenstrualApi.predict(rows);
          res.json(prediction);
        } catch (apiError: any) {
          res.status(502).json({ error: apiError.message });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

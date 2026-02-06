import { Router } from 'express';
import { Database } from '../lib/database';

const router = Router();

router.get('/doctor/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const query = (sql: string, params: any[]): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        Database.db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };

    const [user, profile, symptoms, medications, selfExams, healthLogs] = await Promise.all([
      query('SELECT username, email FROM users WHERE id = ?', [userId]),
      query('SELECT * FROM user_profiles WHERE user_id = ?', [userId]),
      query('SELECT * FROM symptoms WHERE user_id = ? ORDER BY logged_at DESC', [userId]),
      query('SELECT * FROM medications WHERE user_id = ?', [userId]),
      query('SELECT * FROM self_exams WHERE user_id = ? ORDER BY exam_date DESC', [userId]),
      query('SELECT * FROM health_logs WHERE user_id = ? ORDER BY created_at DESC', [userId])
    ]);

    res.json({
      user: user[0] || {},
      profile: profile[0] || {},
      symptoms,
      medications,
      selfExams,
      healthLogs
    });

  } catch (error) {
    console.error('Error generating report data:', error);
    res.status(500).json({ error: 'Failed to fetch report data' });
  }
});

export default router;

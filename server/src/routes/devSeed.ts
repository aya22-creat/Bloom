import { Router, Request, Response } from 'express';
import { Database } from '../lib/database';
import bcrypt from 'bcryptjs';

const router = Router();

const run = (sql: string, params: any[] = []) =>
  new Promise<void>((resolve, reject) => {
    Database.db.run(sql, params, (err) => (err ? reject(err) : resolve()));
  });

const all = (sql: string, params: any[] = []) =>
  new Promise<any[]>((resolve, reject) => {
    Database.db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });

async function seedUser(userId: number) {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().split('T')[0];

  await run(
    `INSERT OR IGNORE INTO user_profiles (user_id, first_name, last_name, date_of_birth, gender, country)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, 'Test', 'Patient', '1990-01-01', 'female', 'EG']
  );

  await run(`INSERT INTO self_exams (user_id, exam_date, findings, notes) VALUES (?, ?, ?, ?)`, [
    userId,
    iso(new Date(today.getTime() - 14 * 86400000)),
    'لا كتل واضحة',
    'تمت المتابعة المنزلية',
  ]);

  await run(`INSERT INTO self_exams (user_id, exam_date, findings, notes) VALUES (?, ?, ?, ?)`, [
    userId,
    iso(new Date(today.getTime() - 1 * 86400000)),
    'حساسية بسيطة حول الحلمة',
    'يوصى بمتابعة بعد أسبوع',
  ]);

  await run(`INSERT INTO health_logs (user_id, type, value, notes) VALUES (?, ?, ?, ?)`, [
    userId,
    'pain',
    4,
    'ألم خفيف مساءً',
  ]);
  await run(`INSERT INTO health_logs (user_id, type, value, notes) VALUES (?, ?, ?, ?)`, [
    userId,
    'fatigue',
    6,
    'إرهاق متوسط بعد التمارين',
  ]);

  await run(`INSERT INTO symptoms (user_id, symptom_name, severity, notes) VALUES (?, ?, ?, ?)`, [
    userId,
    'تورم بسيط في الإبط',
    5,
    'يحتاج متابعة أسبوعية',
  ]);

  await run(
    `INSERT INTO medications (user_id, name, dosage, frequency, type, start_date, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, 'Tamoxifen', '20mg', 'daily', 'oncology', iso(today), 'التزام يومي']
  );

  await run(
    `INSERT INTO reminders (user_id, title, description, type, time, date, enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, 'شرب الماء', 'تذكير صباحي', 'water', '09:00', iso(today), 1]
  );
  await run(
    `INSERT INTO reminders (user_id, title, description, type, time, date, enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, 'دواء تموكسيفين', '20mg بعد الفطار', 'medication', '08:30', iso(today), 1]
  );

  await run(
    `INSERT INTO medical_reports (user_id, file_name, mime_type, size_kb, file_path, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, 'cbc_report.pdf', 'application/pdf', 12, 'uploads/sample_cbc.pdf', 'فحص صورة دم كاملة']
  );
}

router.post('/seed', async (req: Request, res: Response) => {
  try {
    if (String(process.env.DEV_SEED_ENABLED || 'true').toLowerCase() !== 'true') {
      return res.status(403).json({ success: false, error: 'Seeding disabled' });
    }

    const userId = Number((req.body as any)?.user_id ?? (req.body as any)?.userId);
    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const user = (await all('SELECT id, username, email FROM users WHERE id = ?', [userId]))[0];
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    await seedUser(userId);

    res.json({ success: true, message: 'Seeded medical data', userId });
  } catch (e: any) {
    console.error('[DevSeed Error]', e);
    res.status(500).json({ success: false, error: e?.message || 'Failed to seed data' });
  }
});

router.post('/seed-by-email', async (req: Request, res: Response) => {
  try {
    const email = String((req.body as any)?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, error: 'email is required' });
    const user = (await all('SELECT id, username, email FROM users WHERE LOWER(email) = ?', [email]))[0];
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    await seedUser(Number(user.id));
    res.json({ success: true, message: 'Seeded medical data', userId: Number(user.id) });
  } catch (e: any) {
    console.error('[DevSeedByEmail Error]', e);
    res.status(500).json({ success: false, error: e?.message || 'Failed to seed by email' });
  }
});

// Reset password by email (DEV ONLY)
router.post('/reset-password-by-email', async (req: Request, res: Response) => {
  try {
    const allow = String(process.env.DEV_SEED_ENABLED || 'true').toLowerCase() === 'true';
    if (!allow) return res.status(403).json({ success: false, error: 'Disabled' });
    const email = String((req.body as any)?.email || '').trim().toLowerCase();
    const newPassword = String((req.body as any)?.password || '').trim();
    if (!email || !newPassword) return res.status(400).json({ success: false, error: 'email and password required' });
    const user = (await all('SELECT id FROM users WHERE LOWER(email) = ?', [email]))[0];
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await run('UPDATE users SET password = ? WHERE id = ?', [hashed, Number(user.id)]);
    res.json({ success: true, message: 'Password updated', userId: Number(user.id) });
  } catch (e: any) {
    console.error('[ResetPassword Error]', e);
    res.status(500).json({ success: false, error: e?.message || 'Failed to reset password' });
  }
});

export default router;

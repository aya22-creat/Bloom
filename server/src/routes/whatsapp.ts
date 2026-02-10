import { Router } from 'express';
import { Database } from '../lib/database';
import { sendWhatsAppText } from '../services/whatsapp.service';

const router = Router();

router.post('/send', async (req, res) => {
  const allow =
    process.env.NODE_ENV !== 'production' ||
    (process.env.WHATSAPP_ALLOW_TEST_ENDPOINT || '').toLowerCase() === 'true';

  if (!allow) {
    return res.status(404).json({ error: 'Not found' });
  }

  const to = String(req.body?.to || '').trim();
  const body = String(req.body?.body || '').trim();

  if (!to || !body) {
    return res.status(400).json({ error: 'to and body are required' });
  }

  const result = await sendWhatsAppText({ to, body });
  if (!result.ok) {
    return res.status(400).json({ ok: false, error: result.error });
  }
  return res.json({ ok: true, providerMessageId: result.providerMessageId || null });
});

router.get('/logs', (req, res) => {
  const allow =
    process.env.NODE_ENV !== 'production' ||
    (process.env.WHATSAPP_ALLOW_TEST_ENDPOINT || '').toLowerCase() === 'true';

  if (!allow) {
    return res.status(404).json({ error: 'Not found' });
  }

  const userId = req.query.userId ? Number(req.query.userId) : null;
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

  const where = userId ? 'WHERE user_id = ?' : '';
  const params = userId ? [userId] : [];

  Database.db.all(
    `SELECT * FROM whatsapp_message_logs ${where} ORDER BY created_at DESC`,
    params,
    (err, rows: any[]) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch logs' });
      }
      return res.json({ logs: (rows || []).slice(0, limit) });
    }
  );
});

export default router;

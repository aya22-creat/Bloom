import { Router } from 'express';
import { Database } from '../lib/database';
import { sendWhatsAppText } from '../services/whatsapp.service';
import { dispatchDueReminders } from '../lib/scheduler';

const router = Router();

router.post('/send', async (req, res) => {
  const enabled = (String(process.env.WHATSAPP_ENABLED || 'true').toLowerCase() === 'true');
  const allow =
    enabled && (
      process.env.NODE_ENV !== 'production' ||
      (process.env.WHATSAPP_ALLOW_TEST_ENDPOINT || '').toLowerCase() === 'true'
    );

  if (!allow) {
    return res.status(404).json({ error: 'Not found' });
  }

  const to = String(req.body?.to || '').trim();
  const body = String(req.body?.body || '').trim();
  const contentSid = req.body?.contentSid ? String(req.body.contentSid).trim() : undefined;
  const contentVariables = req.body?.contentVariables ?? undefined;

  if (!to || (!body && !contentSid)) {
    return res.status(400).json({ error: 'to and body or contentSid are required' });
  }

  const result = await sendWhatsAppText({ to, body, contentSid, contentVariables });
  if (!result.ok) {
    return res.status(400).json({ ok: false, error: result.error });
  }
  return res.json({ ok: true, providerMessageId: result.providerMessageId || null });
});

router.get('/logs', (req, res) => {
  const enabled = (String(process.env.WHATSAPP_ENABLED || 'true').toLowerCase() === 'true');
  const allow =
    enabled && (
      process.env.NODE_ENV !== 'production' ||
      (process.env.WHATSAPP_ALLOW_TEST_ENDPOINT || '').toLowerCase() === 'true'
    );

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

router.get('/send-test', async (req, res) => {
  const enabled = (String(process.env.WHATSAPP_ENABLED || 'true').toLowerCase() === 'true');
  const allow =
    enabled && (
      process.env.NODE_ENV !== 'production' ||
      (process.env.WHATSAPP_ALLOW_TEST_ENDPOINT || '').toLowerCase() === 'true'
    );

  if (!allow) {
    return res.status(404).json({ error: 'Not found' });
  }

  const to = String(req.query.to || '').trim();
  const body = String(req.query.body || '').trim();
  const contentSid = req.query.contentSid ? String(req.query.contentSid).trim() : undefined;
  const contentVariablesRaw = req.query.contentVariables ? String(req.query.contentVariables) : undefined;
  let contentVariables: any = undefined;
  if (contentVariablesRaw) {
    try { contentVariables = JSON.parse(contentVariablesRaw); } catch { contentVariables = contentVariablesRaw; }
  }

  if (!to || (!body && !contentSid)) {
    return res.status(400).json({ error: 'to and body or contentSid are required' });
  }

  const result = await sendWhatsAppText({ to, body, contentSid, contentVariables });
  if (!result.ok) {
    return res.status(400).json({ ok: false, error: result.error });
  }
  return res.json({ ok: true, providerMessageId: result.providerMessageId || null });
});

router.post('/dispatch-now', async (req, res) => {
  const enabled = (String(process.env.WHATSAPP_ENABLED || 'true').toLowerCase() === 'true');
  const allow =
    enabled && (
      process.env.NODE_ENV !== 'production' ||
      (process.env.WHATSAPP_ALLOW_TEST_ENDPOINT || '').toLowerCase() === 'true'
    );
  if (!allow) {
    return res.status(404).json({ error: 'Not found' });
  }
  await dispatchDueReminders();
  return res.json({ ok: true });
});

export default router;

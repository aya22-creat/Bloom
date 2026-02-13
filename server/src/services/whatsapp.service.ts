import { Database, RunResult } from '../lib/database';

type WhatsAppSendResult =
  | { ok: true; providerMessageId?: string }
  | { ok: false; error: string };

const getWhatsAppConfig = () => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v20.0';
  const n8nWebhook = process.env.N8N_WHATSAPP_WEBHOOK_URL || '';
  return { accessToken, phoneNumberId, apiVersion, n8nWebhook };
};

const normalizePhone = (input: string) => {
  const cc = (process.env.DEFAULT_COUNTRY_CODE || '').replace(/[^\d]/g, '');
  const raw = String(input || '').trim();
  if (!raw) return '';
  if (raw.startsWith('+')) {
    const d = raw.replace(/[^\d]/g, '');
    return `+${d}`;
  }
  const d = raw.replace(/[^\d]/g, '');
  if (cc && d.startsWith('0')) {
    return `+${cc}${d.slice(1)}`;
  }
  if (cc && d.length <= 11) {
    return `+${cc}${d}`;
  }
  return `+${d}`;
};

const postLog = (data: {
  userId?: number | null;
  reminderId?: number | null;
  toPhone: string;
  status: string;
  error?: string | null;
  providerMessageId?: string | null;
}) =>
  new Promise<void>((resolve) => {
    Database.db.run(
      `INSERT INTO whatsapp_message_logs (user_id, reminder_id, to_phone, status, error, provider_message_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.userId ?? null,
        data.reminderId ?? null,
        data.toPhone,
        data.status,
        data.error ?? null,
        data.providerMessageId ?? null,
      ],
      () => resolve()
    );
  });

export async function sendWhatsAppText(params: {
  to: string;
  body: string;
  userId?: number;
  reminderId?: number;
  contentSid?: string;
  contentVariables?: Record<string, any> | string;
}): Promise<WhatsAppSendResult> {
  const provider = String(process.env.WHATSAPP_PROVIDER || '').toLowerCase();
  const { accessToken, phoneNumberId, apiVersion, n8nWebhook } = getWhatsAppConfig();
  const autoMock =
    (process.env.NODE_ENV !== 'production') &&
    !provider &&
    !n8nWebhook &&
    !process.env.WHATSAPP_ACCESS_TOKEN &&
    !process.env.TWILIO_ACCOUNT_SID;

  const sendViaN8n = async (): Promise<WhatsAppSendResult> => {
    if (!n8nWebhook) {
      await postLog({
        userId: params.userId ?? null,
        reminderId: params.reminderId ?? null,
        toPhone: params.to,
        status: 'not_configured',
        error: 'N8N_WHATSAPP_WEBHOOK_URL is missing.',
      });
      return { ok: false, error: 'WhatsApp is not configured.' };
    }
    try {
      const res = await fetch(n8nWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: params.to,
          body: params.body,
          userId: params.userId ?? null,
          reminderId: params.reminderId ?? null,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        await postLog({
          userId: params.userId ?? null,
          reminderId: params.reminderId ?? null,
          toPhone: params.to,
          status: 'n8n_failed',
          error: text || `HTTP ${res.status}`,
        });
        return { ok: false, error: text || `HTTP ${res.status}` };
      }
      const json: any = await res.json().catch(() => ({}));
      await postLog({
        userId: params.userId ?? null,
        reminderId: params.reminderId ?? null,
        toPhone: params.to,
        status: 'n8n_sent',
        providerMessageId: json?.id || null,
      });
      return { ok: true, providerMessageId: json?.id };
    } catch (e: any) {
      const errMsg = typeof e?.message === 'string' ? e.message : 'Unknown error';
      await postLog({
        userId: params.userId ?? null,
        reminderId: params.reminderId ?? null,
        toPhone: params.to,
        status: 'n8n_failed',
        error: errMsg,
      });
      return { ok: false, error: errMsg };
    }
  };
  if (provider === 'mock' || autoMock) {
    const mockId = `mock-${Date.now()}`;
    await postLog({
      userId: params.userId ?? null,
      reminderId: params.reminderId ?? null,
      toPhone: params.to,
      status: 'mock_sent',
      providerMessageId: mockId,
    });
    return { ok: true, providerMessageId: mockId };
  }
  if (provider === 'n8n' || provider === 'webhook') {
    return sendViaN8n();
  }
  if (provider === 'twilio') {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    const authToken = process.env.TWILIO_AUTH_TOKEN || '';
    const apiKeySid = process.env.TWILIO_API_KEY_SID || '';
    const apiKeySecret = process.env.TWILIO_API_KEY_SECRET || '';
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM || '';
    const hasAuthToken = Boolean(authToken);
    const hasApiKey = Boolean(apiKeySid && apiKeySecret);
    if (!accountSid || !fromNumber || (!hasAuthToken && !hasApiKey)) {
      if (n8nWebhook) {
        return sendViaN8n();
      }
      await postLog({
        userId: params.userId ?? null,
        reminderId: params.reminderId ?? null,
        toPhone: params.to,
        status: 'not_configured',
        error: 'Twilio WhatsApp is not configured.',
      });
      return { ok: false, error: 'Twilio WhatsApp is not configured.' };
    }

    const toE164 = normalizePhone(params.to);
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const basicUser = hasApiKey ? apiKeySid : accountSid;
    const basicPass = hasApiKey ? apiKeySecret : authToken;
    const headers = {
      Authorization: 'Basic ' + Buffer.from(`${basicUser}:${basicPass}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    const bodyParams = new URLSearchParams();
    bodyParams.append('To', `whatsapp:${toE164}`);
    bodyParams.append('From', fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`);
    if (params.contentSid) {
      bodyParams.append('ContentSid', params.contentSid);
      if (params.contentVariables) {
        const v = typeof params.contentVariables === 'string' ? params.contentVariables : JSON.stringify(params.contentVariables);
        bodyParams.append('ContentVariables', v);
      }
    } else {
      bodyParams.append('Body', params.body);
    }
    try {
      const res = await fetch(url, { method: 'POST', headers, body: bodyParams.toString() });
      const json: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = json?.message || `HTTP ${res.status}`;
        await postLog({ userId: params.userId ?? null, reminderId: params.reminderId ?? null, toPhone: params.to, status: 'twilio_failed', error: errMsg });
        return { ok: false, error: errMsg };
      }
      const providerMessageId = json?.sid || null;
      await postLog({ userId: params.userId ?? null, reminderId: params.reminderId ?? null, toPhone: params.to, status: 'twilio_sent', providerMessageId });
      return { ok: true, providerMessageId: providerMessageId || undefined };
    } catch (e: any) {
      const errMsg = typeof e?.message === 'string' ? e.message : 'Unknown error';
      await postLog({ userId: params.userId ?? null, reminderId: params.reminderId ?? null, toPhone: params.to, status: 'twilio_failed', error: errMsg });
      return { ok: false, error: errMsg };
    }
  }
  if (!accessToken || !phoneNumberId) {
    if (n8nWebhook) return sendViaN8n();
    await postLog({ userId: params.userId ?? null, reminderId: params.reminderId ?? null, toPhone: params.to, status: 'not_configured', error: 'WhatsApp is not configured (missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID).' });
    return { ok: false, error: 'WhatsApp is not configured.' };
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  const toE164 = normalizePhone(params.to);
  const toDigits = toE164.replace(/[^\d]/g, '');
  const payload = { messaging_product: 'whatsapp', to: toDigits, type: 'text', text: { body: params.body } } as any;
  try {
    const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = json?.error?.message || `HTTP ${res.status}`;
      await postLog({ userId: params.userId ?? null, reminderId: params.reminderId ?? null, toPhone: params.to, status: 'failed', error: errMsg });
      return { ok: false, error: errMsg };
    }
    const providerMessageId = json?.messages?.[0]?.id;
    await postLog({ userId: params.userId ?? null, reminderId: params.reminderId ?? null, toPhone: params.to, status: 'sent', providerMessageId: providerMessageId || null });
    return { ok: true, providerMessageId };
  } catch (e: any) {
    const errMsg = typeof e?.message === 'string' ? e.message : 'Unknown error';
    if (n8nWebhook) return sendViaN8n();
    await postLog({ userId: params.userId ?? null, reminderId: params.reminderId ?? null, toPhone: params.to, status: 'failed', error: errMsg });
    return { ok: false, error: errMsg };
  }
}

export async function markReminderWhatsAppAttempt(params: {
  reminderId: number;
  success: boolean;
  error?: string | null;
}) {
  const nowIso = new Date().toISOString();

  return new Promise<void>((resolve) => {
    Database.db.run(
      `UPDATE reminders
       SET whatsapp_last_attempt_at = ?,
           whatsapp_attempts = COALESCE(whatsapp_attempts, 0) + 1,
           whatsapp_sent = ?,
           whatsapp_sent_at = ?,
           whatsapp_error = ?
       WHERE id = ?`,
      [
        nowIso,
        params.success ? 1 : 0,
        params.success ? nowIso : null,
        params.success ? null : params.error || 'Failed',
        params.reminderId,
      ],
      () => resolve()
    );
  });
}

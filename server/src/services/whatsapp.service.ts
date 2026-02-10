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
}): Promise<WhatsAppSendResult> {
  const { accessToken, phoneNumberId, apiVersion, n8nWebhook } = getWhatsAppConfig();
  if (!accessToken || !phoneNumberId) {
    // Try n8n fallback if configured
    if (n8nWebhook) {
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
    }
    await postLog({
      userId: params.userId ?? null,
      reminderId: params.reminderId ?? null,
      toPhone: params.to,
      status: 'not_configured',
      error: 'WhatsApp is not configured (missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID).',
    });
    return { ok: false, error: 'WhatsApp is not configured.' };
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  const toDigits = params.to.replace(/[^\d]/g, '');
  const payload = {
    messaging_product: 'whatsapp',
    to: toDigits,
    type: 'text',
    text: { body: params.body },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = json?.error?.message || `HTTP ${res.status}`;
      await postLog({
        userId: params.userId ?? null,
        reminderId: params.reminderId ?? null,
        toPhone: params.to,
        status: 'failed',
        error: errMsg,
      });
      return { ok: false, error: errMsg };
    }

    const providerMessageId = json?.messages?.[0]?.id;
    await postLog({
      userId: params.userId ?? null,
      reminderId: params.reminderId ?? null,
      toPhone: params.to,
      status: 'sent',
      providerMessageId: providerMessageId || null,
    });
    return { ok: true, providerMessageId };
  } catch (e: any) {
    const errMsg = typeof e?.message === 'string' ? e.message : 'Unknown error';
    // Try n8n fallback if configured
    if (n8nWebhook) {
      try {
        const res = await fetch(n8nWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: params.to, body: params.body, userId: params.userId ?? null, reminderId: params.reminderId ?? null }),
        });
        if (res.ok) {
          const json: any = await res.json().catch(() => ({}));
          await postLog({ userId: params.userId ?? null, reminderId: params.reminderId ?? null, toPhone: params.to, status: 'n8n_sent', providerMessageId: json?.id || null });
          return { ok: true, providerMessageId: json?.id };
        }
      } catch {}
    }
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

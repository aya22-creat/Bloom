function normalizeToWhatsApp(to) {
  const t = String(to || '').trim();
  if (!t) return '';
  return t.startsWith('whatsapp:') ? t : `whatsapp:${t}`;
}

async function main() {
  const [toRaw, ...messageParts] = process.argv.slice(2);
  const message = messageParts.join(' ').trim();

  const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || '';
  const authToken = process.env.TWILIO_AUTH_TOKEN || '';
  const apiKeySid = process.env.TWILIO_API_KEY_SID || '';
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET || '';

  const hasAuthToken = Boolean(authToken);
  const hasApiKey = Boolean(apiKeySid && apiKeySecret);

  if (!accountSid || !fromNumber || (!hasAuthToken && !hasApiKey)) {
    process.exitCode = 1;
    console.error('Twilio credentials are missing. Set TWILIO_AUTH_TOKEN or TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET, plus TWILIO_ACCOUNT_SID and TWILIO_WHATSAPP_FROM.');
    return;
  }

  const to = normalizeToWhatsApp(toRaw);
  if (!to || !message) {
    process.exitCode = 1;
    console.error('Usage: node server/scripts/manual-whatsapp-send.js <TO_E164> <MESSAGE>');
    console.error('Example: node server/scripts/manual-whatsapp-send.js +201001234567 Hello from Bloom');
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const basicUser = hasApiKey ? apiKeySid : accountSid;
  const basicPass = hasApiKey ? apiKeySecret : authToken;
  const auth = Buffer.from(`${basicUser}:${basicPass}`).toString('base64');

  const body = new URLSearchParams();
  body.append('To', to);
  body.append('From', fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`);
  body.append('Body', message);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    process.exitCode = 1;
  }
  console.log(JSON.stringify({ status: response.status, ...data }, null, 2));
}

main().catch((err) => {
  process.exitCode = 1;
  console.error(err);
});

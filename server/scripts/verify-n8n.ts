import express from 'express';
import { Database } from '../src/lib/database.ts';
import { sendWhatsAppText } from '../src/services/whatsapp.service.ts';

async function main() {
  const serveOnly = process.argv.includes('--serve');

  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.post('/webhook', (req, res) => {
    res.json({ id: 'n8n-test-1', received: req.body });
  });

  const server = app.listen(5555, async () => {
    if (serveOnly) {
      console.log('n8n stub listening on http://localhost:5555/webhook');
      return;
    }

    process.env.WHATSAPP_PROVIDER = 'n8n';
    process.env.N8N_WHATSAPP_WEBHOOK_URL = 'http://localhost:5555/webhook';
    process.env.DB_TYPE = 'sqlite';

    await Database.init();
    const result = await sendWhatsAppText({
      to: '01007768565',
      body: 'رسالة_اختبار_من_Bloom_via_n8n',
    });
    console.log(JSON.stringify(result));
    server.close();
  });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

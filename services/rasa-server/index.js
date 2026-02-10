const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

function generate(text) {
  const lower = String(text || '').toLowerCase();
  if (!lower) return 'I am here to help. Could you share more?';
  if (lower.includes('pain') || lower.includes('ألم')) {
    return 'I am sorry you are in pain. Please rest and, if severe, contact a healthcare professional.';
  }
  if (lower.includes('breath') || lower.includes('تنفس')) {
    return 'Shortness of breath can be serious. If worsening, seek urgent medical care.';
  }
  return 'Thank you for sharing. I am here to support you with guidance and encouragement.';
}

app.post('/webhooks/rest/webhook', (req, res) => {
  const msg = req.body?.message || '';
  const reply = generate(msg);
  res.json([{ text: reply }]);
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => {
  res.status(200).send(`
    <html>
      <head><title>Rasa REST Shim</title></head>
      <body style="font-family: sans-serif; padding: 1rem;">
        <h2>Rasa REST Shim</h2>
        <p>This service is an API, not a website.</p>
        <p>Use <code>POST /webhooks/rest/webhook</code> with JSON:</p>
        <pre>{"message":"Hello"}</pre>
        <p>Health: <a href="/health">/health</a></p>
      </body>
    </html>
  `);
});

const port = process.env.PORT || 5005;
app.listen(port, () => console.log(`Rasa REST shim listening on http://localhost:${port}`));

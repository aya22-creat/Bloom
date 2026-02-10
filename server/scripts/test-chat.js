const http = require('http');

const token = process.argv[2];
if (!token) {
  console.error('Usage: node scripts/test-chat.js <JWT_TOKEN>');
  process.exit(1);
}

const data = JSON.stringify({
  message: 'Chest pain and shortness of breath',
  module: 'breast_cancer',
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    Authorization: `Bearer ${token}`,
  },
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log(res.statusCode, body);
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
});

req.write(data);
req.end();


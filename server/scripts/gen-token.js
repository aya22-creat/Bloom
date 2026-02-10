const jwt = require('jsonwebtoken');
const payload = {
  userId: 1,
  email: 'test@example.com',
  role: 'patient',
  language: 'en',
  approved: true,
};
const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const token = jwt.sign(payload, secret, { expiresIn: '1h' });
console.log(token);


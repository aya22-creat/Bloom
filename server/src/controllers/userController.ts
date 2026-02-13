import { Request, Response } from 'express';
import { Database, RunResult } from '../lib/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

const generateToken = (userId: number, email: string): string =>
  jwt.sign({ id: userId, email, type: 'access' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

// Promise helpers around the sqlite wrapper
const getUserByIdentifierDb = (identifier: string): Promise<any | null> =>
  new Promise((resolve, reject) => {
    Database.db.get(`SELECT * FROM users WHERE email = ? OR username = ?`, [identifier, identifier], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });

const insertUser = (
  username: string,
  email: string,
  hashedPassword: string,
  phone: string | null,
  userType: string,
  language: string
): Promise<number> =>
  new Promise((resolve, reject) => {
    Database.db.run(
      `INSERT INTO users (username, email, password, phone, user_type, language) VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, phone, userType, language],
      function (this: RunResult, err) {
        if (err) return reject(err);
        const insertedId = Number(this?.lastID || 0);
        if (insertedId && insertedId > 0) {
          resolve(insertedId);
          return;
        }
        Database.db.get(`SELECT id FROM users WHERE email = ?`, [email], (e2, row) => {
          if (e2 || !row?.id) return reject(e2 || new Error('Failed to fetch inserted user id'));
          resolve(Number(row.id));
        });
      }
    );
  });

const normalizePhone = (input: unknown): string | null => {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  const cleaned = raw.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1).replace(/\D/g, '');
    if (digits.length < 8) return null;
    return `+${digits}`;
  }

  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length < 8) return null;

  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return `+20${digitsOnly.slice(1)}`;
  }
  if (digitsOnly.startsWith('20') && digitsOnly.length >= 10) {
    return `+${digitsOnly}`;
  }

  return `+${digitsOnly}`;
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password, userType, language, phone } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, and password are required.' });
    }

    const existingEmail = await getUserByIdentifierDb(email);
    if (existingEmail && existingEmail.email === email) {
      return res.status(409).json({ error: 'Email is already registered.' });
    }
    const existingUsername = await getUserByIdentifierDb(username);
    if (existingUsername && existingUsername.username === username) {
      return res.status(409).json({ error: 'Username is already taken.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedUserType = userType || 'wellness';
    const normalizedLanguage = language || 'en';
    const normalizedPhone = normalizePhone(phone);

    const newUserId = await insertUser(
      username,
      email,
      hashedPassword,
      normalizedPhone,
      normalizedUserType,
      normalizedLanguage
    );

    const token = generateToken(newUserId, email);

    return res.status(201).json({
      id: newUserId,
      username,
      email,
      phone: normalizedPhone,
      userType: normalizedUserType,
      language: normalizedLanguage,
      token,
    });
  } catch (error: any) {
    // Handle unique constraint violations defensively
    if (typeof error?.message === 'string' && error.message.includes('UNIQUE constraint failed')) {
      const msg = error.message.includes('users.username')
        ? 'Username is already taken.'
        : 'Email is already registered.';
      return res.status(409).json({ error: msg });
    }

    console.error('Error registering user:', error);
    return res.status(500).json({ error: 'Failed to create user.' });
  }
};

export const getUserByEmail = (req: Request, res: Response) => {
  const { email } = req.params;
  Database.db.get(
    `SELECT id, username, email, phone, user_type, language, created_at FROM users WHERE email = ?`,
    [email],
    (err, row) => {
      if (err || !row) {
        return res.status(404).json({ error: 'User not found.' });
      }
      res.json(row);
    }
  );
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Strict validation - password must exist and not be empty
    if (!email || !password || typeof password !== 'string' || password.trim().length === 0) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await getUserByIdentifierDb(email);
    if (!user) {
      // Use same error message for security (don't reveal if email exists)
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Ensure user has a password set
    if (!user.password || typeof user.password !== 'string') {
      return res.status(500).json({ error: 'Account configuration error. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken(user.id, user.email);

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone || null,
      userType: user.user_type || 'wellness',
      language: user.language || 'en',
      token,
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    return res.status(500).json({ error: 'Failed to login user.' });
  }
};

export const getAllUsers = (req: Request, res: Response) => {
  Database.db.all(
    `SELECT id, username, email, phone, user_type, language, created_at FROM users`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch users.' });
      }
      res.json(rows);
    }
  );
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, email, password, phone } = req.body;
  if (!username && !email && !password && phone === undefined) {
    return res.status(400).json({ error: 'At least one field is required to update.' });
  }

  let hashedPassword;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  const fields = [];
  const params = [];
  if (username) {
    fields.push('username = ?');
    params.push(username);
  }
  if (email) {
    fields.push('email = ?');
    params.push(email);
  }
  if (hashedPassword) {
    fields.push('password = ?');
    params.push(hashedPassword);
  }
  if (phone !== undefined) {
    fields.push('phone = ?');
    params.push(normalizePhone(phone));
  }
  params.push(id);

  Database.db.run(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    params,
    function (err) {
      if (err) {
        return res.status(400).json({ error: 'Failed to update user.' });
      }
      res.json({ message: 'User updated successfully.' });
    }
  );
};

export const deleteUser = (req: Request, res: Response) => {
  const { id } = req.params;
  Database.db.run(`DELETE FROM users WHERE id = ?`, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete user.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ message: 'User deleted successfully.' });
  });
};

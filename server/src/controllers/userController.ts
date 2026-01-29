import { Request, Response } from 'express';
import { Database, RunResult } from '../lib/database';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

const generateToken = (userId: number, email: string): string =>
  sign({ id: userId, email, type: 'access' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

// Promise helpers around the sqlite wrapper
const getUserByEmailDb = (email: string): Promise<any | null> =>
  new Promise((resolve, reject) => {
    Database.db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });

const insertUser = (
  username: string,
  email: string,
  hashedPassword: string,
  userType: string,
  language: string
): Promise<number> =>
  new Promise((resolve, reject) => {
    Database.db.run(
      `INSERT INTO users (username, email, password, user_type, language) VALUES (?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, userType, language],
      function (this: RunResult, err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password, userType, language } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, and password are required.' });
    }

    // Ensure the email is unique before creating the account
    const existing = await getUserByEmailDb(email);
    if (existing) {
      return res.status(409).json({ error: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedUserType = userType || 'wellness';
    const normalizedLanguage = language || 'en';

    const newUserId = await insertUser(
      username,
      email,
      hashedPassword,
      normalizedUserType,
      normalizedLanguage
    );

    const token = generateToken(newUserId, email);

    return res.status(201).json({
      id: newUserId,
      username,
      email,
      userType: normalizedUserType,
      language: normalizedLanguage,
      token,
    });
  } catch (error: any) {
    // Handle unique constraint violations defensively
    if (typeof error?.message === 'string' && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Email is already registered.' });
    }

    console.error('Error registering user:', error);
    return res.status(500).json({ error: 'Failed to create user.' });
  }
};

export const getUserByEmail = (req: Request, res: Response) => {
  const { email } = req.params;
  Database.db.get(
    `SELECT id, username, email, user_type, language, created_at FROM users WHERE email = ?`,
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

    const user = await getUserByEmailDb(email);
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
    `SELECT id, username, email, user_type, language, created_at FROM users`,
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
  const { username, email, password } = req.body;
  if (!username && !email && !password) {
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

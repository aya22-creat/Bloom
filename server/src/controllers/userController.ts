import { Request, Response } from 'express';
import { Database, RunResult } from '../lib/database';
import bcrypt from 'bcryptjs';
import { User } from '../types/user';

export const registerUser = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  // Check if user with same email or username exists
  Database.db.get(
    `SELECT id FROM users WHERE email = ? OR username = ?`,
    [email, username],
    async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error.' });
      }
      if (row) {
        return res.status(409).json({ error: 'User with this email or username already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      Database.db.run(
        `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
        [username, email, hashedPassword],
        function (this: RunResult, err) {
          if (err) {
            return res.status(400).json({ error: 'Invalid data or failed to create user.' });
          }
          res.status(201).json({ id: this.lastID, username, email });
        }
      );
    }
  );
};

export const getUserByEmail = (req: Request, res: Response) => {
  const { email } = req.params;
  Database.db.get(
    `SELECT id, username, email, created_at FROM users WHERE email = ?`,
    [email],
    (err, row) => {
      if (err || !row) {
        return res.status(404).json({ error: 'User not found.' });
      }
      res.json(row);
    }
  );
};

export const loginUser = (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  Database.db.get(
    `SELECT * FROM users WHERE email = ?`,
    [email],
    async (err, row: User) => {
      if (err || !row) {
        return res.status(404).json({ error: 'User not found.' });
      }
      const isMatch = await bcrypt.compare(password, row.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials.' });
      }
      res.json({
        id: row.id,
        username: row.username,
        email: row.email,
      });
    }
  );
};

export const getAllUsers = (req: Request, res: Response) => {
  Database.db.all(
    `SELECT id, username, email, created_at FROM users`,
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

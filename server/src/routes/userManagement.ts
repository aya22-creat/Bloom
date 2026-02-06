/**
 * User management routes (extended for RBAC)
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Database } from '../lib/database';
import { requireAuth, requireRole, generateToken } from '../middleware/rbac.middleware';
import { validate, registerSchema, loginSchema, assignDoctorSchema } from '../middleware/validation.schemas';
import { logAudit } from '../services/audit.service';

const router = Router();

/**
 * POST /api/users/register
 * Register new user with role selection
 */
router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { username, email, password, role, userType, language } = req.body;

    // Check if email already exists
    const existingUser = await new Promise((resolve, reject) => {
      Database.db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Email already exists',
        message: 'An account with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // For doctors, set approved = false (pending approval)
    // For patients and admins (created by other admins), approved = true
    const approved = role === 'doctor' ? false : true;

    // Insert user
    const userId = await new Promise<number>((resolve, reject) => {
      Database.db.run(
        `INSERT INTO users (username, email, password, role, userType, approved, language, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [username, email, hashedPassword, role, userType || null, approved ? 1 : 0, language || 'en'],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Generate token
    const token = generateToken({
      userId,
      email,
      role,
      userType,
      language: language || 'en',
      approved,
    });

    // Log audit
    await logAudit({
      user_id: userId,
      action: 'user_registered',
      entity_type: 'user',
      entity_id: userId,
      details: JSON.stringify({ role, userType }),
      ip_address: req.ip,
    });

    res.status(201).json({
      message: role === 'doctor' ? 'Doctor account created. Awaiting admin approval.' : 'Account created successfully',
      id: userId,
      username,
      email,
      role,
      userType,
      language: language || 'en',
      approved,
      token,
      pending: !approved,
    });
  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration',
    });
  }
});

/**
 * POST /api/users/login
 * Login with email and password
 */
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user: any = await new Promise((resolve, reject) => {
      Database.db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      userType: user.userType,
      language: user.language,
      approved: user.approved === 1,
    });

    // Log audit
    await logAudit({
      user_id: user.id,
      action: 'user_login',
      entity_type: 'user',
      entity_id: user.id,
      ip_address: req.ip,
    });

    res.json({
      message: 'Login successful',
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      userType: user.userType,
      language: user.language,
      approved: user.approved === 1,
      assigned_doctor_id: user.assigned_doctor_id,
      token,
    });
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login',
    });
  }
});

/**
 * POST /api/users/approve-doctor/:id
 * Approve a pending doctor account (admin only)
 */
router.post('/approve-doctor/:id', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const doctorId = parseInt(req.params.id);

    // Verify doctor exists and is pending
    const doctor: any = await new Promise((resolve, reject) => {
      Database.db.get(
        "SELECT * FROM users WHERE id = ? AND role = 'doctor'",
        [doctorId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!doctor) {
      return res.status(404).json({
        error: 'Doctor not found',
        message: 'Doctor account does not exist',
      });
    }

    if (doctor.approved === 1) {
      return res.status(400).json({
        error: 'Already approved',
        message: 'This doctor is already approved',
      });
    }

    // Approve doctor
    await new Promise<void>((resolve, reject) => {
      Database.db.run(
        'UPDATE users SET approved = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [doctorId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Log audit
    await logAudit({
      user_id: req.user!.userId,
      action: 'doctor_approved',
      entity_type: 'user',
      entity_id: doctorId,
      details: JSON.stringify({ doctor_email: doctor.email }),
      ip_address: req.ip,
    });

    res.json({
      message: 'Doctor approved successfully',
      doctorId,
    });
  } catch (error) {
    console.error('[Approve Doctor Error]', error);
    res.status(500).json({
      error: 'Approval failed',
      message: 'An error occurred while approving doctor',
    });
  }
});

/**
 * GET /api/users
 * List all users with filters (admin only)
 */
router.get('/', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { role, approved, search, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT id, username, email, role, userType, approved, assigned_doctor_id, language, created_at FROM users WHERE 1=1';
    const params: any[] = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (approved !== undefined) {
      query += ' AND approved = ?';
      params.push(approved === 'true' ? 1 : 0);
    }

    if (search) {
      query += ' AND (username LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const users = await new Promise<any[]>((resolve, reject) => {
      Database.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({ users });
  } catch (error) {
    console.error('[List Users Error]', error);
    res.status(500).json({
      error: 'Failed to list users',
      message: 'An error occurred while fetching users',
    });
  }
});

/**
 * PUT /api/users/:patientId/assign-doctor
 * Assign a doctor to a patient (admin only)
 */
router.put('/:patientId/assign-doctor', requireAuth, requireRole('admin'), validate(assignDoctorSchema), async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const { doctorId } = req.body;

    // Verify patient exists and is a patient
    const patient: any = await new Promise((resolve, reject) => {
      Database.db.get(
        "SELECT id FROM users WHERE id = ? AND role = 'patient'",
        [patientId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'Patient does not exist',
      });
    }

    // Verify doctor exists and is approved
    const doctor: any = await new Promise((resolve, reject) => {
      Database.db.get(
        "SELECT id FROM users WHERE id = ? AND role = 'doctor' AND approved = 1",
        [doctorId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!doctor) {
      return res.status(404).json({
        error: 'Doctor not found',
        message: 'Doctor does not exist or is not approved',
      });
    }

    // Assign doctor to patient
    await new Promise<void>((resolve, reject) => {
      Database.db.run(
        'UPDATE users SET assigned_doctor_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [doctorId, patientId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Log audit
    await logAudit({
      user_id: req.user!.userId,
      action: 'doctor_assigned',
      entity_type: 'user',
      entity_id: patientId,
      details: JSON.stringify({ doctor_id: doctorId }),
      ip_address: req.ip,
    });

    res.json({
      message: 'Doctor assigned successfully',
      patientId,
      doctorId,
    });
  } catch (error) {
    console.error('[Assign Doctor Error]', error);
    res.status(500).json({
      error: 'Assignment failed',
      message: 'An error occurred while assigning doctor',
    });
  }
});

/**
 * GET /api/users/me
 * Get current user info
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user: any = await new Promise((resolve, reject) => {
      Database.db.get(
        'SELECT id, username, email, role, userType, approved, assigned_doctor_id, language, created_at FROM users WHERE id = ?',
        [req.user!.userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account does not exist',
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('[Get User Error]', error);
    res.status(500).json({
      error: 'Failed to get user',
      message: 'An error occurred while fetching user',
    });
  }
});

export default router;

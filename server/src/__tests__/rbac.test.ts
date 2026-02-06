/**
 * Backend API Tests - User Management
 * Run with: npm test
 */

import request from 'supertest';
import { describe, it, expect } from '@jest/globals';
// Import your Express app
// import app from '../src/index';

const API_URL = 'http://localhost:4000/api';
let adminToken: string;
let doctorToken: string;
let patientToken: string;
let testDoctorId: number;
let testPatientId: number;

describe('RBAC Authentication & Authorization', () => {
  
  describe('POST /api/auth/register', () => {
    it('should register a new patient user', async () => {
      const res = await request(API_URL)
        .post('/auth/register')
        .send({
          username: 'Test Patient',
          email: `patient${Date.now()}@test.com`,
          password: 'Test123!',
          role: 'patient',
          userType: 'wellness',
          language: 'en',
        });

      expect(res.status).toBe(201);
      expect(res.body.role).toBe('patient');
      expect(res.body.userType).toBe('wellness');
      expect(res.body.approved).toBe(true);
      expect(res.body.token).toBeDefined();
      
      patientToken = res.body.token;
      testPatientId = res.body.id;
    });

    it('should register a doctor with pending approval', async () => {
      const res = await request(API_URL)
        .post('/auth/register')
        .send({
          username: 'Test Doctor',
          email: `doctor${Date.now()}@test.com`,
          password: 'Doctor123!',
          role: 'doctor',
          language: 'en',
        });

      expect(res.status).toBe(201);
      expect(res.body.role).toBe('doctor');
      expect(res.body.approved).toBe(false);
      expect(res.body.pending).toBe(true);
      expect(res.body.token).toBeDefined();
      
      doctorToken = res.body.token;
      testDoctorId = res.body.id;
    });

    it('should reject duplicate email', async () => {
      const res = await request(API_URL)
        .post('/auth/register')
        .send({
          username: 'Duplicate User',
          email: 'admin@bloomhope.com', // Existing email from seed
          password: 'Test123!',
          role: 'patient',
          userType: 'wellness',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already exists');
    });

    it('should reject invalid role', async () => {
      const res = await request(API_URL)
        .post('/auth/register')
        .send({
          username: 'Invalid Role',
          email: 'invalid@test.com',
          password: 'Test123!',
          role: 'invalidrole',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(API_URL)
        .post('/auth/login')
        .send({
          email: 'admin@bloomhope.com',
          password: 'Admin123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('admin');
      expect(res.body.token).toBeDefined();
      
      adminToken = res.body.token;
    });

    it('should reject invalid credentials', async () => {
      const res = await request(API_URL)
        .post('/auth/login')
        .send({
          email: 'admin@bloomhope.com',
          password: 'WrongPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });
  });

  describe('POST /api/auth/approve-doctor/:id', () => {
    it('should allow admin to approve doctor', async () => {
      const res = await request(API_URL)
        .post(`/auth/approve-doctor/${testDoctorId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('approved');
    });

    it('should reject non-admin approval attempt', async () => {
      const res = await request(API_URL)
        .post(`/auth/approve-doctor/${testDoctorId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('should reject unauthenticated approval attempt', async () => {
      const res = await request(API_URL)
        .post(`/auth/approve-doctor/${testDoctorId}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });
  });

  describe('PUT /api/auth/:patientId/assign-doctor', () => {
    it('should allow admin to assign doctor to patient', async () => {
      const res = await request(API_URL)
        .put(`/auth/${testPatientId}/assign-doctor`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ doctorId: testDoctorId });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('assigned');
    });

    it('should reject non-admin assignment attempt', async () => {
      const res = await request(API_URL)
        .put(`/auth/${testPatientId}/assign-doctor`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ doctorId: testDoctorId });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/auth/users', () => {
    it('should allow admin to list all users', async () => {
      const res = await request(API_URL)
        .get('/auth/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.users)).toBe(true);
    });

    it('should reject non-admin user listing', async () => {
      const res = await request(API_URL)
        .get('/auth/users')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
    });

    it('should filter users by role', async () => {
      const res = await request(API_URL)
        .get('/auth/users?role=doctor')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users.every((u: any) => u.role === 'doctor')).toBe(true);
    });
  });
});

describe('Exercise Evaluations', () => {
  
  describe('POST /api/exercises/evaluate', () => {
    it('should allow patient to submit evaluation', async () => {
      const res = await request(API_URL)
        .post('/exercises/evaluate')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          exercise_name: 'Arm Raises',
          completed: true,
          pain_level: 3,
          fatigue_level: 2,
          notes: 'Felt good today',
        });

      expect(res.status).toBe(201);
      expect(res.body.score).toBeGreaterThan(0);
      expect(res.body.isHighRisk).toBe(false);
    });

    it('should calculate low score correctly', async () => {
      const res = await request(API_URL)
        .post('/exercises/evaluate')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          exercise_name: 'Stretching',
          completed: true,
          pain_level: 8, // High pain
          fatigue_level: 5,
        });

      expect(res.status).toBe(201);
      expect(res.body.score).toBeLessThan(50);
      expect(res.body.isHighRisk).toBe(true);
    });

    it('should reject non-patient evaluation', async () => {
      const res = await request(API_URL)
        .post('/exercises/evaluate')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          exercise_name: 'Test',
          completed: true,
          pain_level: 0,
          fatigue_level: 0,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/exercises/:patientId', () => {
    it('should allow patient to view own evaluations', async () => {
      const res = await request(API_URL)
        .get(`/exercises/${testPatientId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.evaluations)).toBe(true);
    });

    it('should allow assigned doctor to view patient evaluations', async () => {
      const res = await request(API_URL)
        .get(`/exercises/${testPatientId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/exercises/:patientId/stats', () => {
    it('should return correct statistics', async () => {
      const res = await request(API_URL)
        .get(`/exercises/${testPatientId}/stats?days=30`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stats).toHaveProperty('total_evaluations');
      expect(res.body.stats).toHaveProperty('completion_rate');
      expect(res.body.stats).toHaveProperty('average_score');
      expect(res.body.stats).toHaveProperty('average_pain');
    });
  });
});

describe('Chat System', () => {
  
  let roomId: number;

  describe('GET /api/chat/rooms', () => {
    it('should return accessible rooms for patient', async () => {
      const res = await request(API_URL)
        .get('/chat/rooms')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.rooms)).toBe(true);
    });
  });

  describe('POST /api/chat/rooms', () => {
    it('should allow admin to create private room', async () => {
      const res = await request(API_URL)
        .post('/chat/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'private',
          patientId: testPatientId,
          doctorId: testDoctorId,
        });

      expect(res.status).toBe(201);
      expect(res.body.roomId).toBeDefined();
      
      roomId = res.body.roomId;
    });

    it('should reject non-admin room creation', async () => {
      const res = await request(API_URL)
        .post('/chat/rooms')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          type: 'private',
          patientId: testPatientId,
          doctorId: testDoctorId,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/chat/rooms/:id/messages', () => {
    it('should allow patient to send message', async () => {
      const res = await request(API_URL)
        .post(`/chat/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          message: 'Hello doctor',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.message).toBe('Hello doctor');
    });

    it('should prevent doctor from posting in global chat', async () => {
      const globalRoomId = 1; // Assuming first room is global
      const res = await request(API_URL)
        .post(`/chat/rooms/${globalRoomId}/messages`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          message: 'Test',
        });

      expect(res.status).toBe(403);
    });
  });
});

describe('Reminder System', () => {
  
  let reminderId: number;

  describe('POST /api/reminders-mgmt', () => {
    it('should allow admin to create reminder for all patients', async () => {
      const res = await request(API_URL)
        .post('/reminders-mgmt')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          target_type: 'all',
          title: 'Health Check Reminder',
          description: 'Please complete your weekly health check',
          type: 'custom',
          scheduled_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          recurrence: 'weekly',
        });

      expect(res.status).toBe(201);
      expect(res.body.reminderId).toBeDefined();
      
      reminderId = res.body.reminderId;
    });

    it('should allow doctor to create reminder for assigned patient', async () => {
      const res = await request(API_URL)
        .post('/reminders-mgmt')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          target_type: 'patient',
          target_id: testPatientId,
          title: 'Exercise Reminder',
          description: 'Complete your daily exercises',
          type: 'exercise',
          scheduled_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour
          recurrence: 'daily',
        });

      expect(res.status).toBe(201);
    });

    it('should reject patient creating reminders', async () => {
      const res = await request(API_URL)
        .post('/reminders-mgmt')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          target_type: 'patient',
          target_id: testPatientId,
          title: 'Test',
          type: 'custom',
          scheduled_time: new Date().toISOString(),
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/reminders-mgmt/:patientId', () => {
    it('should return reminders for patient', async () => {
      const res = await request(API_URL)
        .get(`/reminders-mgmt/${testPatientId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.reminders)).toBe(true);
    });
  });
});

describe('Admin Dashboard', () => {
  
  describe('GET /api/admin/stats', () => {
    it('should return comprehensive statistics', async () => {
      const res = await request(API_URL)
        .get('/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stats).toHaveProperty('total_patients');
      expect(res.body.stats).toHaveProperty('total_doctors');
      expect(res.body.stats).toHaveProperty('pending_doctors');
      expect(res.body.stats).toHaveProperty('active_reminders');
      expect(res.body.stats).toHaveProperty('flagged_messages');
      expect(res.body.stats).toHaveProperty('high_risk_alerts');
    });

    it('should reject non-admin access', async () => {
      const res = await request(API_URL)
        .get('/admin/stats')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/audit-logs', () => {
    it('should return audit logs', async () => {
      const res = await request(API_URL)
        .get('/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.logs)).toBe(true);
    });
  });
});

describe('Doctor Dashboard', () => {
  
  describe('GET /api/doctor/patients', () => {
    it('should return assigned patients', async () => {
      const res = await request(API_URL)
        .get('/doctor/patients')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.patients)).toBe(true);
    });

    it('should reject unapproved doctor access', async () => {
      // Create new unapproved doctor token
      const registerRes = await request(API_URL)
        .post('/auth/register')
        .send({
          username: 'Unapproved Doctor',
          email: `unapproved${Date.now()}@test.com`,
          password: 'Doctor123!',
          role: 'doctor',
        });

      const unapprovedToken = registerRes.body.token;

      const res = await request(API_URL)
        .get('/doctor/patients')
        .set('Authorization', `Bearer ${unapprovedToken}`);

      expect(res.status).toBe(403);
      expect(res.body.pending).toBe(true);
    });
  });

  describe('GET /api/doctor/patients/:patientId/summary', () => {
    it('should return patient summary with metrics', async () => {
      const res = await request(API_URL)
        .get(`/doctor/patients/${testPatientId}/summary`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.patient).toHaveProperty('exercise_completion_rate');
      expect(res.body.patient).toHaveProperty('risk_alerts');
    });
  });

  describe('GET /api/doctor/stats', () => {
    it('should return doctor dashboard statistics', async () => {
      const res = await request(API_URL)
        .get('/doctor/stats')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stats).toHaveProperty('total_patients');
      expect(res.body.stats).toHaveProperty('high_risk_alerts');
    });
  });
});

// Add more test suites as needed

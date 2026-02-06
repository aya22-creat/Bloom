# Bloom Hope - RBAC Enhanced Setup Guide

## Overview
This document provides instructions for setting up and running the Bloom Hope application with the new role-based access control (RBAC) features including patient, doctor, and admin roles, real-time chat, exercise evaluation tracking, and reminder scheduling.

## Prerequisites
- Node.js 18+ and npm/yarn/bun
- SQLite3
- Git

## Quick Start

### 1. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

Required new dependencies:
- `socket.io` - Real-time communication
- `node-cron` - Reminder scheduling
- `zod` - Validation
- `@types/node-cron` - TypeScript types

**Frontend:**
```bash
cd frontend
npm install
```

Required new dependencies:
- `socket.io-client` - Socket.IO client
- All existing dependencies

### 2. Environment Setup

**Backend (.env):**
```bash
cp server/.env.example server/.env
```

Edit `server/.env` and set:
```env
JWT_SECRET=your-super-secret-key-min-32-characters
GEMINI_API_KEY=your_gemini_key
FRONTEND_URL=http://localhost:5173
PORT=4000
```

**Frontend (.env):**
```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env` and set:
```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
```

### 3. Database Setup

Run migrations to add RBAC tables:
```bash
cd server
sqlite3 data/bloomhope.db < src/scripts/migrations/001_add_roles_and_rbac.sql
```

### 4. Seed Data (Optional but Recommended)

Create test users for all roles:
```bash
cd server
npm run migrate  # or: npx ts-node src/scripts/seedRoles.ts
```

This creates:
- **Admin**: admin@bloomhope.com / Admin123!
- **Doctor (Approved)**: dr.sarah@bloomhope.com / Doctor123!
- **Doctor (Pending)**: dr.pending@bloomhope.com / Doctor123!
- **Patients**: aisha@example.com, maria@example.com, layla@example.com / Patient123!

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

Server starts on http://localhost:4000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Frontend starts on http://localhost:5173

## New Features & Endpoints

### Role-Based Authentication

#### User Roles:
1. **Patient** - Default role for general users (fighters, survivors, wellness-focused)
2. **Doctor** - Healthcare providers (requires admin approval)
3. **Admin** - Full system access

#### Authentication Flow:
- Register: `POST /api/auth/register` - Select role during registration
- Login: `POST /api/auth/login` - Returns role and approval status
- Doctor accounts created with `approved: false` by default
- Admin approves doctors: `POST /api/auth/approve-doctor/:id`

### API Routes Summary

#### User Management (Admin)
- `GET /api/auth/users` - List all users with filters
- `POST /api/auth/approve-doctor/:id` - Approve doctor
- `PUT /api/auth/:patientId/assign-doctor` - Assign doctor to patient

#### Chat System
- `GET /api/chat/rooms` - Get accessible chat rooms
- `POST /api/chat/rooms` - Create private room (admin)
- `GET /api/chat/rooms/:id/messages` - Get messages
- `POST /api/chat/rooms/:id/messages` - Send message
- `POST /api/chat/messages/:id/report` - Report message
- `DELETE /api/chat/messages/:id` - Delete message

**Chat Types:**
- **Global**: All patients can communicate
- **Private**: One patient <-> one doctor

#### Exercise Evaluations
- `POST /api/exercises/evaluate` - Submit evaluation (patient)
- `GET /api/exercises/:patientId` - Get evaluations
- `GET /api/exercises/:patientId/stats` - Get statistics

**Score Formula:**
```
score = completed ? 100 : 0
score -= pain_level * 5
score -= fatigue_level * 2
score = clamp(score, 0, 100)
```

**Alerts:** Triggered when `pain_level >= 7` OR `score < 30`

#### Reminders
- `POST /api/reminders-mgmt` - Create reminder (admin/doctor)
- `GET /api/reminders-mgmt/:patientId` - Get patient reminders
- `PUT /api/reminders-mgmt/:id` - Update reminder
- `DELETE /api/reminders-mgmt/:id` - Delete reminder

**Target Types:**
- `patient` - Specific patient
- `group` - All patients of a userType (fighter/survivor/wellness)
- `all` - All patients

#### Doctor Dashboard
- `GET /api/doctor/patients` - List assigned patients
- `GET /api/doctor/patients/:id/summary` - Patient summary
- `GET /api/doctor/stats` - Dashboard statistics
- `GET /api/doctor/recent-activity` - Recent evaluations

#### Admin Dashboard
- `GET /api/admin/stats` - System-wide statistics
- `GET /api/admin/users/pending-doctors` - Pending approvals
- `GET /api/admin/users/unassigned-patients` - Unassigned patients
- `GET /api/admin/messages/flagged` - Flagged messages
- `GET /api/admin/audit-logs` - Audit trail
- `GET /api/admin/low-compliance` - Low compliance patients
- `GET /api/admin/high-risk-alerts` - High-risk evaluations

### Socket.IO Events

**Server Events:**
- `message:received` - New message in room
- `message:deleted` - Message removed
- `user:typing` - User typing indicator
- `room:joined` - User joined room
- `notification:reminder` - Reminder notification
- `notification:high_risk_alert` - High-risk exercise alert

**Client Events:**
- `join:room` - Join chat room
- `leave:room` - Leave chat room
- `user:typing` - Send typing indicator

### Reminder Scheduler

Runs every minute using node-cron:
- Checks for due reminders
- Sends in-app notifications via Socket.IO
- Sends email (stub - implement with nodemailer)
- Updates `last_sent_at` timestamp
- Handles recurrence (once, daily, weekly, monthly)

## Frontend Integration

### Updated AuthContext

```typescript
export type UserRole = 'patient' | 'doctor' | 'admin';

interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  userType?: 'fighter' | 'survivor' | 'wellness';
  approved: boolean;
  token: string;
}

// New helpers
const { isAdmin, isDoctor, isPatient, isApproved } = useAuth();
```

### useSocket Hook

```typescript
import { useSocket } from '@/hooks/useSocket';

const { socket, isConnected, joinRoom, leaveRoom, on, off } = useSocket();

// Join room
useEffect(() => {
  joinRoom(roomId);
  return () => leaveRoom(roomId);
}, [roomId]);

// Listen for messages
useEffect(() => {
  on('message:received', handleNewMessage);
  return () => off('message:received', handleNewMessage);
}, []);
```

### Protected Routes

Use role-based route protection:

```typescript
// Patient-only route
<Route 
  path="/health-tracker/:userType" 
  element={
    <ProtectedRoute requiredRole="patient">
      <HealthTracker />
    </ProtectedRoute>
  } 
/>

// Doctor-only route
<Route 
  path="/doctor/dashboard" 
  element={
    <ProtectedRoute requiredRole="doctor" requireApproved>
      <DoctorDashboard />
    </ProtectedRoute>
  } 
/>

// Admin-only route
<Route 
  path="/admin/dashboard" 
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  } 
/>
```

## Security Considerations

### Production Checklist:
- [ ] Change `JWT_SECRET` to strong random string (min 32 chars)
- [ ] Enable HTTPS (required for production)
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS with specific frontend domain
- [ ] Enable rate limiting on API endpoints
- [ ] Set up database backups (automated)
- [ ] Use environment-specific `.env` files
- [ ] Implement proper logging (Winston/Morgan)
- [ ] Set up monitoring (Sentry, New Relic)
- [ ] Review and extend profanity filter
- [ ] Implement email verification (optional)
- [ ] Add password reset flow
- [ ] Configure firewall rules

### Input Validation:
All endpoints use Zod schemas for validation. Extend as needed in `/server/src/middleware/validation.schemas.ts`

### Authorization:
- `requireAuth` - JWT validation
- `requireRole('admin', 'doctor')` - Role check
- `requireApproved` - Doctor approval check
- `requirePatientAccess` - Patient data access check

## Testing

### Backend Unit Tests

```bash
cd server
npm test
```

Example test (create in `/server/src/__tests__/`):

```typescript
import request from 'supertest';
import app from '../index';

describe('Auth Endpoints', () => {
  it('should register a new patient', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'Test User',
        email: 'test@example.com',
        password: 'Test123!',
        role: 'patient',
        userType: 'wellness',
      });
    
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('patient');
    expect(res.body.token).toBeDefined();
  });

  it('should require admin approval for doctors', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'Dr. Test',
        email: 'doctor@example.com',
        password: 'Doctor123!',
        role: 'doctor',
      });
    
    expect(res.status).toBe(201);
    expect(res.body.approved).toBe(false);
    expect(res.body.pending).toBe(true);
  });
});
```

### Frontend Component Tests

```bash
cd frontend
npm test
```

### E2E Test Plan

Using Playwright or Cypress:

1. **User Registration Flow**
   - Select role (patient/doctor/admin)
   - If patient: select userType
   - Fill form and submit
   - Verify redirect based on role

2. **Doctor Approval Workflow**
   - Doctor registers (pending status)
   - Admin logs in
   - Admin approves doctor
   - Doctor can now access dashboard

3. **Chat Functionality**
   - Patient sends message to global chat
   - Doctor sends private message to patient
   - Admin moderates flagged message

4. **Exercise Evaluation**
   - Patient submits evaluation
   - High pain level triggers alert
   - Doctor receives notification
   - Doctor views evaluation in dashboard

5. **Reminder System**
   - Admin creates reminder for all patients
   - Doctor creates reminder for specific patient
   - Patient receives notification

## Troubleshooting

### Socket.IO Connection Issues
- Check CORS settings in backend
- Verify frontend URL in backend `.env`
- Check browser console for errors
- Ensure token is valid

### Database Migration Errors
- Backup database before running migrations
- Check SQL syntax
- Verify table doesn't already exist
- Use SQLite browser to inspect schema

### Authentication Failures
- Verify JWT_SECRET matches in `.env`
- Check token expiration (30 days default)
- Clear localStorage and re-login
- Verify user exists and is approved (for doctors)

### Reminder Scheduler Not Running
- Check node-cron syntax
- Verify server is running
- Check logs for errors
- Ensure reminders table has active reminders

## Database Schema

Key tables added:

```sql
users:
  - role (patient/doctor/admin)
  - approved (boolean)
  - assigned_doctor_id (FK)

chat_rooms:
  - type (global/private)
  - patient_id, doctor_id

chat_messages:
  - room_id, sender_id
  - is_reported, is_deleted

exercise_evaluations:
  - patient_id, exercise_name
  - pain_level, fatigue_level, score

reminders:
  - target_type (patient/group/all)
  - type, scheduled_time, recurrence

audit_logs:
  - user_id, action, entity_type
  - details (JSON)
```

## Architecture Diagrams

See `server/ARCHITECTURE_DIAGRAMS.ts` for visual representations.

## Support

For issues or questions:
1. Check logs: `server/logs/` and browser console
2. Review audit logs: `GET /api/admin/audit-logs`
3. Check database directly with SQLite browser

## License

Private - Bloom Hope Project

---

**Last Updated:** January 31, 2026
**Version:** 2.0.0-rbac

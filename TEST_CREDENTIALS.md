# Bloom Hope - Test Credentials

## 🔐 Test Account Credentials

### 👤 Administrator
- **Email:** admin@bloom.com
- **Password:** Admin@123
- **Role:** Full system access, can manage doctors and patients

### 🏥 Doctors
1. **English Doctor:**
   - **Email:** doctor@bloom.com
   - **Password:** Doctor@123
   - **Language:** English

2. **Arabic Doctor:**
   - **Email:** doctor.ar@bloom.com
   - **Password:** Doctor@123
   - **Language:** Arabic (العربية)

### 🩺 Patients

1. **Fighter (Currently in Treatment):**
   - **Email:** fighter@bloom.com
   - **Password:** Patient@123
   - **Type:** Breast Cancer Fighter

2. **Survivor:**
   - **Email:** survivor@bloom.com
   - **Password:** Patient@123
   - **Type:** Cancer Survivor

3. **Wellness (Prevention):**
   - **Email:** wellness@bloom.com
   - **Password:** Patient@123
   - **Type:** Health Conscious Woman

---

## 🚀 How to Run the Project

### Backend Server
```bash
cd server
npm run dev
```
Server will start on: http://localhost:4000

### Frontend
```bash
cd frontend
npm run dev
```
Frontend will start on: http://localhost:5173

---

## 📝 Important Notes

1. **Patient Registration:** Only patients can self-register through the registration page
2. **Doctor/Admin Accounts:** Only admins can create doctor and admin accounts (not available through public registration)
3. **First Login:** When you first login, the system will redirect you to the appropriate dashboard based on your user type
4. **Language:** You can change the language anytime using the language switcher in the top right corner
5. **Seed Data:** If you need to reset the test accounts, run: `npm run seed:test` in the server directory

---

## 🔄 Resetting Test Data

If you want to recreate all test users:

```bash
cd server
npm run seed:test
```

This will create all test accounts if they don't exist already.

---

## 📱 User Dashboards

After login, users are redirected to their respective dashboards:

- **Admin:** `/dashboard/admin`
- **Doctor:** `/dashboard/doctor`
- **Patients:** `/dashboard/fighter`, `/dashboard/survivor`, or `/dashboard/wellness`

---

## 🛡️ Security Notes

- All passwords are hashed using bcrypt with 10 salt rounds
- JWT tokens are used for authentication
- Token expiration is checked automatically
- These are TEST credentials only - change them in production!

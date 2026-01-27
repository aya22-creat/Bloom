# Production-Grade Backend Architecture - Implementation Guide

## 🎯 Overview

Your Bloom Hope backend has been upgraded to **production-grade clean architecture**. This implementation maintains backward compatibility while introducing industry-standard patterns for scalability, testability, and maintainability.

---

## 📁 New Structure Summary

```
server/src/
├── repositories/          ← Data access layer (NEW)
│   ├── base.repository.ts     (Abstract CRUD operations)
│   └── user.repository.ts     (Example: User data access)
│
├── services/              ← Business logic layer (NEW)
│   ├── user.service.ts        (User authentication, registration)
│   ├── profile.service.ts     (Stub: User profiles)
│   ├── cycle.service.ts       (Stub: Menstrual cycle tracking)
│   ├── medication.service.ts  (Stub: Medication management)
│   ├── symptom.service.ts     (Stub: Symptom tracking)
│   ├── reminder.service.ts    (Stub: Health reminders)
│   └── wellness.service.ts    (Stub: Wellness scoring)
│
├── middleware/            ← Request processing (NEW)
│   ├── auth.middleware.ts         (JWT authentication)
│   ├── authorization.middleware.ts (RBAC & ownership)
│   ├── error-handler.middleware.ts (Global error handling)
│   └── validation.middleware.ts    (Request validation)
│
├── ai/                    ← AI Gateway (NEW)
│   ├── interfaces/
│   │   └── ai-provider.interface.ts   (Provider contract)
│   ├── dtos/
│   │   ├── ai-request.dto.ts
│   │   └── ai-response.dto.ts
│   └── ai.service.ts              (AI facade/gateway)
│
├── dtos/                  ← Type-safe contracts (NEW)
│   ├── user.dto.ts
│   ├── cycle.dto.ts
│   ├── medication.dto.ts
│   ├── symptom.dto.ts
│   ├── reminder.dto.ts
│   ├── profile.dto.ts
│   └── response.dto.ts
│
├── utils/                 ← Utilities (NEW)
│   ├── jwt.util.ts        (JWT operations)
│   ├── password.util.ts   (Password hashing & validation)
│   └── error.util.ts      (Custom error class)
│
├── constants/             ← Constants (NEW)
│   ├── http-status.ts     (HTTP status codes)
│   ├── error-messages.ts  (Error message constants)
│   └── database.config.ts (Database configuration)
│
├── controllers/           ← HTTP layer (EXISTING)
├── routes/                ← API routes (EXISTING)
├── types/                 ← Database entities (EXISTING)
├── lib/
│   └── database.ts        ← Database connection (EXISTING)
│
├── ARCHITECTURE.md        ← Detailed architecture guide (NEW)
└── EXAMPLE_CONTROLLER.ts  ← Example implementation (NEW)
```

---

## 🏗️ Architecture Layers Explained

### Layer 1: Middleware (Request Entry Point)
```
Validation → Authentication → Authorization → Error Handling
```

### Layer 2: Controllers/Routes (HTTP Handling)
- Parse HTTP requests
- Call services
- Format responses
- **Never touch database directly**
- **No business logic here**

### Layer 3: Services (Business Logic)
- User registration, login, password change
- Data validation
- Orchestrate repositories
- **No Express objects allowed**
- **Reusable across multiple endpoints**

### Layer 4: Repositories (Data Access)
- CRUD operations
- Database queries
- **No business logic**
- **Database abstraction**

### Layer 5: Database (Storage)
- Persistent data storage

---

## 🔐 Security Features Included

### Authentication
- ✅ JWT tokens (access + refresh)
- ✅ Token expiration (24h access, 7d refresh)
- ✅ Token verification middleware
- ✅ Secure token extraction (Bearer scheme)

### Password Security
- ✅ bcryptjs hashing (10 salt rounds)
- ✅ Password strength validation
- ✅ Change password with verification
- ✅ Random password generation

### Authorization
- ✅ Role-based access control (RBAC)
- ✅ Resource ownership verification
- ✅ Permission-based middleware

### Input Validation
- ✅ Schema-based validation
- ✅ Type safety with DTOs
- ✅ Custom validators support

### Error Handling
- ✅ Centralized error handler
- ✅ No production stack traces
- ✅ Consistent error format
- ✅ Proper HTTP status codes

---

## 📚 File-by-File Guide

### Base Repository (`repositories/base.repository.ts`)
**Purpose:** Abstract base class for all repositories
**Provides:** CRUD operations (findById, findAll, create, update, delete)
**Pattern:** Repository Pattern + Generics

**Example Usage:**
```typescript
class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }
  
  async findByEmail(email: string) {
    return this.executeQuery('SELECT * FROM users WHERE email = ?', [email]);
  }
}
```

### User Repository (`repositories/user.repository.ts`)
**Purpose:** User-specific data access
**Methods:** findByEmail, findByUsername, emailExists, usernameExists
**Design:** Extends BaseRepository, singleton pattern

### User Service (`services/user.service.ts`)
**Purpose:** User business logic
**Methods:** 
- `register()` - User registration with validation
- `login()` - User authentication
- `getUserById()` - Fetch user safely
- `changePassword()` - Password change with verification
- Helper methods for token generation & data sanitization

**Key Features:**
- ✅ Validates input
- ✅ Calls repository for data
- ✅ Returns safe user objects (no passwords)
- ✅ Generates JWT tokens
- ✅ No Express objects

### Service Templates (Other Services)
**Files:** 
- `profile.service.ts` - User profiles
- `cycle.service.ts` - Menstrual cycle tracking
- `medication.service.ts` - Medication management
- `symptom.service.ts` - Symptom tracking
- `reminder.service.ts` - Health reminders
- `wellness.service.ts` - Derived metrics

**Status:** Stubs with TODO comments for implementation

### Auth Middleware (`middleware/auth.middleware.ts`)
**Purpose:** JWT token verification
**Exports:**
- `authMiddleware` - Required JWT authentication
- `optionalAuthMiddleware` - Optional JWT
- `refreshTokenMiddleware` - Refresh token validation

**Usage:**
```typescript
app.get('/api/protected', authMiddleware, handler);
```

### Authorization Middleware (`middleware/authorization.middleware.ts`)
**Purpose:** Role & permission checks
**Exports:**
- `authorize()` - Role-based access control
- `ownsResource()` - Resource ownership check

**Usage:**
```typescript
app.get('/api/users/:userId', 
  authMiddleware,
  ownsResource('userId'),
  handler
);
```

### Error Handler Middleware (`middleware/error-handler.middleware.ts`)
**Purpose:** Global error handling
**Features:**
- Catches all errors
- Formats consistent responses
- Logs errors appropriately
- Prevents unhandled rejections

**Must be last middleware:**
```typescript
app.use(errorHandler);
```

### Validation Middleware (`middleware/validation.middleware.ts`)
**Purpose:** Request input validation
**Provides:**
- `validate()` - Schema-based validation
- Pre-built schemas (registerUser, loginUser, etc.)
- Custom validation rules support

**Usage:**
```typescript
app.post('/register', 
  validate(ValidationSchemas.registerUser),
  handler
);
```

### JWT Utility (`utils/jwt.util.ts`)
**Methods:**
- `sign()` - Create JWT token
- `verify()` - Verify & decode token
- `decode()` - Decode without verification
- `isExpired()` - Check token expiration
- `getTimeUntilExpiry()` - Remaining time

### Password Utility (`utils/password.util.ts`)
**Methods:**
- `hash()` - Hash password with bcryptjs
- `compare()` - Verify password
- `checkStrength()` - Evaluate password strength
- `generateRandom()` - Generate secure password

### AI Service (`ai/ai.service.ts`)
**Purpose:** Gateway for AI operations
**Features:**
- Provider initialization
- Mock implementation ready
- Health checks
- Error handling
- TODO comments for actual AI integration

**Current State:**
- ✅ Interface defined
- ✅ Service skeleton
- ⏳ No external API calls yet

### DTOs (Data Transfer Objects)
**Files:**
- `user.dto.ts` - Register, Login, Update requests
- `cycle.dto.ts` - Cycle tracking requests/responses
- `medication.dto.ts` - Medication management
- `symptom.dto.ts` - Symptom tracking
- `reminder.dto.ts` - Reminder management
- `profile.dto.ts` - Profile updates
- `response.dto.ts` - Generic success/error responses

**Purpose:**
- Type safety for API contracts
- Control what data is exposed
- Separate API from database schemas

### Constants
- `http-status.ts` - HTTP status codes (no magic numbers!)
- `error-messages.ts` - Error message constants
- `database.config.ts` - Database configuration by environment

---

## 🚀 How to Use This Architecture

### Example 1: Simple GET Endpoint

```typescript
// 1. Define DTO
export interface GetProfileResponse {
  id: number;
  firstName: string;
  lastName: string;
}

// 2. Create Repository
class ProfileRepository extends BaseRepository<Profile> {
  constructor() {
    super('profiles');
  }
  
  async findByUserId(userId: number) {
    return this.executeQuery(
      'SELECT * FROM profiles WHERE userId = ?',
      [userId]
    );
  }
}

// 3. Create Service
class ProfileService {
  async getUserProfile(userId: number) {
    const profile = await profileRepository.findByUserId(userId);
    if (!profile) {
      throw new AppError('Profile not found', HttpStatus.NOT_FOUND);
    }
    return profile;
  }
}

// 4. Create Route
router.get(
  '/api/v1/profiles/:userId',
  authMiddleware,
  ownsResource('userId'),
  asyncHandler(async (req, res) => {
    const profile = await profileService.getUserProfile(req.params.userId);
    return res.json(ApiResponse.success(profile));
  })
);
```

### Example 2: Adding Validation

```typescript
// Add validation schema
export const GetProfileSchema = {
  userId: { required: true, type: 'number' }
};

// Use in route
router.get(
  '/api/v1/profiles/:userId',
  validate(GetProfileSchema),  // ← Validation
  authMiddleware,
  asyncHandler(...)
);
```

### Example 3: Complex Business Logic

```typescript
// Service orchestrates multiple operations
async calculateWellnessScore(userId: number) {
  // Call multiple repositories
  const cycles = await cycleRepository.findByUserId(userId);
  const meds = await medicationRepository.findByUserId(userId);
  const symptoms = await symptomRepository.findByUserId(userId);
  
  // Business logic
  const score = this.computeScore(cycles, meds, symptoms);
  
  // Return result
  return score;
}
```

---

## 🔄 Migration Path (Existing Routes)

### Phase 1: Create new layers (✅ DONE)
- Repositories created
- Services created
- Middleware added

### Phase 2: Create example controller
- See `EXAMPLE_CONTROLLER.ts`
- Shows all patterns

### Phase 3: Migrate existing routes
1. Create repository if needed
2. Create service with business logic
3. Update controller to use service
4. Add middleware to route
5. Test and deploy

### Phase 4: Refactor & optimize
- Remove old patterns
- Consolidate similar logic
- Add comprehensive tests

---

## 📋 Checklist for New Features

- [ ] Create DTO (request/response structures)
- [ ] Create repository (if new entity)
- [ ] Create service (business logic)
- [ ] Add validation schema
- [ ] Create controller/route
- [ ] Add authMiddleware (if protected)
- [ ] Add ownsResource check (if applicable)
- [ ] Write unit tests for service
- [ ] Write integration tests
- [ ] Add error handling
- [ ] Test with Postman/curl
- [ ] Update API documentation
- [ ] Deploy and monitor

---

## 🧪 Testing Examples

### Unit Test (Service)
```typescript
describe('UserService', () => {
  let mockRepo;
  
  beforeEach(() => {
    mockRepo = { findByEmail: jest.fn() };
  });
  
  it('should login with valid credentials', async () => {
    mockRepo.findByEmail.mockResolvedValue({
      id: 1,
      email: 'test@test.com',
      password: hashedPassword
    });
    
    const result = await userService.login({
      email: 'test@test.com',
      password: 'password123'
    });
    
    expect(result.tokens).toBeDefined();
  });
});
```

### Integration Test (Route)
```typescript
describe('POST /api/v1/auth/login', () => {
  it('should return token on success', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@test.com',
        password: 'password123'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });
});
```

---

## 🔑 Key Principles

1. **Single Responsibility** - Each class has one reason to change
2. **Dependency Inversion** - Depend on interfaces, not implementations
3. **Separation of Concerns** - HTTP, business logic, and data are separate
4. **DRY (Don't Repeat Yourself)** - Base classes and utilities prevent duplication
5. **KISS (Keep It Simple)** - Clear, readable code over clever code
6. **Type Safety** - TypeScript + DTOs prevent runtime errors

---

## 📖 Documentation Files

- **`ARCHITECTURE.md`** - Detailed architecture overview
- **`EXAMPLE_CONTROLLER.ts`** - Working example implementation
- **This file** - Quick reference guide

---

## 🎓 Learning Resources

To understand the patterns used:

1. **Clean Architecture** - Read Robert C. Martin's books
2. **Design Patterns** - Gang of Four patterns
3. **SOLID Principles** - Five principles for good OOP design
4. **Repository Pattern** - Data access abstraction
5. **Service Layer Pattern** - Business logic organization

---

## ⚡ Quick Commands

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Run tests (when added)
npm test

# Run tests with coverage
npm test -- --coverage
```

---

## 🐛 Troubleshooting

### Services not found?
- Check if exported as singleton at bottom of service file
- Ensure imports use correct paths

### Type errors with DTOs?
- DTOs use namespaces: `UserDTO.RegisterRequest`
- Import the namespace, not individual types

### Middleware not applying?
- Order matters! Auth before authorization
- Error handler MUST be last
- Use `asyncHandler()` to wrap async routes

### Database errors?
- Check database configuration in `.env`
- Verify connection string
- Check table existence

---

## 📞 Support

For questions or issues:
1. Check `ARCHITECTURE.md` for detailed explanations
2. Review `EXAMPLE_CONTROLLER.ts` for usage patterns
3. Look at similar implemented services
4. Check middleware documentation inline

---

**Ready to build? Start with creating your first controller using UserService as a reference!**

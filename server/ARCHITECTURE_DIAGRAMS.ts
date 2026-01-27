/**
 * ARCHITECTURE VISUALIZATION - COMPLETE STRUCTURE
 * 
 * This file provides visual representations of the architecture
 */

/**
 * ============================================================================
 * REQUEST FLOW DIAGRAM
 * ============================================================================
 */

/*
┌─────────────────────────────────────────────────────────────────────────┐
│                          HTTP CLIENT REQUEST                            │
│                     GET /api/v1/users/:userId                           │
│                 Headers: Authorization: Bearer <token>                  │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
         ┌─────────────────────────────────────────────────────┐
         │           MIDDLEWARE CHAIN (Entry Point)            │
         ├─────────────────────────────────────────────────────┤
         │  1. Body Parser (JSON middleware)                   │
         │  2. Validation Middleware ← Check schema            │
         │  3. Auth Middleware ← Verify JWT token             │
         │  4. Authorization Middleware ← Check permissions    │
         │  5. Async Handler ← Error wrapping                 │
         └──────────────────────────┬──────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │ VALID REQUEST?                │
                    ├───────────────┬───────────────┤
                    │               │               │
                   YES              NO             ERROR
                    │               │               │
                    ▼               ▼               ▼
         ┌──────────────────┐   ┌──────────────┐   │
         │ Pass to Route    │   │ Error        │   │
         │ Handler          │   │ Response     │   │
         └────────┬─────────┘   └──────────────┘   │
                  │                                 │
                  ▼                                 │
    ┌─────────────────────────────────────────┐    │
    │         CONTROLLER/ROUTE LAYER           │    │
    ├─────────────────────────────────────────┤    │
    │ 1. Extract data from request            │    │
    │ 2. Call Service method                  │    │
    │ 3. Format response                      │    │
    │ 4. Return to client                     │    │
    └──────────────────┬──────────────────────┘    │
                       │                            │
                       ▼                            │
      ┌────────────────────────────────────────┐   │
      │         SERVICE LAYER                  │   │
      ├────────────────────────────────────────┤   │
      │ 1. Business logic                      │   │
      │ 2. Data validation                     │   │
      │ 3. Call Repositories                   │   │
      │ 4. Combine results                     │   │
      │ 5. Handle errors                       │   │
      └──────────────────┬───────────────────┘   │
                         │                        │
                         ▼                        │
       ┌──────────────────────────────────────┐  │
       │       REPOSITORY LAYER               │  │
       ├──────────────────────────────────────┤  │
       │ 1. CRUD operations                   │  │
       │ 2. Database queries                  │  │
       │ 3. Data mapping                      │  │
       │ 4. No business logic                 │  │
       └──────────────────┬───────────────────┘  │
                          │                       │
                          ▼                       │
           ┌──────────────────────────────┐      │
           │      DATABASE                │      │
           ├──────────────────────────────┤      │
           │ - Users table                │      │
           │ - Profiles table             │      │
           │ - Cycles table               │      │
           │ - Medications table          │      │
           │ - Symptoms table             │      │
           │ - Reminders table            │      │
           │ - etc...                     │      │
           └──────────────────┬───────────┘      │
                              │                   │
                              ▼                   │
                   ┌──────────────────┐          │
                   │ Database Result  │          │
                   └────────┬─────────┘          │
                            │                    │
              ┌─────────────┴────────────┐       │
              │ Return to Service        │       │
              │ Return to Controller     │       │
              │ Format Response          │       │
              └──────────────┬───────────┘       │
                             │                   │
              ┌──────────────┴──────────────────┐│
              │ SEND RESPONSE TO CLIENT        ││
              │ JSON { success, data, ... }    ││
              │ OR ERROR { error, code, ... }  ◄┘
              └─────────────────────────────────┘
*/

/**
 * ============================================================================
 * LAYER RESPONSIBILITIES
 * ============================================================================
 */

/*
┌────────────────────────────────────────────────────────────────────────┐
│                        MIDDLEWARE LAYER                                │
├────────────────────────────────────────────────────────────────────────┤
│ RESPONSIBILITY: Request preprocessing                                 │
│ WHAT IT DOES:                                                         │
│  • Validates input against schemas                                    │
│  • Verifies JWT authentication tokens                                 │
│  • Checks user permissions & roles                                    │
│  • Catches and formats errors                                         │
│ WHO TOUCHES IT:                                                        │
│  • Middleware authors                                                 │
│  • Security engineers                                                 │
│ WHO USES IT:                                                           │
│  • Every controller (middleware chaining)                             │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                      CONTROLLER/ROUTE LAYER                            │
├────────────────────────────────────────────────────────────────────────┤
│ RESPONSIBILITY: HTTP handling only                                     │
│ WHAT IT DOES:                                                         │
│  • Parse request (req.body, req.params, etc.)                        │
│  • Call appropriate service method                                    │
│  • Format response (JSON, status codes)                               │
│  • Send response to client                                            │
│ WHAT IT DOESN'T DO:                                                   │
│  • ✗ Business logic                                                   │
│  • ✗ Database queries                                                │
│  • ✗ Data validation (done in middleware)                            │
│ WHO WRITES IT:                                                         │
│  • Backend developers                                                 │
│ HOW MANY LINES?                                                        │
│  • Typically 5-15 lines per endpoint                                 │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER                                   │
├────────────────────────────────────────────────────────────────────────┤
│ RESPONSIBILITY: Business logic                                         │
│ WHAT IT DOES:                                                         │
│  • Validates data (deeper validation)                                │
│  • Orchestrates operations (calls multiple repos)                    │
│  • Applies business rules                                            │
│  • Transforms data                                                   │
│  • Handles domain logic                                              │
│ WHAT IT DOESN'T TOUCH:                                                │
│  • ✗ Request objects (req, res)                                      │
│  • ✗ Database directly (uses repositories)                          │
│  • ✗ HTTP stuff                                                      │
│ WHO WRITES IT:                                                         │
│  • Business logic experts                                             │
│  • Backend architects                                                 │
│ TESTABILITY:                                                           │
│  • Highly testable (mock repositories)                               │
│ REUSABILITY:                                                           │
│  • One service = multiple controllers                                │
│  • Services can call other services                                  │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                      REPOSITORY LAYER                                  │
├────────────────────────────────────────────────────────────────────────┤
│ RESPONSIBILITY: Data access abstraction                                │
│ WHAT IT DOES:                                                         │
│  • CRUD operations (Create, Read, Update, Delete)                    │
│  • SQL query building                                                │
│  • Data mapping (DB → TypeScript objects)                            │
│  • Connection management                                             │
│ WHAT IT DOESN'T DO:                                                   │
│  • ✗ Business logic                                                   │
│  • ✗ Validation (that's service job)                                 │
│  • ✗ HTTP stuff                                                      │
│ WHO WRITES IT:                                                         │
│  • Database experts                                                   │
│  • ORM/Query builders                                                │
│ BENEFIT:                                                               │
│  • Easy to swap database (SQLite ↔ MSSQL ↔ PostgreSQL)              │
│  • Testable with in-memory databases                                 │
└────────────────────────────────────────────────────────────────────────┘
*/

/**
 * ============================================================================
 * FILE DEPENDENCY GRAPH
 * ============================================================================
 */

/*
USER MAKING REQUEST
    │
    ▼
 [Express Router]
    │
    ├──> [Middleware Chain]
    │    ├──> auth.middleware.ts
    │    ├──> authorization.middleware.ts
    │    ├──> validation.middleware.ts
    │    └──> error-handler.middleware.ts
    │
    ├──> [Controller/Route Handler]
    │    └──> Calls Service
    │
    ├──> [Service Layer]
    │    ├──> user.service.ts
    │    ├──> profile.service.ts
    │    ├──> cycle.service.ts
    │    └──> Calls Repositories
    │
    ├──> [Repository Layer]
    │    ├──> base.repository.ts (abstract)
    │    ├──> user.repository.ts
    │    ├──> profile.repository.ts
    │    └──> Calls Database
    │
    ├──> [Utilities]
    │    ├──> jwt.util.ts
    │    ├──> password.util.ts
    │    └──> error.util.ts
    │
    ├──> [DTOs]
    │    └──> Type checking & validation
    │
    ├──> [Constants]
    │    ├──> http-status.ts
    │    ├──> error-messages.ts
    │    └──> database.config.ts
    │
    └──> [Database]
         └──> Persistent Storage
*/

/**
 * ============================================================================
 * MIDDLEWARE EXECUTION ORDER
 * ============================================================================
 */

/*
REQUEST comes in
    ↓
1️⃣  Body Parser Middleware
    (Built-in express.json())
    Converts raw JSON to req.body object
    ↓
2️⃣  Validation Middleware
    (validate(schema) from validation.middleware.ts)
    Checks if data matches schema
    ❌ If invalid → 400 Bad Request
    ✅ If valid → Continue
    ↓
3️⃣  Auth Middleware
    (authMiddleware from auth.middleware.ts)
    Extracts JWT from Authorization header
    Verifies token signature & expiration
    ❌ If missing/invalid → 401 Unauthorized
    ✅ If valid → Attach user to request
    ↓
4️⃣  Authorization Middleware
    (authorize(), ownsResource() from authorization.middleware.ts)
    Checks if user has permission
    Verifies resource ownership
    ❌ If denied → 403 Forbidden
    ✅ If allowed → Continue
    ↓
5️⃣  Async Handler
    (asyncHandler() from error-handler.middleware.ts)
    Wraps route handler to catch errors
    Any error thrown → Passes to error handler
    ↓
6️⃣  Route Handler
    (Your controller)
    Business logic execution
    ↓
7️⃣  Error Handler Middleware
    (errorHandler from error-handler.middleware.ts)
    Catches any errors from above
    Formats consistent error response
    ✅ Sends response to client
*/

/**
 * ============================================================================
 * EXAMPLE: REGISTER USER REQUEST
 * ============================================================================
 */

/*
REQUEST:
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "username": "john_doe",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}

MIDDLEWARE CHAIN:
1. Validation Middleware
   ├─ Check: email is valid email format ✓
   ├─ Check: username length >= 3 ✓
   ├─ Check: password length >= 8 ✓
   └─ Continue to next middleware

2. Auth Middleware
   └─ Not needed (public endpoint) - skipped

3. Authorization Middleware
   └─ Not needed (public endpoint) - skipped

4. Route Handler Calls Service
   └─ userService.register({...})

SERVICE LAYER - userService.register()
1. Validate passwords match
   ├─ confirmPassword === password ✓
   └─ Continue

2. Check if email exists
   ├─ userRepository.emailExists('user@example.com')
   ├─ Database query: SELECT * FROM users WHERE email = ?
   └─ Not found ✓

3. Check if username exists
   ├─ userRepository.usernameExists('john_doe')
   ├─ Database query: SELECT * FROM users WHERE username = ?
   └─ Not found ✓

4. Hash password
   ├─ PasswordUtil.hash('SecurePass123!')
   └─ Returns: $2a$10$...hashed...

5. Create user in database
   ├─ userRepository.create({
   │    email: 'user@example.com',
   │    username: 'john_doe',
   │    password: '$2a$10$...hashed...',
   │    createdAt: 2026-01-26
   │  })
   └─ Returns: User object with id=1

6. Generate tokens
   ├─ JwtUtil.sign({id:1, email:'user@example.com'}, secret, '24h')
   ├─ Returns: accessToken = 'eyJhbGciOi...'
   └─ Returns: refreshToken = 'eyJhbGciOi...'

7. Sanitize user (remove password)
   └─ Returns: { id: 1, email: '...', username: '...', createdAt: '...' }

RESPONSE:
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "john_doe",
      "createdAt": "2026-01-26T10:30:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  },
  "message": "User registered successfully",
  "statusCode": 201,
  "timestamp": "2026-01-26T10:30:00Z"
}
*/

/**
 * ============================================================================
 * TESTING FLOW
 * ============================================================================
 */

/*
UNIT TEST (Service)
├─ Mock UserRepository
│  └─ Mock methods: findByEmail, create, emailExists
├─ Create UserService instance (inject mock repo)
├─ Call service.register({...})
├─ Assert:
│  ├─ userRepository.create was called once
│  ├─ Returned user has no password field
│  ├─ Tokens are generated
│  └─ Service didn't throw
└─ Mock cleaned up

INTEGRATION TEST (Route)
├─ Start Express server
├─ Create test database
├─ POST /api/v1/auth/register
├─ Assert:
│  ├─ Response status = 201
│  ├─ Response has success = true
│  ├─ User stored in database
│  ├─ Tokens can verify with secret
│  └─ Password is hashed (not plain text)
└─ Clean up test data

E2E TEST (Full flow)
├─ Start server
├─ Make HTTP request to register endpoint
├─ Verify response is received
├─ Login with created credentials
├─ Verify tokens work
├─ Make authenticated request
└─ Verify it succeeds
*/

/**
 * ============================================================================
 * ERROR FLOW
 * ============================================================================
 */

/*
REQUEST: POST /api/v1/auth/register
  Body: { email: "invalid-email", password: "short" }

VALIDATION MIDDLEWARE
  ❌ Email format invalid
  → Throw AppError('Email is invalid', 400)
  → Error handler catches it
  → Send: { success: false, error: 'Email is invalid', code: 'BAD_REQUEST', statusCode: 400 }

REQUEST: POST /api/v1/auth/login
  Headers: Authorization: Bearer invalid_token

AUTH MIDDLEWARE
  ❌ Token signature doesn't match secret
  → Catch JsonWebTokenError
  → Throw AppError('Invalid token', 401)
  → Error handler catches it
  → Send: { success: false, error: 'Invalid token', code: 'AUTH_ERROR', statusCode: 401 }

REQUEST: POST /api/v1/users/1/change-password
  Authenticated as user ID 5
  URL: /api/v1/users/1/change-password

AUTHORIZATION MIDDLEWARE (ownsResource)
  ❌ User 5 trying to change user 1's password
  → Throw AppError('You do not have permission', 403)
  → Error handler catches it
  → Send: { success: false, error: 'You do not have permission', code: 'FORBIDDEN', statusCode: 403 }

UNHANDLED ERROR in Service
  Service: userRepository.findByEmail() throws database connection error

ERROR HANDLER MIDDLEWARE
  ✓ Catches unhandled error
  ✓ Detects it's a database error
  ✓ Logs full error for debugging
  ✓ Sends safe message to client
  → Send: { success: false, error: 'Database operation failed', code: 'DATABASE_ERROR', statusCode: 500 }
*/

export { };

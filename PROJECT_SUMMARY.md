# **Bloom Hope Project - Comprehensive Summary**

## **🎯 Project Overview**
**Bloom Hope** is a comprehensive breast health companion application designed to empower women through their breast health journey - whether they're focused on prevention, currently fighting cancer, or are survivors.

---

## **🛠️ Technology Stack**

### **Frontend**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Shadcn/ui (Radix UI components)
- **Styling**: Tailwind CSS + Custom CSS
- **State Management**: 
  - React Context (AuthContext, ThemeContext)
  - TanStack Query (React Query) for data fetching
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **Internationalization**: i18next (Arabic & English)
- **Maps**: Google Maps API (@react-google-maps/api)
- **Icons**: Lucide React
- **UI Components**: 
  - Carousels (Embla Carousel)
  - Date handling (date-fns)
  - Toast notifications (Sonner + Radix Toast)
  - Tooltips, dialogs, accordions, select menus, etc.
- **HTTP Client**: Axios
- **Utilities**: clsx, class-variance-authority, cmdk

### **Backend**
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite3
- **AI Integration**: Google Gemini AI (@google/genai v1.29.0)
- **Authentication**: JWT (jsonwebtoken) + bcryptjs for password hashing
- **CORS Enabled**: Cross-origin support
- **Dev Tools**: ts-node-dev for hot reloading
- **Environment**: dotenv for configuration

---

## **👥 User Types**

The app supports three distinct user journeys:

1. **Fighter** 🌸 - Women currently undergoing breast cancer treatment
2. **Survivor** ✨ - Women who have completed treatment
3. **Wellness** 🛡️ - Health-conscious women focused on prevention

Each user type receives personalized content, features, and AI guidance tailored to their specific needs and journey stage.

---

## **📱 Pages & Features**

### **Authentication Flow**

#### **Public Pages:**
1. **Welcome Page** (`/`) 
   - Landing page introducing the Bloom Hope app
   - Entry point for new users
   
2. **Register** (`/register`) 
   - User type selection with visual cards:
     - Fighter: Heart icon with rose-pink gradient
     - Survivor: Sparkles icon with gold-yellow gradient
     - Wellness: Shield icon with primary-rose gradient
   - Form fields:
     - Full Name
     - Email address
     - Password (minimum 6 characters)
     - Confirm Password
     - Language preference (Arabic/English)
   - Real-time validation
   - Account creation with secure password hashing
   - Automatic login after registration
   
3. **Login** (`/login`)
   - Email/password authentication
   - JWT token-based session management
   - Remember user session in localStorage
   - Automatic redirect to user-specific dashboard
   - "Forgot Password" support
   
4. **Onboarding** (`/onboarding`) 
   - First-time user orientation
   - Feature introduction
   - App walkthrough

### **Protected Pages** 
*All routes include `/:userType` parameter (fighter/survivor/wellness)*

#### **Dashboard & Profile**
- **Dashboard** (`/dashboard/:userType`)
  - Personalized main hub based on user type
  - Quick access to all features
  - Health metrics overview
  - Recent activity feed
  - Upcoming reminders and appointments
  
- **Profile** (`/profile/:userType`)
  - User information management
  - Account settings
  - Language preferences
  - Privacy settings
  - Profile updates
  
- **Reminders** (`/reminders/:userType`)
  - Medication reminders with schedules
  - Appointment notifications
  - Self-exam reminders
  - Custom reminder creation
  - Reminder history and tracking

#### **Health Features**

- **Health Questionnaire** (`/questionnaire/:userType`)
  - Initial comprehensive health assessment
  - Medical history collection
  - Current health status
  - Risk factors evaluation
  - Personalized recommendations based on responses
  
- **AI Health Assistant** (`/ai-assistant/:userType`)
  - Intelligent chatbot powered by Google Gemini AI
  - **Core Capabilities:**
    - Medical report analysis (OCR + NLP)
    - Symptom categorization (Normal/Monitoring/High Risk)
    - Personalized guidance per user type
    - Medical term simplification
    - Health questions and answers
  - **Features:**
    - Bilingual support (Arabic/English)
    - Empathetic, supportive tone
    - Evidence-based medical information
    - Medical disclaimers on all advice
    - Conversation history
    - Voice input support (planned)
  
- **Health Tracker** (`/health-tracker/:userType`)
  - Symptom logging and monitoring
  - Menstrual cycle tracking (for Wellness users)
  - Self-examination records
  - Medication adherence tracking
  - Progress visualization with charts
  - Export health data
  
- **Medical Centers** (`/medical-centers/:userType`)
  - Interactive Google Maps integration
  - Find nearby hospitals and clinics
  - Specialized breast cancer centers
  - Filter by services offered
  - Contact information and directions
  - User reviews and ratings

#### **Wellness Features**

- **Nutrition Plan** (`/nutrition-plan/:userType`)
  - Hormonal-balancing meal plans
  - Anti-inflammatory diet recommendations
  - Calorie and macro tracking
  - Recipe suggestions
  - Shopping lists
  - Dietary restrictions support
  - Personalized for cancer treatment/recovery
  
- **Mental Wellness** (`/mental-wellness/:userType`)
  - Psychological support resources
  - Coping strategies for anxiety and stress
  - Mood tracking
  - Journaling prompts
  - Support group connections
  - Crisis resources
  - Professional therapist directory
  
- **Meditation** (`/meditation/:userType`)
  - Guided meditation sessions
  - Breathing exercises
  - Relaxation techniques
  - Sleep support
  - Pain management through mindfulness
  - Progress tracking

#### **Education**

- **Educational Hub** (`/educational-hub/:userType`)
  - Comprehensive breast health information
  - Cancer stages and types
  - Treatment options explained
  - Side effects management
  - Latest research and clinical trials
  - Survivor stories and testimonials
  - FAQ section
  
- **Exercise Guide** (`/exercise-guide/:userType`)
  - Post-surgery exercise programs
  - Lymphedema prevention techniques
  - Strength building routines
  - Flexibility exercises
  - Video demonstrations
  - Progress tracking
  - Physical therapy recommendations

#### **404 & Error Handling**
- **Not Found Page** (`/404` and `*`)
  - Custom 404 page
  - Navigation back to appropriate dashboard
  - Search functionality

---

## **🔐 Authentication & Sign-In Flow**

### **Registration Process:**
```
1. User visits /register
2. Views three user type cards with descriptions
3. Selects user type (Fighter/Survivor/Wellness)
4. Fills registration form:
   - Name
   - Email (validated format)
   - Password (minimum 6 characters)
   - Confirm Password (must match)
   - Language preference (Arabic/English)
5. Form validation occurs client-side
6. Submits to POST /api/users/register
7. Backend:
   - Validates input data
   - Checks for existing email
   - Hashes password with bcryptjs (salt rounds: 10)
   - Creates user record in database
   - Generates JWT token (expires: 30 days)
   - Returns user data + token
8. Frontend:
   - Stores token in localStorage (key: 'hopebloom_auth')
   - Updates AuthContext with user data
   - Shows success toast notification
9. Redirects to /questionnaire/:userType
```

### **Login Process:**
```
1. User visits /login
2. Enters email + password
3. Submits to POST /api/users/login
4. Backend:
   - Finds user by email
   - Compares password hash with bcrypt
   - Validates credentials
   - Generates new JWT token
   - Returns user data + token
5. Frontend:
   - Stores token in localStorage
   - Updates AuthContext with user session
   - Shows welcome back toast
6. Redirects to /dashboard/:userType
```

### **Session Management:**
- **Storage**: JWT tokens stored in `localStorage` under key `hopebloom_auth`
- **Token Structure**: Contains user ID, email, userType, language
- **Token Expiry**: 30 days (configurable)
- **API Requests**: Token automatically included in Authorization header
- **Axios Interceptor**: Attaches bearer token to all API calls
- **Protected Routes**: `ProtectedRoute` component checks authentication
- **Auto-redirect**: 
  - Logged-in users accessing /login or /register → redirect to dashboard
  - Non-authenticated users accessing protected routes → redirect to /login
- **Logout**: Clears localStorage and resets AuthContext

### **Security Features:**
- Password hashing with bcryptjs
- JWT-based stateless authentication
- CORS protection
- Input validation on both client and server
- SQL injection prevention with parameterized queries
- XSS protection
- HTTPS recommended for production

---

## **🤖 AI Features (Google Gemini Integration)**

### **System Prompt & Personality:**
The AI is configured as the "HopeBloom AI Health Companion" with:
- **Mission**: Empower women to "know, heal, and bloom with hope"
- **Tone**: Empathetic, supportive, calming, and encouraging
- **Medical Accuracy**: Based on WHO, Mayo Clinic, Egyptian Ministry of Health
- **Cultural Sensitivity**: Middle Eastern and North African context

### **Core AI Capabilities:**

1. **Medical Report Analysis**
   - OCR and NLP to parse complex reports
   - Simplifies ultrasound and mammogram results
   - Translates medical jargon to patient-friendly language
   - Highlights key findings
   - Suggests questions to ask doctors

2. **Symptom Categorization**
   - Analyzes patient-written symptoms (Arabic/English)
   - Risk classification:
     - **Normal**: Common, non-concerning symptoms
     - **Requires Monitoring**: Track and mention at next appointment
     - **High Risk**: Requires immediate medical attention
   - Provides explanation and recommended actions
   - Clarifying questions about duration and severity

3. **Personalized Guidance**
   - **Fighter Mode**: Treatment support, side effect management, emotional support
   - **Survivor Mode**: Recovery guidance, recurrence prevention, lifestyle optimization
   - **Wellness Mode**: Prevention strategies, early detection, healthy habits

4. **Holistic Wellness Support**
   - Hormonal-balancing nutrition recommendations
   - Post-surgery exercises for lymphedema prevention
   - Psychological coping strategies
   - Stress management techniques
   - Sleep hygiene tips

5. **Logistical Support**
   - Smart reminder suggestions for medications
   - Self-exam scheduling guidance
   - Doctor appointment preparation
   - Treatment timeline tracking

6. **Menstrual Cycle Prediction** (Wellness users)
   - AI-powered cycle forecasting
   - Ovulation prediction
   - Fertility window calculation
   - Symptom pattern recognition

### **Safety & Disclaimers:**
Every AI response includes:
```
⚕️ This guidance is for informational purposes only and does not replace 
professional medical advice. Please consult with your healthcare provider 
for personalized medical decisions.
```

### **Language Support:**
- Fully bilingual (Arabic & English)
- Responds in user's language
- Maintains cultural sensitivity
- Medical terminology in both languages

---

## **🌐 Backend API Endpoints**

### **User Management**
- `POST /api/users/register` - Create new user account
- `POST /api/users/login` - Authenticate user
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user information
- `DELETE /api/users/:id` - Delete user account

### **Profile Management**
- `POST /api/profiles` - Create user health profile
- `GET /api/profiles/:userId` - Get user profile
- `PUT /api/profiles/:userId` - Update profile

### **Health Tracking**
- `GET /api/symptoms/:userId` - Get symptom history
- `POST /api/symptoms` - Log new symptom
- `PUT /api/symptoms/:id` - Update symptom entry
- `DELETE /api/symptoms/:id` - Delete symptom

- `GET /api/cycles/:userId` - Get menstrual cycles
- `POST /api/cycles` - Log new cycle
- `PUT /api/cycles/:id` - Update cycle
- `DELETE /api/cycles/:id` - Delete cycle

- `GET /api/self-exams/:userId` - Get self-exam records
- `POST /api/self-exams` - Log new self-exam

### **Medication Management**
- `GET /api/medications/:userId` - Get user medications
- `POST /api/medications` - Add new medication
- `PUT /api/medications/:id` - Update medication
- `DELETE /api/medications/:id` - Remove medication

- `GET /api/medication-logs/:medicationId` - Get medication logs
- `GET /api/medication-logs/user/:userId` - Get all user med logs
- `POST /api/medication-logs` - Log medication intake

### **AI Services**
- `POST /api/ai` - AI chatbot conversation
- `GET /api/ai/:userId/history` - Get conversation history
- `POST /api/ai-cycle/predict` - AI cycle prediction

### **Reminders**
- `GET /api/reminders/:userId` - Get user reminders
- `POST /api/reminders` - Create new reminder
- `PUT /api/reminders/:id` - Update reminder
- `DELETE /api/reminders/:id` - Delete reminder

### **Journal & Progress**
- `GET /api/journal/:userId` - Get journal entries
- `GET /api/journal/:userId/:entryId` - Get specific entry
- `POST /api/journal` - Create journal entry
- `PUT /api/journal/:entryId` - Update entry
- `DELETE /api/journal/:entryId` - Delete entry

- `GET /api/progress/:userId` - Get progress data
- `GET /api/progress/:userId/activity/:activityType` - Filter by activity
- `POST /api/progress` - Log progress

### **Reports & Questionnaire**
- `GET /api/reports/:userId` - Generate health reports
- `POST /api/questionnaire` - Submit questionnaire
- `GET /api/questionnaire/:userId` - Get questionnaire responses

### **Health Check**
- `GET /health` - Server health check endpoint

---

## **🎨 UI/UX Features**

### **Design System**
- **Colors**: 
  - Primary gradient: Rose to pink
  - Fighter: Rose-pink gradient
  - Survivor: Gold-yellow gradient
  - Wellness: Primary-rose gradient
- **Typography**: Clean, readable fonts optimized for Arabic and English
- **Spacing**: Consistent 8px grid system
- **Border Radius**: Soft, rounded corners for approachability

### **Accessibility**
- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader friendly
- High contrast mode support
- Focus indicators
- Semantic HTML

### **Responsive Design**
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly tap targets (minimum 44x44px)
- Responsive typography
- Adaptive layouts

### **Internationalization (i18n)**
- Full RTL (Right-to-Left) support for Arabic
- Language switcher in navigation
- Translated UI strings in JSON files
- Date/time localization
- Number formatting per locale

### **Theme System**
- Light/Dark mode toggle
- System preference detection
- Persistent theme preference
- Smooth theme transitions
- Theme-aware components

### **User Feedback**
- Toast notifications (Sonner + Radix)
- Loading states with skeletons
- Progress indicators
- Success/error messages
- Confirmation dialogs
- Empty states with helpful messaging

### **Performance**
- Code splitting by route
- Lazy loading of components
- Image optimization
- React Query caching
- Debounced inputs
- Virtual scrolling for long lists

---

## **🗄️ Database Structure (SQLite)**

### **Tables:**

#### **users**
- id (PRIMARY KEY)
- username
- email (UNIQUE)
- password_hash
- user_type (fighter/survivor/wellness)
- language (ar/en)
- created_at
- updated_at

#### **profiles**
- id (PRIMARY KEY)
- user_id (FOREIGN KEY → users.id)
- age
- weight
- height
- medical_history (JSON)
- risk_factors (JSON)
- preferences (JSON)
- created_at
- updated_at

#### **symptoms**
- id (PRIMARY KEY)
- user_id (FOREIGN KEY → users.id)
- symptom_type
- severity (1-10)
- description
- risk_level (normal/monitoring/high)
- date
- created_at

#### **cycles** (for Wellness users)
- id (PRIMARY KEY)
- user_id (FOREIGN KEY → users.id)
- start_date
- end_date
- cycle_length
- flow_intensity
- symptoms (JSON)
- notes
- created_at

#### **self_exams**
- id (PRIMARY KEY)
- user_id (FOREIGN KEY → users.id)
- exam_date
- findings (JSON)
- notes
- follow_up_needed (BOOLEAN)
- created_at

#### **medications**
- id (PRIMARY KEY)
- user_id (FOREIGN KEY → users.id)
- medication_name
- dosage
- frequency
- start_date
- end_date
- notes
- created_at

#### **medication_logs**
- id (PRIMARY KEY)
- medication_id (FOREIGN KEY → medications.id)
- taken_at
- status (taken/missed/skipped)
- notes
- created_at

#### **reminders**
- id (PRIMARY KEY)
- user_id (FOREIGN KEY → users.id)
- reminder_type (medication/appointment/self-exam/custom)
- title
- description
- scheduled_time
- frequency (once/daily/weekly/monthly)
- is_active (BOOLEAN)
- created_at
- updated_at

#### **journal**
- id (PRIMARY KEY)
- user_id (FOREIGN KEY → users.id)
- entry_date
- mood
- content
- tags (JSON)
- created_at
- updated_at

#### **progress**
- id (PRIMARY KEY)
- user_id (FOREIGN KEY → users.id)
- activity_type (exercise/nutrition/meditation/treatment)
- metric_name
- metric_value
- unit
- recorded_at
- notes

#### **questionnaire_responses**
- id (PRIMARY KEY)
- user_id (FOREIGN KEY → users.id)
- responses (JSON)
- score
- recommendations (JSON)
- completed_at

#### **ai_conversations**
- id (PRIMARY KEY)
- user_id (FOREIGN KEY → users.id)
- message
- response
- conversation_id (for threading)
- created_at

---

## **🚀 Development & Deployment**

### **Frontend Setup:**
```bash
cd frontend
npm install
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### **Backend Setup:**
```bash
cd server
npm install
npm run dev          # Start with hot reload (port 4000)
npm run build        # Compile TypeScript
npm start            # Run production build
npm run migrate      # Run database migrations
```

### **Environment Variables:**

#### Frontend (`.env`):
```
VITE_API_BASE_URL=http://localhost:4000/api
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
```

#### Backend (`.env`):
```
PORT=4000
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_google_gemini_key
DATABASE_PATH=./data/bloomhope.db
NODE_ENV=development
```

### **Database Setup:**
```bash
# Initialize database
cd server
node src/scripts/setupDbDirect.js

# Run migrations
npm run migrate
```

### **Production Deployment Checklist:**
- [ ] Set NODE_ENV=production
- [ ] Use strong JWT_SECRET
- [ ] Configure HTTPS
- [ ] Set up database backups
- [ ] Configure CORS for production domain
- [ ] Enable compression middleware
- [ ] Set up logging (Winston/Morgan)
- [ ] Configure rate limiting
- [ ] Set up monitoring (PM2/New Relic)
- [ ] Configure CDN for static assets
- [ ] Database connection pooling
- [ ] Error tracking (Sentry)

### **Port Configuration:**
- **Frontend Dev**: Port 5173 (Vite default)
- **Backend**: Port 4000 (configurable)
- **Production**: Use reverse proxy (Nginx/Apache)

### **Testing:**
- Unit tests: Jest + React Testing Library (planned)
- E2E tests: Playwright/Cypress (planned)
- API tests: Supertest (planned)

---

## **📊 Key Differentiators**

1. **Culturally Adapted**: Designed specifically for Middle East/North Africa region
2. **Bilingual**: Native Arabic and English support with RTL
3. **AI-Powered**: Google Gemini integration for intelligent health guidance
4. **Personalized Journey**: Three distinct user paths (Fighter/Survivor/Wellness)
5. **Holistic Approach**: Combines physical health, nutrition, mental wellness, and education
6. **Privacy-Focused**: Local SQLite database, secure authentication
7. **Comprehensive**: All-in-one platform from prevention to survivorship
8. **Empathetic Design**: Supportive tone, encouraging language, hope-focused

---

## **🎯 Target Audience**

- **Primary**: Women aged 18-65 in Middle East/North Africa
- **Secondary**: Healthcare providers supporting breast cancer patients
- **Tertiary**: Family members and caregivers

---

## **📈 Future Enhancements (Roadmap)**

- [ ] Telemedicine integration
- [ ] Community forums and support groups
- [ ] Wearable device integration
- [ ] Voice assistant (Alexa/Google Home)
- [ ] Mobile apps (iOS/Android - React Native)
- [ ] Healthcare provider portal
- [ ] Insurance integration
- [ ] Genetic risk assessment
- [ ] Clinical trial matching
- [ ] Appointment booking system
- [ ] Prescription management
- [ ] Lab results integration
- [ ] Push notifications
- [ ] Offline mode with sync
- [ ] Data export (PDF reports)

---

## **📝 License & Credits**

**Project**: Bloom Hope - Breast Health Companion
**Version**: 1.0.0
**Last Updated**: January 31, 2026

**Technologies Used**:
- React, TypeScript, Vite
- Express.js, Node.js
- SQLite
- Google Gemini AI
- Shadcn/ui, Tailwind CSS
- React Query, React Router
- i18next for internationalization

---

## **💡 Development Notes**

### **Code Organization:**
- **Frontend**: Component-based architecture with custom hooks
- **Backend**: Layered architecture (Routes → Controllers → Services → Repositories)
- **Database**: Repository pattern for data access
- **AI**: Service layer with Gemini client abstraction

### **Best Practices:**
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting (configured)
- Git branching strategy (feature/fix/release)
- Conventional commits
- Code review process

### **Performance Considerations:**
- React Query for efficient data fetching and caching
- Lazy loading of routes and components
- Debounced search and input fields
- Optimized re-renders with useMemo/useCallback
- Virtual scrolling for large lists
- Image lazy loading

---

**Built with ❤️ for women's health empowerment**

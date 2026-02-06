# Camera-Based Exercise Evaluation System - Implementation Guide

## Overview
A complete pose detection and exercise evaluation system for Bloom Hope that allows doctors to create reference exercises and patients to perform exercises with real-time feedback and scoring.

## 🎯 Key Features

✅ **Doctor Dashboard**
- Upload reference exercise videos (5-15 seconds)
- Automatic pose extraction using MediaPipe
- Configure exercise parameters (reps, tolerance, difficulty)
- View patient performance and trends
- Review evaluations and provide feedback

✅ **Patient Interface**
- Real-time camera pose detection
- Live feedback with skeleton overlay
- Rep counting and progress tracking
- Pain/fatigue self-reporting
- Exercise history and progress dashboard

✅ **Pose Detection Engine**
- MediaPipe Pose integration (client-side)
- Angle calculation for major joints
- Similarity scoring algorithm
- Stability measurement
- Real-time feedback generation

✅ **Privacy & Safety**
- No video storage (only pose landmarks)
- Consent modal before camera access
- Manual exercise option without camera
- Safety warnings throughout
- Doctor review system

## 📦 Installation & Setup

### Backend Setup

#### 1. Install Dependencies
```bash
cd server
npm install better-sqlite3 @mediapipe/tasks-vision
npm install --save-dev @types/jest jest ts-jest
```

#### 2. Create Database Tables
```bash
npm run ts-node src/scripts/create-exercise-tables.ts
```

This creates:
- `exercises` table with reference pose data
- `exercise_evaluations` table with patient results
- Necessary indexes for performance

#### 3. Register Routes in `server/src/index.ts`

```typescript
import exerciseRoutes from './routes/exerciseEvaluation';

// Add to your Express app:
app.use('/api/exercises', exerciseRoutes);
```

#### 4. Update Middleware (if needed)
The system uses:
- `authMiddleware` - Authentication required
- Role-based access control (doctors vs patients)

### Frontend Setup

#### 1. Install Dependencies
```bash
cd frontend
npm install @mediapipe/tasks-vision recharts
```

#### 2. Add Components to Your Project
Copy these files to your `frontend/src/`:

**Components:**
- `components/wellness/ExerciseUpload.tsx` - Doctor exercise upload
- `components/wellness/ExerciseCamera.tsx` - Patient exercise camera
- `components/wellness/PatientExerciseResults.tsx` - Patient progress view
- `components/dashboard/DoctorExerciseDashboard.tsx` - Doctor dashboard

**Hooks:**
- `hooks/usePoseDetection.ts` - MediaPipe integration

**Utilities:**
- `lib/pose-utils.ts` - Pose processing utilities
- `types/exercise.types.ts` - TypeScript types

#### 3. Update Navigation
Add routes in your routing config:

```typescript
// Doctor routes
<Route path="/dashboard/exercises" element={<DoctorExerciseDashboard />} />
<Route path="/exercises/create" element={<ExerciseUpload />} />

// Patient routes
<Route path="/exercises/:id" element={<ExerciseCamera />} />
<Route path="/exercises/results" element={<PatientExerciseResults />} />
```

## 🏗️ Architecture

### Backend Structure

```
server/src/
├── dtos/
│   └── exercise.dto.ts           # Data transfer objects
├── types/
│   └── mediapipe.types.ts        # MediaPipe type definitions
├── utils/
│   └── pose-comparison.ts        # Core pose comparison logic
├── repositories/
│   ├── exercise.repository.ts    # Exercise database operations
│   └── evaluation.repository.ts  # Evaluation database operations
├── services/
│   ├── exercise.service.ts       # Exercise business logic
│   └── evaluation.service.ts     # Evaluation logic
├── routes/
│   └── exerciseEvaluation.ts    # API endpoints
└── scripts/
    └── create-exercise-tables.ts # Database migrations
```

### Frontend Structure

```
frontend/src/
├── components/
│   ├── wellness/
│   │   ├── ExerciseUpload.tsx      # Doctor upload interface
│   │   ├── ExerciseCamera.tsx      # Patient camera interface
│   │   └── PatientExerciseResults.tsx
│   └── dashboard/
│       └── DoctorExerciseDashboard.tsx
├── hooks/
│   └── usePoseDetection.ts         # Pose detection hook
├── lib/
│   └── pose-utils.ts              # Utility functions
└── types/
    └── exercise.types.ts          # TypeScript interfaces
```

## 📊 Database Schema

### exercises table
```sql
CREATE TABLE exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  created_by INTEGER NOT NULL,
  reference_pose TEXT NOT NULL,        -- JSON
  expected_reps INTEGER DEFAULT 1,
  hold_seconds INTEGER DEFAULT 0,
  tolerance INTEGER DEFAULT 15,        -- Angle tolerance
  difficulty_level TEXT DEFAULT 'medium',
  target_body_part TEXT,
  instructions TEXT,
  instructions_ar TEXT,
  warnings TEXT,                       -- JSON array
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### exercise_evaluations table
```sql
CREATE TABLE exercise_evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise_id INTEGER NOT NULL,
  patient_id INTEGER NOT NULL,
  session_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Performance metrics
  score INTEGER NOT NULL,              -- 0-100
  accuracy REAL NOT NULL,              -- Percentage
  reps_completed INTEGER DEFAULT 0,
  reps_expected INTEGER NOT NULL,
  
  -- Quality breakdown (score components)
  angle_score REAL DEFAULT 0,          -- 0-40
  rep_score REAL DEFAULT 0,            -- 0-30
  stability_score REAL DEFAULT 0,      -- 0-20
  completion_score REAL DEFAULT 0,     -- 0-10
  
  -- Data
  patient_pose TEXT,                   -- JSON (simplified keyframes)
  warnings TEXT,                       -- JSON array
  has_alerts BOOLEAN DEFAULT 0,
  
  -- Feedback
  pain_level INTEGER DEFAULT 0,        -- 0-10
  fatigue_level INTEGER DEFAULT 0,     -- 0-10
  patient_notes TEXT,
  
  -- Doctor review
  doctor_reviewed BOOLEAN DEFAULT 0,
  doctor_notes TEXT,
  doctor_id INTEGER,
  reviewed_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id),
  FOREIGN KEY (patient_id) REFERENCES users(id),
  FOREIGN KEY (doctor_id) REFERENCES users(id)
);
```

## 🔄 Data Flow

### 1. Doctor Creates Exercise
```
1. Doctor uploads video → Frontend processes with MediaPipe
2. Poses extracted at 30 fps
3. Angles calculated for key joints
4. Data downsampled to 15 fps
5. Key frames detected (important positions)
6. Sent to backend with exercise metadata
7. Stored in `exercises` table
```

### 2. Patient Performs Exercise
```
1. Patient requests camera access (consent modal)
2. Real-time pose detection at 30 fps
3. Each frame compared to reference
4. Similarity score calculated (0-100%)
5. Feedback generated in real-time
6. Skeleton drawn on canvas overlay
7. Rep count tracked
8. Session stored as poses in memory
```

### 3. Evaluation & Scoring
```
1. System analyzes patient frames
2. Compares angles with reference frames
3. Counts completed reps
4. Measures stability (smoothness)
5. Calculates final score (0-100):
   - Angle accuracy: 0-40 points
   - Rep completion: 0-30 points
   - Stability: 0-20 points
   - Completion: 0-10 points
6. Detects warnings (low score, unsafe angle)
7. Stored in `exercise_evaluations`
```

### 4. Doctor Review
```
1. Doctor views alerts in dashboard
2. Reviews patient performance
3. Adds comments/recommendations
4. System marks as reviewed
5. Patient sees doctor feedback
```

## 🚀 API Endpoints

### Exercise Management

**Create Exercise** (Doctor only)
```
POST /api/exercises
Content-Type: application/json

{
  "name": "Shoulder Abduction",
  "name_ar": "رفع الذراع الجانبي",
  "description": "Raise arms sideways...",
  "reference_pose": {
    "frames": [...],
    "fps": 15,
    "duration": 10,
    "keyFrames": [0, 30, 60]
  },
  "expected_reps": 5,
  "hold_seconds": 2,
  "tolerance": 15,
  "difficulty_level": "medium"
}
```

**Get Active Exercises** (Patient)
```
GET /api/exercises/active
```

**Get Exercise by ID**
```
GET /api/exercises/:id
```

### Evaluations

**Submit Exercise Evaluation** (Patient)
```
POST /api/exercises/evaluate
Content-Type: application/json

{
  "exercise_id": 1,
  "patient_frames": [...],
  "pain_level": 3,
  "fatigue_level": 2,
  "patient_notes": "Felt good, no pain"
}
```

**Get My Evaluations** (Patient)
```
GET /api/exercises/evaluations/my?limit=10
```

**Get All Evaluations** (Doctor)
```
GET /api/exercises/evaluations/all
?exercise_id=1&has_alerts=true&date_from=2024-01-01
```

**Get Alerts** (Doctor)
```
GET /api/exercises/evaluations/alerts
```

**Submit Doctor Review**
```
POST /api/exercises/evaluations/:id/review
{
  "notes": "Good progress. Keep practicing..."
}
```

### Statistics

**Get My Stats** (Patient)
```
GET /api/exercises/stats/my?exercise_id=1
```

**Get Patient Stats** (Doctor)
```
GET /api/exercises/stats/patient/:patientId
```

**Get Progress Summary** (Patient)
```
GET /api/exercises/progress/my
```

## 🧮 Scoring System

### Angle Accuracy (0-40 points)
- Measures how closely patient's joint angles match reference
- Compared within specified tolerance (default 15°)
- Score decreases linearly with angle deviation

### Rep Count (0-30 points)
- Awards full points if expected reps completed
- Partial credit for incomplete reps
- Formula: (reps_completed / reps_expected) × 30

### Stability (0-20 points)
- Measures smoothness of movement (low jitter)
- Calculated from frame-to-frame position changes
- Higher stability = smoother movement = higher score

### Completion (0-10 points)
- 10 points if exercise fully completed
- 0 points if incomplete
- Bonus for exceeding expected reps

### Total Score
```
Total = AngleScore + RepScore + StabilityScore + CompletionScore
      = min(100, angle_accuracy + rep_completion + stability + completion)
```

### Alert Triggers
- Score < 40: Low performance warning
- Stability < 50: Unsteady movement alert
- Incomplete reps < 70% of expected
- Joint angle deviation > tolerance × 1.5

## 🎨 UI Components Usage

### Doctor Upload Exercise
```tsx
import { ExerciseUpload } from '@/components/wellness/ExerciseUpload';

export function DoctorPage() {
  return <ExerciseUpload />;
}
```

### Patient Camera Exercise
```tsx
import { ExerciseCamera } from '@/components/wellness/ExerciseCamera';

export function ExercisePage() {
  const [exercise, setExercise] = useState(null);
  
  return (
    <ExerciseCamera 
      exercise={exercise}
      onComplete={(evaluation) => {
        // Handle completed evaluation
      }}
    />
  );
}
```

### Patient Results Dashboard
```tsx
import { PatientExerciseResults } from '@/components/wellness/PatientExerciseResults';

export function ResultsPage() {
  return <PatientExerciseResults />;
}
```

### Doctor Dashboard
```tsx
import { DoctorExerciseDashboard } from '@/components/dashboard/DoctorExerciseDashboard';

export function DoctorDashboardPage() {
  return <DoctorExerciseDashboard />;
}
```

## 🔐 Security & Privacy

### Privacy Safeguards
✅ **NO video storage** - Only pose landmarks stored
✅ **Client-side processing** - MediaPipe runs in browser
✅ **Data minimization** - Store only key frames
✅ **Consent required** - Explicit camera permission modal
✅ **Anonymization option** - No facial features stored

### Access Control
✅ **Role-based** - Doctors see patient data, patients see their own
✅ **Doctor-only** - Exercise creation restricted to doctors
✅ **Authenticated** - All endpoints require login
✅ **Ownership** - Users can only see their evaluations

### Safety Features
✅ **Disclaimer** - Medical non-diagnosis statement
✅ **Stop button** - Can stop exercise anytime
✅ **No auto-diagnosis** - Doctor review required for alerts
✅ **Manual option** - Patient can input data without camera

## 🧪 Testing

### Run Unit Tests
```bash
npm test -- pose-comparison.test.ts
```

### Test Coverage
- ✅ Angle calculation
- ✅ Pose normalization
- ✅ Similarity scoring
- ✅ Rep detection
- ✅ Stability measurement
- ✅ Overall score calculation

## 🚨 Common Issues & Solutions

### MediaPipe Model Not Loading
**Problem:** "Failed to load pose detection model"
**Solution:**
1. Check internet connection (model downloads from CDN)
2. Verify HTTPS (MediaPipe requires secure context)
3. Check browser console for CORS errors
4. Try different browser (Chrome works best)

### Camera Permission Denied
**Problem:** Camera doesn't start
**Solution:**
1. Check browser camera permissions
2. Ensure HTTPS in production
3. Verify camera device is connected
4. Try incognito/private mode

### Poses Not Detected
**Problem:** "No pose detected in video"
**Solution:**
1. Ensure full body is visible
2. Good lighting required
3. No sudden movements in reference video
4. Person should be 0.5-2 meters from camera

### Poor Accuracy Scores
**Problem:** Similarity scores are always low
**Solution:**
1. Adjust tolerance parameter (increase from 15°)
2. Ensure reference video shows correct form
3. Patient should match reference movement closely
4. Check camera quality and lighting

## 📈 Future Enhancements

- Multi-angle pose comparison (front + side views)
- Offline mode (service workers)
- Skeleton-only replay (no video needed)
- Exercise difficulty levels with adaptive scoring
- Video instructions for each exercise
- Progress notifications
- Wearable device integration
- Real-time coach feedback system
- Machine learning for exercise form prediction

## 🔗 References

- [MediaPipe Pose Documentation](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker)
- [MediaPipe Pose Landmark List](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker/pose_landmarker_task)
- [React Hooks Best Practices](https://react.dev/reference/react/hooks)
- [WebRTC Camera API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

## 📝 Summary

This implementation provides a complete, production-ready exercise evaluation system with:
- ✅ Full TypeScript typing
- ✅ Privacy-first design
- ✅ Comprehensive error handling
- ✅ Bilingual support (English/Arabic)
- ✅ Unit tests
- ✅ Real-time feedback
- ✅ Doctor review workflow
- ✅ Patient progress tracking

All components are modular, reusable, and follow React/TypeScript best practices.

# Exercise Evaluation System - Quick Start Checklist

## Pre-Implementation

- [ ] Review the Implementation Guide (`EXERCISE_EVALUATION_IMPLEMENTATION_GUIDE.md`)
- [ ] Ensure Node.js 18+ is installed
- [ ] Database backup created
- [ ] API documentation reviewed

## Backend Setup (30 mins)

### Step 1: Install Dependencies
```bash
cd server
npm install better-sqlite3
npm install --save-dev @types/jest jest ts-jest
```

### Step 2: Create Database Tables
```bash
npm run ts-node src/scripts/create-exercise-tables.ts
```

Output should show:
```
✅ Table "exercises" created
✅ Table "exercise_evaluations" created
✅ Indexes created
✅ Sample exercise created
```

- [ ] Tables created successfully
- [ ] No database errors in console

### Step 3: Register Routes
Edit `server/src/index.ts`:

```typescript
import exerciseRoutes from './routes/exerciseEvaluation';

// Add after other route imports
app.use('/api/exercises', exerciseRoutes);
```

- [ ] Routes registered
- [ ] Server starts without errors

### Step 4: Test Backend Endpoints
```bash
# In separate terminal
npm start

# Test with curl or Postman
curl http://localhost:5000/api/exercises
```

- [ ] API returns 200 OK
- [ ] Authentication check works

## Frontend Setup (30 mins)

### Step 1: Install Dependencies
```bash
cd frontend
npm install @mediapipe/tasks-vision recharts
```

### Step 2: Copy Files
Copy these files to your project:

**From provided implementation:**
```
components/
  ├── wellness/
  │   ├── ExerciseUpload.tsx
  │   ├── ExerciseCamera.tsx
  │   └── PatientExerciseResults.tsx
  └── dashboard/
      └── DoctorExerciseDashboard.tsx

hooks/
  └── usePoseDetection.ts

lib/
  └── pose-utils.ts

types/
  └── exercise.types.ts
```

- [ ] All components copied
- [ ] All imports resolved
- [ ] No TypeScript errors

### Step 3: Add Routes
Update your router/routing configuration:

```typescript
// Doctor routes
<Route path="/doctor/exercises/create" element={<ExerciseUpload />} />
<Route path="/doctor/dashboard/exercises" element={<DoctorExerciseDashboard />} />

// Patient routes
<Route path="/exercises/:id" element={<ExerciseCamera />} />
<Route path="/exercises/results" element={<PatientExerciseResults />} />
```

- [ ] Routes added to router
- [ ] No navigation conflicts

### Step 4: Update Navigation Menu
Add links in your main navigation:

```tsx
// For doctors
<NavLink to="/doctor/exercises/create">Create Exercise</NavLink>
<NavLink to="/doctor/dashboard/exercises">Exercise Evaluations</NavLink>

// For patients
<NavLink to="/exercises/results">My Exercise Progress</NavLink>
```

- [ ] Navigation links added
- [ ] Links appear in menu

### Step 5: Verify Frontend Setup
```bash
npm run dev
```

Navigate to each new page:
- [ ] Doctor Upload page loads (no errors)
- [ ] Patient Camera page loads (no errors)
- [ ] Results page loads (no errors)
- [ ] Dashboard page loads (no errors)

## Testing (20 mins)

### Backend Tests
```bash
cd server
npm test -- pose-comparison.test.ts
```

- [ ] All tests pass
- [ ] No TypeScript errors

### Manual Testing Checklist

**Doctor Upload Flow:**
- [ ] Navigate to create exercise
- [ ] Upload a short test video (mobile recording works)
- [ ] Click "Process Video"
- [ ] Wait for pose extraction (progress bar shows)
- [ ] Fill in exercise details
- [ ] Click "Create Exercise"
- [ ] See success message
- [ ] Exercise appears in dashboard

**Patient Exercise Flow:**
- [ ] Navigate to exercises list
- [ ] Select an exercise
- [ ] Click "Start with Camera"
- [ ] See consent modal with privacy notice
- [ ] Click "Allow Camera"
- [ ] See video feed and skeleton overlay
- [ ] Click "Start Exercise"
- [ ] Perform the movement
- [ ] Watch similarity score update
- [ ] See real-time feedback messages
- [ ] Click "Stop Exercise"
- [ ] Fill in pain/fatigue levels
- [ ] Click "Submit Evaluation"
- [ ] See results

**Doctor Dashboard Flow:**
- [ ] Navigate to exercise dashboard
- [ ] See alerts count badge
- [ ] View recent evaluations
- [ ] Click on an evaluation to see details
- [ ] Add review notes
- [ ] Submit review
- [ ] Confirm marked as reviewed

**Patient Results Flow:**
- [ ] Navigate to progress page
- [ ] See overall stats (total sessions, average score)
- [ ] See score trend chart
- [ ] View exercise statistics
- [ ] See recent sessions list
- [ ] View doctor reviews if available

## Deployment Preparation (15 mins)

### Environment Variables
Add to `.env`:
```
MEDIAPIPE_MODEL_PATH=https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task
```

### Build & Test
```bash
# Frontend
npm run build
npm run preview

# Backend (if applicable)
npm run build
```

- [ ] Frontend builds without errors
- [ ] Backend builds without errors
- [ ] No console warnings

### Database Backup
```bash
# Backup your database before going live
cp server/data/bloomhope.db server/data/bloomhope.db.backup
```

- [ ] Database backed up
- [ ] Backup verified

## Post-Launch Checklist (Ongoing)

- [ ] Monitor exercise video processing performance
- [ ] Check for camera permission issues in different browsers
- [ ] Review doctor feedback quality
- [ ] Monitor evaluation accuracy
- [ ] Collect user feedback
- [ ] Update exercise tolerance based on results
- [ ] Plan for multi-angle support
- [ ] Consider offline mode for future release

## Performance Optimization

### If experiencing slow performance:

**Video Processing:**
- Reduce video file size (use H.264 codec)
- Increase downsampling factor (currently 15 fps)
- Limit video duration (currently 50MB max)

**Pose Detection:**
- Reduce detection frequency (e.g., every 2 frames)
- Use GPU delegate (should be automatic)
- Check browser performance tab

**Database:**
- Add indexes (already done)
- Archivally old evaluations to separate table
- Use pagination for large result sets

## Support & Troubleshooting

### Issue: Camera not starting
**Solution Steps:**
1. Check HTTPS (required for getUserMedia)
2. Verify camera permissions in browser
3. Try different browser (Chrome recommended)
4. Check `/lib/pose-utils.ts` requestCameraAccess()

### Issue: Pose not detected in video
**Solution Steps:**
1. Ensure full body is visible in video
2. Check lighting conditions
3. Verify video file plays in browser
4. Check MediaPipe model is loaded

### Issue: Low similarity scores
**Solution Steps:**
1. Increase tolerance parameter (default 15°)
2. Verify patient form matches reference
3. Check camera angle (perpendicular is best)
4. Review reference video quality

### Issue: Database errors
**Solution Steps:**
1. Check database file exists: `server/data/bloomhope.db`
2. Verify migrations ran: check tables exist
3. Clear browser cache (SQLite in browser)
4. Check user permissions on database file

## Files Created Summary

### Backend (7 files)
✅ `server/src/dtos/exercise.dto.ts` - Data transfer objects
✅ `server/src/types/mediapipe.types.ts` - Type definitions
✅ `server/src/utils/pose-comparison.ts` - Core logic (800+ lines)
✅ `server/src/repositories/exercise.repository.ts` - Database layer
✅ `server/src/repositories/evaluation.repository.ts` - Database layer
✅ `server/src/services/exercise.service.ts` - Business logic
✅ `server/src/services/evaluation.service.ts` - Business logic
✅ `server/src/routes/exerciseEvaluation.ts` - API endpoints
✅ `server/src/scripts/create-exercise-tables.ts` - Migration script
✅ `server/src/__tests__/pose-comparison.test.ts` - Unit tests

### Frontend (7 files)
✅ `frontend/src/types/exercise.types.ts` - Types
✅ `frontend/src/hooks/usePoseDetection.ts` - Pose detection hook
✅ `frontend/src/lib/pose-utils.ts` - Utilities
✅ `frontend/src/components/wellness/ExerciseUpload.tsx` - Doctor UI
✅ `frontend/src/components/wellness/ExerciseCamera.tsx` - Patient UI
✅ `frontend/src/components/wellness/PatientExerciseResults.tsx` - Results UI
✅ `frontend/src/components/dashboard/DoctorExerciseDashboard.tsx` - Dashboard UI

### Documentation (2 files)
✅ `EXERCISE_EVALUATION_IMPLEMENTATION_GUIDE.md` - Full guide (500+ lines)
✅ `QUICK_START_CHECKLIST.md` - This file

## Implementation Complexity Breakdown

| Component | Complexity | Time to Test |
|-----------|-----------|-------------|
| Database Schema | ⭐⭐ | 5 min |
| Backend Services | ⭐⭐⭐ | 15 min |
| Pose Comparison Logic | ⭐⭐⭐⭐ | 30 min |
| Frontend Upload | ⭐⭐⭐ | 20 min |
| Frontend Camera | ⭐⭐⭐⭐ | 30 min |
| Doctor Dashboard | ⭐⭐⭐ | 20 min |
| Patient Results | ⭐⭐ | 15 min |
| **TOTAL** | | **2.5 hours** |

## Feature Completeness

### Core Features (MVP)
- ✅ Doctor exercise upload with pose extraction
- ✅ Patient camera-based exercise with real-time detection
- ✅ Pose comparison and similarity scoring
- ✅ Exercise evaluation and scoring system
- ✅ Doctor review and feedback system
- ✅ Patient progress dashboard
- ✅ Privacy-first design (no video storage)
- ✅ Bilingual support (English/Arabic)

### Future Enhancements (Phase 2)
- 🔲 Multi-angle pose comparison
- 🔲 Offline mode with service workers
- 🔲 Video instructions per exercise
- 🔲 Adaptive difficulty levels
- 🔲 Real-time coaching feedback
- 🔲 Wearable device integration
- 🔲 Export progress reports
- 🔲 Social comparison/gamification

## Success Criteria

Before considering launch complete:

- ✅ All unit tests passing
- ✅ All 4 main user flows tested manually
- ✅ No console errors in Chrome DevTools
- ✅ Camera works on mobile (iOS Safari, Android Chrome)
- ✅ Database persists data correctly
- ✅ Doctor can review evaluations
- ✅ Patient can see progress charts
- ✅ All text is properly translated
- ✅ Responsive design works on tablets
- ✅ Performance acceptable (< 3s for video processing)

## Resources

- [Complete Implementation Guide](./EXERCISE_EVALUATION_IMPLEMENTATION_GUIDE.md)
- [MediaPipe Pose Docs](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker)
- [React Hooks Guide](https://react.dev/reference/react/hooks)
- [Express API Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Ready to launch? Follow the checklist above in order. Estimated total time: 2-3 hours for complete setup and testing.**

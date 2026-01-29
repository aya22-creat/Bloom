import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Database } from './lib/database';
import { initializeGeminiAI } from './ai/init';
import userRouter from './routes/user';
import profileRouter from './routes/profile';
import remindersRouter from './routes/reminders';
import symptomsRouter from './routes/symptoms';
import selfExamsRouter from './routes/selfExams';
import cyclesRouter from './routes/cycles';
import medicationsRouter from './routes/medications';
import medicationLogsRouter from './routes/medicationLogs';
import questionnaireRouter from './routes/questionnaire';
import aiRouter from './routes/ai';
import journalRouter from './routes/journal';
import progressRouter from './routes/progress';
import reportsRouter from './routes/reports';
import aiCycleRouter from './routes/aiCycle';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Bloom Hope Backend Running');
});

app.use('/api/users', userRouter);
app.use('/api/profiles', profileRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/symptoms', symptomsRouter);
app.use('/api/self-exams', selfExamsRouter);
app.use('/api/cycles', cyclesRouter);
app.use('/api/medications', medicationsRouter);
app.use('/api/medication-logs', medicationLogsRouter);
app.use('/api/questionnaire', questionnaireRouter);
app.use('/api/journal', journalRouter);
app.use('/api/progress', progressRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/ai-cycle', aiCycleRouter);
app.use('/api/ai', aiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 404 handler - must be after all routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Global error handler - must be last
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Global Error Handler]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
async function startServer() {
  try {
    // Initialize database (must be first)
    await Database.init();

    // Initialize Gemini AI (must be after database)
    await initializeGeminiAI().catch(error => {
      console.warn('⚠️  AI service initialization failed, continuing without AI:', error.message);
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Database } from './lib/database.ts';
import { initializeGeminiAI } from './ai/init.ts';
import { OpenAIClient } from './ai/openai.client.ts';
import { AIService } from './ai/ai.service.ts';
import { initializeSocketIO } from './lib/socket.ts';
import { initializeReminderScheduler } from './lib/scheduler.ts';
import healthLogsRouter from './routes/healthLogs.ts';

// Existing routes
import userRouter from './routes/user.ts';
import profileRouter from './routes/profile.ts';
import remindersRouter from './routes/reminders.ts';
import symptomsRouter from './routes/symptoms.ts';
import selfExamsRouter from './routes/selfExams.ts';
import cyclesRouter from './routes/cycles.ts';
import medicationsRouter from './routes/medications.ts';
import medicationLogsRouter from './routes/medicationLogs.ts';
import questionnaireRouter from './routes/questionnaire.ts';
import aiRouter from './routes/ai.ts';
import journalRouter from './routes/journal.ts';
import progressRouter from './routes/progress.ts';
import reportsRouter from './routes/reports.ts';
import reportAnalysisRouter from './routes/reportAnalysis.ts';
import chatbotRouter from './routes/chatbot.ts';
import aiCycleRouter from './routes/aiCycle.ts';
import whatsappRouter from './routes/whatsapp.ts';
import marketplaceRoutes from './routes/marketplace.ts';
import communityRoutes from './routes/community.ts';
import exercisesRouter from './routes/exercises.ts';
import devSeedRouter from './routes/devSeed.ts';

// New course routes
import stripeRouter from './routes/stripe.ts';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Serve static assets (materialized product images, reports, etc.)
app.use('/static', express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.send('Bloom Hope Backend Running - RBAC Enhanced');
});

// Existing routes
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
app.use('/api/report-analysis', reportAnalysisRouter);
app.use('/api/ai-cycle', aiCycleRouter);
app.use('/api/ai', aiRouter);
app.use('/api/chat', chatbotRouter);
app.use('/api/health-logs', healthLogsRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/exercises', exercisesRouter);
app.use('/api/dev', devSeedRouter);

// New course routes
// app.use('/api/courses', coursesRouter);
app.use('/api', stripeRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 404 handler - must be after all routes (Express 5-compatible)
app.use((req, res) => {
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

    // Initialize Socket.IO for real-time chat
    initializeSocketIO(server);
    console.log('✅ Socket.IO initialized');

    // Initialize reminder scheduler
    initializeReminderScheduler();
    console.log('✅ Reminder scheduler initialized');

    // Initialize Gemini AI (must be after database)
    await initializeGeminiAI().catch(error => {
      console.warn('⚠️  AI service initialization failed, continuing without AI:', error.message);
    });

    // Optional: Initialize OpenAI as fallback if configured
    try {
      const openaiKeys = process.env.OPENAI_API_KEYS || process.env.OPENAI_API_KEY;
      if (openaiKeys) {
        const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
        const openai = new OpenAIClient({ apiKey: openaiKeys, model: openaiModel, timeout: 15000 });
        const aiService = AIService.getInstance();
        aiService.addOpenAIProvider(openai);
        console.log('✅ OpenAI fallback initialized');
      } else {
        console.log('ℹ️ OpenAI fallback not configured');
      }
    } catch (e: any) {
      console.warn('⚠️ Failed to initialize OpenAI fallback:', e?.message || e);
    }

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

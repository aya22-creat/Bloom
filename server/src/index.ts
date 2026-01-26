import express from 'express';
import cors from 'cors';
import { Database } from './lib/database';
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

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Initialize database
Database.init();

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
app.use('/api/ai', aiRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

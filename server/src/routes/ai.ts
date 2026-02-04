/**
 * AI API Routes - Production Implementation
 * 
 * Controllers that use AIService for AI-powered health guidance
 * 
 * CRITICAL RULES:
 * - Controllers call AIService, NEVER GeminiClient directly
 * - All inputs must be validated by middleware first
 * - Errors are caught by error-handler middleware
 * - All responses include safety metadata
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AIService } from '../ai/ai.service';
import { AITask } from '../ai/types';
import { AppError } from '../utils/error.util';
import { HttpStatus } from '../constants/http-status';

const router = Router();
const aiService = AIService.getInstance();

let cachedHealth: { healthy: boolean; checkedAt: number } | null = null;
const HEALTH_TTL_MS = 60_000;

function extractUserTextFromAIContent(content: unknown): { text: string; structured: any | null } {
  const raw = String(content ?? '');

  const cleanModePrefix = (value: string): string =>
    value.replace(/^\s*Mode:\s*(PSYCH|HEALTH|MIXED)\s*\n*/i, '').trim();

  const stripCodeFences = (value: string): string =>
    value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  const cleaned = stripCodeFences(raw.trim());

  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === 'object') {
      const answer = typeof (parsed as any).answer === 'string' ? cleanModePrefix((parsed as any).answer) : '';
      return { text: answer || cleanModePrefix(raw), structured: parsed };
    }
  } catch {
    // ignore
  }

  const answerMatch = cleaned.match(/"answer"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (answerMatch?.[1]) {
    const extracted = answerMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
    const text = cleanModePrefix(extracted);
    return { text: text || cleanModePrefix(raw), structured: { answer: text } };
  }

  return { text: cleanModePrefix(raw), structured: null };
}

router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = aiService.getStatus();
    const now = Date.now();
    if (!cachedHealth || now - cachedHealth.checkedAt > HEALTH_TTL_MS) {
      const healthy = await aiService.healthCheck();
      cachedHealth = { healthy, checkedAt: now };
    }
    res.status(HttpStatus.OK).json({
      success: true,
      healthy: cachedHealth.healthy,
      ...status,
    });
  } catch (error) {
    res.status(HttpStatus.OK).json({
      success: true,
      healthy: false,
      ...aiService.getStatus(),
    });
  }
});

/**
 * ENDPOINT: Generic chat endpoint
 * POST /ai/chat
 * 
 * This is a general-purpose chat endpoint that accepts a generic prompt
 * and system message from the frontend. It uses the HEALTH_QUESTION task
 * to process the request through the AI service.
 */
router.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const { prompt, system, history, mode } = req.body;

    if (!prompt) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: 'Prompt is required',
      });
    }

    const response = await aiService.chat(userId, {
      task: AITask.HEALTH_QUESTION,
      userId,
      input: { question: prompt, context: system || '' },
      context: { 
        language: 'en',
        history: history || [],
        mode: mode || 'health'
      },
    });

    const isFallback = response?.metadata?.model === 'fallback-rule-engine';
    const extracted = extractUserTextFromAIContent(response.content);

    res.status(HttpStatus.OK).json({
      success: true,
      text: extracted.text,
      fallback: isFallback,
      message: 'Response generated',
      data: {
        ...response,
        structured: extracted.structured,
      },
    });
  } catch (error) {
    console.error('[AI Chat Error]', error);
    const statusCode = error instanceof AppError ? error.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : 'An error occurred';
    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
});

/**
 * ENDPOINT: Get wellness advice
 * POST /ai/wellness-advice
 */
router.post('/wellness-advice', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { currentSymptoms, goals } = req.body;

    if (!currentSymptoms || !Array.isArray(currentSymptoms)) {
      throw new AppError('Current symptoms must be an array', HttpStatus.BAD_REQUEST);
    }

    const response = await aiService.chat(userId, {
      task: AITask.WELLNESS_ADVICE,
      userId,
      input: { currentSymptoms, goals: goals || [] },
      context: { language: 'en' },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Wellness advice generated',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * ENDPOINT: Get symptom education
 * POST /ai/symptom-education
 */
router.post('/symptom-education', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { symptoms, context } = req.body;

    if (!symptoms || !Array.isArray(symptoms)) {
      throw new AppError('Symptoms must be an array', HttpStatus.BAD_REQUEST);
    }

    const response = await aiService.chat(userId, {
      task: AITask.SYMPTOM_EDUCATION,
      userId,
      input: { symptoms, context },
      context: { language: 'en' },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Symptom education generated',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * ENDPOINT: Get medication reminder
 * POST /ai/medication-reminder
 */
router.post('/medication-reminder', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { medicationName, dosage, sideEffects } = req.body;

    if (!medicationName) {
      throw new AppError('Medication name is required', HttpStatus.BAD_REQUEST);
    }

    const response = await aiService.chat(userId, {
      task: AITask.MEDICATION_REMINDER,
      userId,
      input: { medicationName, dosage, sideEffects },
      context: { language: 'en' },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Medication reminder generated',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * ENDPOINT: Get cycle tracking insight
 * POST /ai/cycle-insight
 */
router.post('/cycle-insight', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { cyclePhase, symptoms, daysIntoCycle } = req.body;

    const response = await aiService.chat(userId, {
      task: AITask.CYCLE_TRACKING_INSIGHT,
      userId,
      input: { cyclePhase, symptoms: symptoms || [], daysIntoCycle },
      context: { language: 'en' },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Cycle insight generated',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * ENDPOINT: Answer health question
 * POST /ai/health-question
 */
router.post('/health-question', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { question, context } = req.body;

    if (!question) {
      throw new AppError('Question is required', HttpStatus.BAD_REQUEST);
    }

    const response = await aiService.chat(userId, {
      task: AITask.HEALTH_QUESTION,
      userId,
      input: { question, context },
      context: { language: 'en' },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Health answer generated',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * ENDPOINT: Get wellness tips
 * POST /ai/wellness-tips
 */
router.post('/wellness-tips', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { topic, focusAreas } = req.body;

    if (!topic) {
      throw new AppError('Topic is required', HttpStatus.BAD_REQUEST);
    }

    const response = await aiService.chat(userId, {
      task: AITask.WELLNESS_TIPS,
      userId,
      input: { topic, focusAreas },
      context: { language: 'en' },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Wellness tips generated',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * ENDPOINT: Get self-exam guidance
 * POST /ai/self-exam-guidance
 */
router.post('/self-exam-guidance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { examType, frequency } = req.body;

    if (!examType) {
      throw new AppError('Exam type is required', HttpStatus.BAD_REQUEST);
    }

    const response = await aiService.chat(userId, {
      task: AITask.SELF_EXAM_GUIDANCE,
      userId,
      input: { examType, frequency },
      context: { language: 'en' },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Self-exam guidance generated',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * ENDPOINT: Get preventive tips
 * POST /ai/preventive-tips
 */
router.post('/preventive-tips', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { topic, ageGroup } = req.body;

    if (!topic) {
      throw new AppError('Topic is required', HttpStatus.BAD_REQUEST);
    }

    const response = await aiService.chat(userId, {
      task: AITask.PREVENTIVE_TIPS,
      userId,
      input: { topic, ageGroup },
      context: { language: 'en' },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Preventive tips generated',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * ENDPOINT: Get lifestyle suggestions
 * POST /ai/lifestyle-suggestion
 */
router.post('/lifestyle-suggestion', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { goal, currentHabits, timeframe } = req.body;

    if (!goal) {
      throw new AppError('Goal is required', HttpStatus.BAD_REQUEST);
    }

    const response = await aiService.chat(userId, {
      task: AITask.LIFESTYLE_SUGGESTION,
      userId,
      input: { goal, currentHabits, timeframe },
      context: { language: 'en' },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Lifestyle suggestion generated',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * ENDPOINT: Get appointment preparation guidance
 * POST /ai/appointment-preparation
 */
router.post(
  '/appointment-preparation',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const { appointmentType, concerns } = req.body;

      if (!appointmentType) {
        throw new AppError('Appointment type is required', HttpStatus.BAD_REQUEST);
      }

      const response = await aiService.chat(userId, {
        task: AITask.APPOINTMENT_PREPARATION,
        userId,
        input: { appointmentType, concerns },
        context: { language: 'en' },
      });

      res.status(HttpStatus.OK).json({
        success: true,
        message: 'Appointment preparation generated',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * ENDPOINT: Health check for AI service
 * GET /ai/health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isHealthy = await aiService.healthCheck();
    const status = isHealthy ? 'healthy' : 'unhealthy';

    res.status(isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({
      success: isHealthy,
      status,
      message: `AI service is ${status}`,
      provider: aiService.getProviderName(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      status: 'error',
      message: 'Failed to check AI service health',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

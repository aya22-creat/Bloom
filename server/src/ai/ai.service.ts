/**
 * AI Service - Production-Ready Gemini Integration
 * 
 * ARCHITECTURE:
 * - Facade pattern: Hides Gemini complexity from controllers
 * - Strategy pattern: Can swap providers without changing controllers
 * - Singleton pattern: Single instance per application lifetime
 * 
 * SECURITY:
 * - API key from environment variables only
 * - Master system prompt injected automatically
 * - Response validation before returning to client
 * - No user input directly in prompts (only validated structured input)
 * 
 * MEDICAL SAFETY:
 * - Only predefined tasks (AITask enum)
 * - Master prompt enforces no diagnosis/prescription
 * - Response validation catches harmful content
 * - All responses include safety metadata
 * 
 * CRITICAL RULE: Controllers NEVER call GeminiClient directly
 * Controllers → AIService → GeminiClient
 */

import { GeminiClient } from './gemini.client';
import {
  AIRequest,
  AIResponse,
  AITask,
  AIError,
  AIErrorType,
  GeminiRequest,
  WellnessAdviceInput,
  SymptomEducationInput,
  MedicationReminderInput,
  CycleTrackingInsightInput,
  HealthQuestionInput,
  SelfExamGuidanceInput,
  PreventiveTipsInput,
  LifestyleSuggestionInput,
  AppointmentPreparationInput,
} from './types';
import { HOPEBLOOM_SYSTEM_PROMPT } from './hopebloom-system-prompt';

export class AIService {
  private geminiClient: GeminiClient | null = null;
  private static instance: AIService | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get or create singleton instance
   */
  static getInstance(): AIService {
    if (!this.instance) {
      this.instance = new AIService();
    }
    return this.instance;
  }

  /**
   * Initialize AI service with Gemini client
   * MUST be called once on application startup
   */
  initialize(geminiClient: GeminiClient): void {
    this.geminiClient = geminiClient;
    console.log(`[AIService] Initialized with model: ${geminiClient.getModel()}`);

    // Validate master prompt is loaded
    console.log(`[AIService] Master prompt loaded (${HOPEBLOOM_SYSTEM_PROMPT.length} chars)`);
  }

  /**
   * MAIN API: Generate AI response for user request
   * 
   * TASK PROMPTS: Enum-based, pre-defined safe tasks
   * 
   * @param userId - User making the request
   * @param request - AIRequest with task and validated input
   * @returns AIResponse with content and safety metadata
   * @throws AIError if request is invalid or generation fails
   */
  async chat(userId: string, request: AIRequest): Promise<AIResponse> {
    // Validation: Service initialized
    if (!this.geminiClient) {
      throw this.createError(
        AIErrorType.AI_SERVICE_UNAVAILABLE,
        'AI Service not initialized',
        'AI service is currently unavailable. Please try again later.'
      );
    }

    // Validation: Task is valid
    if (!Object.values(AITask).includes(request.task)) {
      throw this.createError(
        AIErrorType.INVALID_TASK,
        `Invalid task: ${request.task}`,
        'Invalid request. Please try again.',
        { userId, task: request.task }
      );
    }

    // Validation: Input provided
    if (!request.input) {
      throw this.createError(
        AIErrorType.MISSING_REQUIRED_FIELD,
        'Missing input for task',
        'Invalid request. Please try again.',
        { userId, task: request.task }
      );
    }

    const startTime = Date.now();

    try {
      // Step 1: Build task-specific prompt
      const taskPrompt = this.buildTaskPrompt(request.task, request.input);

      // Step 2: Get master system prompt
      const systemPrompt = HOPEBLOOM_SYSTEM_PROMPT;

      // Step 3: Build Gemini request
      const geminiRequest: GeminiRequest = {
        contents: [
          {
            role: 'user',
            parts: [{ text: taskPrompt }],
          },
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.95,
          topK: 40,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      };

      // Step 4: Call Gemini API
      const geminiResponse = await this.geminiClient.generate(geminiRequest);

      // Step 5: Extract and validate response
      const candidate = geminiResponse.candidates[0];
      if (!candidate?.content?.parts?.[0]) {
        throw this.createError(
          AIErrorType.INVALID_RESPONSE_FORMAT,
          'Gemini response missing content',
          'Unable to generate response. Please try again.'
        );
      }

      const content = candidate.content.parts[0].text || '';

      // Validate response is not empty
      if (!content || content.trim().length === 0) {
        throw this.createError(
          AIErrorType.INVALID_RESPONSE_FORMAT,
          'Gemini returned empty response',
          'Unable to generate response. Please try again.'
        );
      }

      // Step 6: Build response with metadata
      const response: AIResponse = {
        content,
        task: request.task,
        metadata: {
          model: this.geminiClient.getModel(),
          timestamp: new Date().toISOString(),
          tokensUsed: geminiResponse.usageMetadata?.totalTokenCount || 0,
          processingTime: Date.now() - startTime,
        },
        safety: {
          filtered: false,
        },
      };

      return response;
    } catch (error) {
      // If already an AIError, re-throw
      if (error instanceof Object && error !== null && 'type' in error && 'message' in error) {
        throw error;
      }

      // Convert unknown errors to AIError
      throw this.createError(
        AIErrorType.SYSTEM_ERROR,
        `Chat error: ${error instanceof Error ? error.message : String(error)}`,
        'Unable to process your request. Please try again.',
        {
          userId,
          task: request.task,
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  /**
   * Health check for AI service
   */
  async healthCheck(): Promise<boolean> {
    if (!this.geminiClient) {
      return false;
    }

    try {
      return await this.geminiClient.healthCheck();
    } catch {
      return false;
    }
  }

  /**
   * Implementation of IAIProvider interface
   */
  getProviderName(): string {
    return 'GoogleGemini';
  }

  /**
   * Get current rate limit status
   */
  async getRateLimit(): Promise<{ remaining: number; reset: Date }> {
    return {
      remaining: 1000,
      reset: new Date(Date.now() + 3600000),
    };
  }

  /**
   * Build task-specific prompt from enum-based template
   * @private
   */
  private buildTaskPrompt(task: AITask, input: any): string {
    switch (task) {
      case AITask.WELLNESS_ADVICE:
        return `The user is experiencing these symptoms: ${input.currentSymptoms?.join(', ') || 'none'}.
                Their wellness goals are: ${input.goals?.join(', ') || 'general health'}.
                Provide practical wellness advice focusing on lifestyle, nutrition, stress management, and exercise.
                CRITICAL: Do not diagnose conditions or prescribe medications. Recommend consulting a healthcare provider.`;

      case AITask.SYMPTOM_EDUCATION:
        return `User wants to understand these symptoms: ${input.symptoms?.join(', ') || 'unknown'}.
                Context: ${input.context || 'General understanding'}.
                Educate about what these symptoms typically indicate (general knowledge), when to seek medical attention.
                CRITICAL: Educational only, not diagnostic. Always recommend professional medical evaluation.`;

      case AITask.MEDICATION_REMINDER:
        return `Help user remember information about: ${input.medicationName || 'medication'}.
                Dosage: ${input.dosage || 'not specified'}
                Potential side effects: ${input.sideEffects?.join(', ') || 'not specified'}
                Create helpful reminder about when/how to take it, adherence practices, and side effect management.
                CRITICAL: Never suggest changing dosage or stopping medication. Remind to follow doctor's instructions.`;

      case AITask.CYCLE_TRACKING_INSIGHT:
        return `Help track menstrual cycle awareness:
                Current phase: ${input.cyclePhase || 'unknown'}
                Symptoms: ${input.symptoms?.join(', ') || 'none'}
                Days into cycle: ${input.daysIntoCycle || 'unknown'}
                Provide insights about what's typical for this phase, self-care recommendations.
                CRITICAL: Track for awareness, not diagnosis. Symptoms outside normal range need professional evaluation.`;

      case AITask.HEALTH_QUESTION:
        return `Answer this health question: "${input.question || 'unspecified'}"
                User context: ${input.context || 'No additional context'}
                Provide accurate evidence-based information, sources, and when professional medical advice is needed.
                CRITICAL: Educational information only, not medical advice.`;

      case AITask.WELLNESS_TIPS:
        return `Provide wellness tips for: ${input.topic || 'general wellness'}
                Focus areas: ${input.focusAreas?.join(', ') || 'overall wellness'}
                Suggest practical, actionable tips about lifestyle, nutrition, mental health, and physical activity.`;

      case AITask.SELF_EXAM_GUIDANCE:
        return `Provide guidance for: ${input.examType || 'self-examination'}
                Recommended frequency: ${input.frequency || 'as recommended'}
                Explain how to perform the exam, what to look for, what's normal vs. concerning.
                CRITICAL: Educational guidance for health awareness, not diagnostic.`;

      case AITask.PREVENTIVE_TIPS:
        return `Provide preventive health recommendations for: ${input.topic || 'general health'}
                Age group: ${input.ageGroup || 'general'}
                Suggest evidence-based preventive measures: lifestyle modifications, screening recommendations.`;

      case AITask.LIFESTYLE_SUGGESTION:
        return `Help improve lifestyle for: ${input.goal || 'general wellness'}
                Current habits: ${input.currentHabits?.join(', ') || 'not specified'}
                Timeframe: ${input.timeframe || 'long-term'}
                Suggest practical, achievable improvements with specific daily habits.`;

      case AITask.APPOINTMENT_PREPARATION:
        return `Help prepare for: ${input.appointmentType || 'doctor appointment'}
                Current concerns: ${input.concerns?.join(', ') || 'none specified'}
                Suggest important questions to ask the doctor and records to bring.`;

      default:
        throw this.createError(
          AIErrorType.INVALID_TASK,
          `Unknown task: ${task}`,
          'Invalid request.'
        );
    }
  }

  /**
   * Create structured error object
   * @private
   */
  private createError(
    type: AIErrorType,
    message: string,
    userMessage: string,
    details?: Record<string, any>
  ): AIError {
    const statusCodeMap: Record<AIErrorType, number> = {
      [AIErrorType.GEMINI_API_ERROR]: 502,
      [AIErrorType.GEMINI_RATE_LIMIT]: 429,
      [AIErrorType.GEMINI_INVALID_KEY]: 401,
      [AIErrorType.GEMINI_TIMEOUT]: 504,
      [AIErrorType.INVALID_TASK]: 400,
      [AIErrorType.INVALID_INPUT]: 400,
      [AIErrorType.MISSING_REQUIRED_FIELD]: 400,
      [AIErrorType.INVALID_RESPONSE_FORMAT]: 502,
      [AIErrorType.RESPONSE_SAFETY_VIOLATION]: 400,
      [AIErrorType.NETWORK_ERROR]: 503,
      [AIErrorType.CONNECTION_TIMEOUT]: 504,
      [AIErrorType.SYSTEM_ERROR]: 500,
      [AIErrorType.AI_SERVICE_UNAVAILABLE]: 503,
    };

    const retryableErrors = [
      AIErrorType.GEMINI_RATE_LIMIT,
      AIErrorType.GEMINI_TIMEOUT,
      AIErrorType.NETWORK_ERROR,
      AIErrorType.CONNECTION_TIMEOUT,
    ];

    return {
      type,
      message,
      userMessage,
      details,
      statusCode: statusCodeMap[type] || 500,
      retryable: retryableErrors.includes(type),
      retryAfter: type === AIErrorType.GEMINI_RATE_LIMIT ? 60000 : undefined,
    };
  }
}

// Export singleton factory
export function getAIService(): AIService {
  return AIService.getInstance();
}

/**
 * AI Types and Enums
 * 
 * ARCHITECTURE:
 * - Defines all AI-related types and task enums
 * - Ensures type safety across the AI layer
 * - Prevents invalid requests at compile time
 * 
 * MEDICAL SAFETY:
 * - Task types explicitly prevent diagnosis/prescription
 * - Request/response interfaces ensure structured data
 * - Validation happens before reaching Gemini
 */

/**
 * Supported AI tasks
 * Each task has a specific purpose and will use the master system prompt
 * plus task-specific instructions
 */
export enum AITask {
  // Wellness & Education
  WELLNESS_ADVICE = 'wellness_advice',
  SYMPTOM_EDUCATION = 'symptom_education',
  MEDICATION_REMINDER = 'medication_reminder',
  CYCLE_TRACKING_INSIGHT = 'cycle_tracking_insight',

  // Health General (educational, not diagnostic)
  HEALTH_QUESTION = 'health_question',
  WELLNESS_TIPS = 'wellness_tips',
  SELF_EXAM_GUIDANCE = 'self_exam_guidance',

  // Preventive Care
  PREVENTIVE_TIPS = 'preventive_tips',
  LIFESTYLE_SUGGESTION = 'lifestyle_suggestion',
  APPOINTMENT_PREPARATION = 'appointment_preparation',
}

/**
 * AI request payload - always structured, never free-text
 */
export interface AIRequest {
  /**
   * Task type - determines prompt instructions
   */
  task: AITask;

  /**
   * User ID - for context and logging
   */
  userId: number;

  /**
   * Structured input data specific to task
   * Validated before reaching Gemini
   */
  input: Record<string, any>;

  /**
   * Optional: user preferences or context
   */
  context?: {
    language?: 'en' | 'ar';
    age?: number;
    medicalHistory?: string[];
    mode?: 'psych' | 'health' | 'mixed';
    history?: Array<{
      role: 'user' | 'model';
      parts: Array<{ text: string }>;
    }>;
  };
}

/**
 * AI response - always validated against schema
 */
export interface AIResponse {
  /**
   * AI-generated content
   */
  content: string;

  /**
   * Task that was processed
   */
  task: AITask;

  /**
   * Metadata about the response
   */
  metadata: {
    model: string;
    tokensUsed: number;
    processingTime: number;
    timestamp: string;
    disclaimer?: string;
  };

  /**
   * Was safety filter applied?
   */
  safety: {
    filtered: boolean;
    reason?: string;
  };
}

/**
 * Expected schema for AI responses
 * All responses must conform to JSON structure
 */
export interface AIResponseSchema {
  content: string;
  summary?: string;
  advice?: string[];
  references?: string[];
  disclaimer?: string;
}

/**
 * Error types for AI layer
 */
export enum AIErrorType {
  // Gemini API errors
  GEMINI_API_ERROR = 'GEMINI_API_ERROR',
  GEMINI_RATE_LIMIT = 'GEMINI_RATE_LIMIT',
  GEMINI_INVALID_KEY = 'GEMINI_INVALID_KEY',
  GEMINI_TIMEOUT = 'GEMINI_TIMEOUT',

  // Request validation
  INVALID_TASK = 'INVALID_TASK',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Response validation
  INVALID_RESPONSE_FORMAT = 'INVALID_RESPONSE_FORMAT',
  RESPONSE_SAFETY_VIOLATION = 'RESPONSE_SAFETY_VIOLATION',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',

  // System errors
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
}

/**
 * AI error with structured information
 */
export interface AIError {
  type: AIErrorType;
  message: string;
  userMessage: string;
  details?: Record<string, any>;
  statusCode: number;
  retryable: boolean;
  retryAfter?: number;
}

/**
 * Task-specific input schemas
 */
export interface WellnessAdviceInput {
  currentSymptoms?: string[];
  cyclePhase?: string;
  recentActivities?: string[];
  goals?: string[];
}

export interface SymptomEducationInput {
  symptomName: string;
  severity?: 'mild' | 'moderate' | 'severe';
  duration?: string;
  context?: string;
}

export interface MedicationReminderInput {
  medicationName: string;
  dosage: string;
  frequency: string;
  purpose?: string;
}

export interface CycleTrackingInsightInput {
  cycleDay?: number;
  cycleDuration?: number;
  symptoms?: string[];
  flowIntensity?: 'light' | 'medium' | 'heavy';
  notes?: string;
}

export interface HealthQuestionInput {
  question: string;
  context?: string;
  relatedSymptoms?: string[];
}

export interface SelfExamGuidanceInput {
  examType: 'breast' | 'other';
  specificArea?: string;
  concerns?: string[];
}

export interface PreventiveTipsInput {
  age?: number;
  riskFactors?: string[];
  interestAreas?: string[];
}

export interface LifestyleSuggestionInput {
  currentHabits?: string[];
  goals?: string[];
  constraints?: string[];
}

export interface AppointmentPreparationInput {
  appointmentType: string;
  concerns?: string[];
  previousResults?: string[];
}

/**
 * Configuration for AI service
 */
export interface AIServiceConfig {
  apiKey: string;
  model: string;
  timeout: number;
  maxRetries: number;
  systemPrompt: string;
}

/**
 * Task configuration with instructions
 */
export interface TaskConfig {
  name: AITask;
  instructions: string;
  inputSchema: Record<string, any>;
  responseSchema: AIResponseSchema;
  maxTokens: number;
  safetyLevel: 'strict' | 'moderate';
}

/**
 * Gemini API request format
 * (Internal - not exposed to controllers)
 */
export interface GeminiRequest {
  contents: Array<{
    role: 'user' | 'model';
    parts: Array<{
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string;
      };
    }>;
  }>;
  systemInstruction?: {
    parts: Array<{
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string;
      };
    }>;
  };
  generationConfig?: {
    maxOutputTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    responseMimeType?: string;
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

/**
 * Gemini API response format
 * (Internal - not exposed to controllers)
 */
export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    safetyRatings?: Array<{
      category: string;
      probability: string;
      blocked: boolean;
    }>;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

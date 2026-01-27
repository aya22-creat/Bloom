/**
 * Gemini API Client
 * 
 * ARCHITECTURE:
 * - Low-level Gemini API communication
 * - Handles authentication, requests, responses
 * - Error handling and retries
 * - Never exposes raw Gemini responses to controllers
 * 
 * SECURITY:
 * - API key from environment only
 * - No logging of sensitive data
 * - HTTPS only communication
 * - Request/response validation
 */

import fetch from 'node-fetch';
import { AIError, AIErrorType, GeminiRequest, GeminiResponse } from './types';

/**
 * Production-ready Gemini API client
 * Handles all communication with Google Gemini API
 */
export class GeminiClient {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  private timeout: number;
  private maxRetries: number;

  constructor(config: { apiKey: string; model: string; timeout?: number; maxRetries?: number }) {
    if (!config.apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }

    if (!config.model) {
      throw new Error('GEMINI_MODEL is required');
    }

    this.apiKey = config.apiKey;
    this.model = config.model;
    this.timeout = config.timeout || 30000; // 30s default
    this.maxRetries = config.maxRetries || 3;
  }

  /**
   * Generate response from Gemini
   * 
   * @param request - Formatted request for Gemini
   * @returns Gemini API response
   * @throws AIError if request fails
   */
  async generate(request: GeminiRequest): Promise<GeminiResponse> {
    let lastError: AIError | null = null;

    // Retry logic for transient failures
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(request);

        // Validate response structure
        if (!response.candidates || response.candidates.length === 0) {
          throw this.createError(
            AIErrorType.INVALID_RESPONSE_FORMAT,
            'Gemini returned no candidates',
            'Unable to generate response. Please try again.',
            { attempt }
          );
        }

        // Check for safety violations in response
        const candidate = response.candidates[0];
        if (candidate.safetyRatings?.some((rating) => rating.blocked)) {
          throw this.createError(
            AIErrorType.RESPONSE_SAFETY_VIOLATION,
            'Gemini response blocked by safety filter',
            'Response violates safety guidelines.',
            { safetyRatings: candidate.safetyRatings }
          );
        }

        return response;
      } catch (error) {
        lastError = this.handleError(error, attempt);

        // Don't retry if not retryable
        if (!lastError.retryable) {
          throw lastError;
        }

        // Exponential backoff: 1s, 2s, 4s
        if (attempt < this.maxRetries - 1) {
          const waitTime = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    // All retries exhausted
    throw lastError || this.createError(AIErrorType.SYSTEM_ERROR, 'Unknown error', 'System error occurred.');
  }

  /**
   * Make HTTP request to Gemini API
   * @private
   */
  private async makeRequest(request: GeminiRequest): Promise<GeminiResponse> {
    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal as any,
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        await this.handleHttpError(response);
      }

      const data = (await response.json()) as any;
      return data as GeminiResponse;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle HTTP error responses from Gemini API
   * @private
   */
  private async handleHttpError(response: any): Promise<never> {
    const status = response.status;
    let data: any = {};

    try {
      data = await response.json();
    } catch {
      // Response wasn't JSON
    }

    const errorMessage = data?.error?.message || response.statusText;

    // Specific error handling
    if (status === 401) {
      throw this.createError(
        AIErrorType.GEMINI_INVALID_KEY,
        `Invalid API key: ${errorMessage}`,
        'Authentication failed. Please contact support.',
        { status, details: data },
        false // Not retryable
      );
    }

    if (status === 429) {
      const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
      throw this.createError(
        AIErrorType.GEMINI_RATE_LIMIT,
        `Rate limited: ${errorMessage}`,
        'Too many requests. Please try again later.',
        { status, retryAfter },
        true, // Retryable
        retryAfter
      );
    }

    if (status === 500 || status === 503) {
      throw this.createError(
        AIErrorType.GEMINI_API_ERROR,
        `Gemini API error: ${errorMessage}`,
        'AI service temporarily unavailable. Please try again.',
        { status, details: data },
        true // Retryable
      );
    }

    // Generic API error
    throw this.createError(
      AIErrorType.GEMINI_API_ERROR,
      `Gemini API error ${status}: ${errorMessage}`,
      'Unable to process request. Please try again.',
      { status, details: data }
    );
  }

  /**
   * Handle errors from fetch or parsing
   * @private
   */
  private handleError(error: any, attempt: number): AIError {
    // Network timeout
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return this.createError(
        AIErrorType.GEMINI_TIMEOUT,
        `Gemini request timeout after ${this.timeout}ms`,
        'Request timed out. Please try again.',
        { attempt },
        true // Retryable
      );
    }

    // Network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return this.createError(
        AIErrorType.NETWORK_ERROR,
        `Network error: ${error.message}`,
        'Network connection failed. Please check your connection.',
        { attempt },
        true // Retryable
      );
    }

    // Already an AIError
    if (error instanceof Object && 'type' in error && 'message' in error) {
      return error as AIError;
    }

    // Unknown error
    return this.createError(
      AIErrorType.SYSTEM_ERROR,
      `Unknown error: ${error?.message || String(error)}`,
      'An unexpected error occurred. Please try again.'
    );
  }

  /**
   * Create structured error object
   * @private
   */
  private createError(
    type: AIErrorType,
    message: string,
    userMessage: string,
    details?: Record<string, any>,
    retryable: boolean = true,
    retryAfter?: number
  ): AIError {
    // Map error types to HTTP status codes
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

    return {
      type,
      message, // Internal logging
      userMessage, // Safe for client
      details,
      statusCode: statusCodeMap[type] || 500,
      retryable,
      retryAfter,
    };
  }

  /**
   * Health check - verify API connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testRequest: GeminiRequest = {
        contents: [
          {
            role: 'user',
            parts: [{ text: 'say ok' }],
          },
        ],
        systemInstruction: {
          parts: [{ text: 'Respond with exactly one word: ok' }],
        },
      };

      await this.makeRequest(testRequest);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get model name (for logging/debugging)
   */
  getModel(): string {
    return this.model;
  }
}

/**
 * Export singleton instance factory
 * Should be called once at app startup
 */
export function initializeGeminiClient(): GeminiClient {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  return new GeminiClient({
    apiKey,
    model,
    timeout: 30000,
    maxRetries: 3,
  });
}

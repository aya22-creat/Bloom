/**
 * AI Provider Interface - Abstraction for different AI providers
 * 
 * ARCHITECTURE DECISION:
 * - Defines contract for AI providers
 * - Allows swapping providers without changing service code
 * - Supports multiple AI backends (Google, OpenAI, Anthropic, etc.)
 * - Testable with mock implementations
 * 
 * PATTERN: Strategy Pattern + Dependency Injection
 * - Open/Closed: Open for extension, closed for modification
 * - No implementation details here - only the contract
 */

export interface AIRequest {
  prompt: string;
  userId: number;
  context?: Record<string, any>;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed: number;
  timestamp: Date;
}

export interface AIProvider {
  /**
   * Send prompt to AI provider and get response
   */
  generateResponse(request: AIRequest): Promise<AIResponse>;

  /**
   * Health check - verify API connection
   */
  healthCheck(): Promise<boolean>;

  /**
   * Get provider name
   */
  getProviderName(): string;

  /**
   * Get current rate limit status
   */
  getRateLimit(): Promise<{ remaining: number; reset: Date }>;
}

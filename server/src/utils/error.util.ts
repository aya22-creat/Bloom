/**
 * Custom Error Class - AppError
 * 
 * ARCHITECTURE DECISION:
 * - Extends Error with HTTP status codes
 * - Provides structured error handling
 * - Compatible with error handler middleware
 * - Type-safe error responses
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON() {
    return {
      success: false,
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Generic Response DTOs - Standardized API responses
 * 
 * ARCHITECTURE DECISION:
 * - All API responses follow consistent format
 * - Type-safe success/error responses
 * - Easier client-side handling
 */

export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  statusCode: number;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  statusCode: number;
  timestamp: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp: string;
}

/**
 * Generic response wrapper
 */
export class ApiResponse {
  static success<T>(data: T, message?: string, statusCode: number = 200): SuccessResponse<T> {
    return {
      success: true,
      data,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    };
  }

  static error(error: string, code: string, statusCode: number = 400, details?: Record<string, any>): ErrorResponse {
    return {
      success: false,
      error,
      code,
      statusCode,
      timestamp: new Date().toISOString(),
      details,
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
  ): PaginatedResponse<T> {
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    };
  }
}

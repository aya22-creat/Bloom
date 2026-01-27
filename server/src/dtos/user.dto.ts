/**
 * User DTOs - Data Transfer Objects
 * 
 * ARCHITECTURE DECISION:
 * - Separate DTOs from database entities
 * - Control what data is sent/received from API
 * - Type safety for requests/responses
 * - Prevents accidental exposure of internal fields
 * 
 * PATTERN: DTO Pattern
 * - Decouples API contracts from database schema
 * - Easier API versioning
 * - Clear request/response contracts
 */

export namespace UserDTO {
  /**
   * Request DTOs
   */

  export interface RegisterRequest {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
  }

  export interface LoginRequest {
    email: string;
    password: string;
  }

  export interface UpdateProfileRequest {
    username?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    phone?: string;
    address?: string;
  }

  export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }

  export interface RefreshTokenRequest {
    refreshToken: string;
  }

  /**
   * Response DTOs
   */

  export interface UserResponse {
    id: number;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    createdAt: Date;
    updatedAt?: Date;
    // Note: password is NEVER included
  }

  export interface AuthResponse {
    success: true;
    data: {
      user: UserResponse;
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
    message: string;
    timestamp: string;
  }

  export interface LoginResponse extends AuthResponse {}

  export interface RegisterResponse extends AuthResponse {}

  export interface RefreshTokenResponse {
    success: true;
    data: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
    timestamp: string;
  }
}

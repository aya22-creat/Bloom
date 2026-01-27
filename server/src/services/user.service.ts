/**
 * UserService - Business logic layer for User operations
 * 
 * ARCHITECTURE DECISION:
 * - Contains all user-related business logic
 * - Depends on UserRepository (not Database directly)
 * - No Express/HTTP objects (req, res) allowed here
 * - Orchestrates multiple repositories if needed
 * - Handles validation, transformations, and business rules
 * 
 * PATTERN: Service Layer + Dependency Injection
 * - Services are testable (inject mock repositories)
 * - Business logic separate from HTTP layer
 * - Reusable across multiple controllers/APIs
 * - Single Responsibility: User domain logic only
 */

import { User } from '../types/user';
import { userRepository } from '../repositories/user.repository';
import { PasswordUtil } from '../utils/password.util';
import { JwtUtil } from '../utils/jwt.util';
import { AppError } from '../utils/error.util';
import { HttpStatus } from '../constants/http-status';

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserRegisterRequest {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  createdAt?: Date;
  // Note: password and sensitiveData NEVER returned
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class UserService {
  /**
   * Register new user
   * BUSINESS LOGIC:
   * - Validate input
   * - Check if email/username already exists
   * - Hash password before saving
   * - Return user without password
   */
  async register(request: UserRegisterRequest): Promise<{ user: UserResponse; tokens: AuthToken }> {
    // Validation
    if (request.password !== request.confirmPassword) {
      throw new AppError('Passwords do not match', HttpStatus.BAD_REQUEST);
    }

    if (request.password.length < 8) {
      throw new AppError('Password must be at least 8 characters', HttpStatus.BAD_REQUEST);
    }

    // Check uniqueness
    const emailExists = await userRepository.emailExists(request.email);
    if (emailExists) {
      throw new AppError('Email already registered', HttpStatus.CONFLICT);
    }

    const usernameExists = await userRepository.usernameExists(request.username);
    if (usernameExists) {
      throw new AppError('Username already taken', HttpStatus.CONFLICT);
    }

    // Hash password
    const hashedPassword = await PasswordUtil.hash(request.password);

    // Create user
    const user = await userRepository.create({
      email: request.email,
      username: request.username,
      password: hashedPassword,
      created_at: new Date().toISOString(),
    });

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Return safe user object (no password)
    const userResponse = this.sanitizeUser(user);

    return { user: userResponse, tokens };
  }

  /**
   * Login user
   * BUSINESS LOGIC:
   * - Find user by email
   * - Verify password
   * - Generate JWT tokens
   */
  async login(request: UserLoginRequest): Promise<{ user: UserResponse; tokens: AuthToken }> {
    // Find user
    const user = await userRepository.findByEmail(request.email);
    if (!user) {
      throw new AppError('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    // Verify password
    const isPasswordValid = await PasswordUtil.compare(request.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    // Generate tokens
    const tokens = this.generateTokens(user);
    const userResponse = this.sanitizeUser(user);

    return { user: userResponse, tokens };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<UserResponse | null> {
    const user = await userRepository.findById(id);
    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * Update user
   */
  async updateUser(id: number, data: Partial<User>): Promise<UserResponse | null> {
    // Never allow password updates through this method
    const { password, ...safeData } = data;

    const user = await userRepository.update(id, safeData);
    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * Delete user
   */
  async deleteUser(id: number): Promise<boolean> {
    return userRepository.delete(id);
  }

  /**
   * Change password
   * BUSINESS LOGIC:
   * - Verify current password
   * - Hash new password
   * - Update user
   */
  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', HttpStatus.NOT_FOUND);
    }

    const isOldPasswordValid = await PasswordUtil.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new AppError('Current password is incorrect', HttpStatus.UNAUTHORIZED);
    }

    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await PasswordUtil.hash(newPassword);
    await userRepository.update(userId, { password: hashedPassword });
  }

  /**
   * HELPER METHODS
   */

  private generateTokens(user: User): AuthToken {
    const userId = user.id!; // Should always exist for authenticated user
    const accessToken = JwtUtil.sign(
      { id: userId, email: user.email, type: 'access' },
      process.env.JWT_SECRET || 'your-secret-key',
      '24h'
    );

    const refreshToken = JwtUtil.sign(
      { id: userId, email: user.email, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      '7d'
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 86400, // 24 hours in seconds
    };
  }

  private sanitizeUser(user: User): UserResponse {
    const { password, ...safe } = user;
    return safe as UserResponse;
  }
}

// Singleton pattern - export single instance
export const userService = new UserService();

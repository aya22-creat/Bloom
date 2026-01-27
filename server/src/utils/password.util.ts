/**
 * Password Utility - Password hashing and verification
 * 
 * ARCHITECTURE DECISION:
 * - Centralizes password security logic
 * - Uses bcryptjs for hashing (industry standard)
 * - Prevents plain text password storage
 * - Configurable salt rounds for security level
 */

import * as bcrypt from 'bcryptjs';

export class PasswordUtil {
  private static readonly SALT_ROUNDS = 10; // Balance between security and performance

  /**
   * Hash a password using bcryptjs
   * @param password - Plain text password
   * @returns Promise resolving to hashed password
   */
  static async hash(password: string): Promise<string> {
    try {
      // Validate password strength
      if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
      return hashedPassword;
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Compare plain text password with hashed password
   * @param plainPassword - Plain text password to verify
   * @param hashedPassword - Hashed password from database
   * @returns Promise resolving to boolean indicating match
   */
  static async compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error comparing passwords:', error);
      throw new Error('Failed to verify password');
    }
  }

  /**
   * Check password strength
   * @param password - Password to check
   * @returns Object with strength info
   */
  static checkStrength(password: string): {
    score: number; // 0-4
    feedback: string[];
    isStrong: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push('Password should be at least 8 characters');

    if (password.length >= 12) score++;
    else if (password.length >= 8) feedback.push('Consider using 12+ characters for better security');

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    else feedback.push('Use both uppercase and lowercase letters');

    if (/\d/.test(password)) score++;
    else feedback.push('Include at least one number');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    else feedback.push('Include special characters (!@#$%^&*) for maximum security');

    return {
      score: Math.min(score, 4),
      feedback,
      isStrong: score >= 3,
    };
  }

  /**
   * Generate random password
   * @param length - Length of generated password
   * @returns Random password string
   */
  static generateRandom(length: number = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
  }
}

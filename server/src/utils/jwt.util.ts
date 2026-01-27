/**
 * JWT Utility - JSON Web Token operations
 * 
 * ARCHITECTURE DECISION:
 * - Centralized JWT handling
 * - Sign tokens with expiration
 * - Verify tokens and extract payload
 * - Prevents JWT logic scattered throughout code
 */

import { sign, verify, decode, TokenExpiredError, JsonWebTokenError, SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
  id: number;
  email: string;
  type?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export class JwtUtil {
  /**
   * Sign a new JWT token
   * @param payload - Data to encode in token
   * @param secret - Secret key for signing
   * @param expiresIn - Expiration time (e.g., '24h', '7d')
   * @returns JWT token string
   */
  static sign(payload: JwtPayload, secret: string, expiresIn: string = '24h'): string {
    try {
      const options: SignOptions = { expiresIn: expiresIn as any };
      return sign(payload, secret, options);
    } catch (error) {
      console.error('Error signing JWT:', error);
      throw new Error('Failed to sign token');
    }
  }

  /**
   * Verify and decode a JWT token
   * @param token - JWT token string
   * @param secret - Secret key for verification
   * @returns Decoded payload
   * @throws Error if token is invalid or expired
   */
  static verify(token: string, secret: string): JwtPayload {
    try {
      const decoded = verify(token, secret) as JwtPayload;
      return decoded;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new Error('Token has expired');
      }
      if (error instanceof JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Decode token without verification (unsafe, use cautiously)
   * @param token - JWT token string
   * @returns Decoded payload
   */
  static decode(token: string): JwtPayload | null {
    try {
      return decode(token) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   * @param token - JWT token string
   * @returns Boolean indicating if expired
   */
  static isExpired(token: string): boolean {
    const payload = this.decode(token);
    if (!payload || !payload.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  }

  /**
   * Get time until expiration
   * @param token - JWT token string
   * @returns Seconds until expiration
   */
  static getTimeUntilExpiry(token: string): number {
    const payload = this.decode(token);
    if (!payload || !payload.exp) {
      return 0;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - currentTime);
  }
}

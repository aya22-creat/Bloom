/**
 * UserRepository - Data access layer for User entity
 * 
 * ARCHITECTURE DECISION:
 * - Extends BaseRepository for common CRUD operations
 * - Implements custom queries specific to User (findByEmail, findByUsername)
 * - No business logic here - only database operations
 * - Testable by mocking this repository
 * 
 * PATTERN: Repository Pattern + Data Mapper
 * - Single Responsibility: Only handles data access
 * - Easy to mock for unit tests
 * - Database-agnostic (implementation detail)
 */

import { BaseRepository } from './base.repository';
import { User } from '../types/user';
import { Database } from '../lib/database';

export interface IUserRepository {
  findById(id: number): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(data: Partial<User>): Promise<User>;
  update(id: number, data: Partial<User>): Promise<User | null>;
  delete(id: number): Promise<boolean>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  emailExists(email: string): Promise<boolean>;
  usernameExists(username: string): Promise<boolean>;
}

export class UserRepository extends BaseRepository<User> implements IUserRepository {
  constructor() {
    super('users');
  }

  /**
   * Find user by email (commonly used for login)
   * @param email - User email
   * @returns User or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM ${this.tableName} WHERE email = ?`;
      Database.db.get(query, [email], (err: Error | null, row: any) => {
        if (err) {
          console.error('Error finding user by email:', err);
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  /**
   * Find user by username
   * @param username - User username
   * @returns User or null if not found
   */
  async findByUsername(username: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM ${this.tableName} WHERE username = ?`;
      Database.db.get(query, [username], (err: Error | null, row: any) => {
        if (err) {
          console.error('Error finding user by username:', err);
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  /**
   * Check if email already exists
   * @param email - Email to check
   * @returns Boolean indicating existence
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const user = await this.findByEmail(email);
      return user !== null;
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw error;
    }
  }

  /**
   * Check if username already exists
   * @param username - Username to check
   * @returns Boolean indicating existence
   */
  async usernameExists(username: string): Promise<boolean> {
    try {
      const user = await this.findByUsername(username);
      return user !== null;
    } catch (error) {
      console.error('Error checking username existence:', error);
      throw error;
    }
  }
}

// Singleton pattern - export single instance
export const userRepository = new UserRepository();

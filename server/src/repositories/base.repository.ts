/**
 * BaseRepository - Abstract base class for all repositories
 * 
 * ARCHITECTURE DECISION:
 * - Centralizes common database operations (CRUD)
 * - All repositories inherit from this to ensure consistency
 * - Prevents code duplication across repositories
 * - Type-safe with generics
 * 
 * PATTERN: Repository Pattern for Data Abstraction
 * - Isolates data access logic from business logic
 * - Makes testing easier (mock repositories)
 * - Allows easy database switching without touching services
 */

import { Database } from '../lib/database';

export interface IRepository<T> {
  findById(id: number): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: number, data: Partial<T>): Promise<T | null>;
  delete(id: number): Promise<boolean>;
}

export abstract class BaseRepository<T> implements IRepository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Find entity by ID
   * @param id - Primary key
   * @returns Entity or null if not found
   */
  async findById(id: number): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      Database.db.get(query, [id], (err: Error | null, row: any) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  /**
   * Find all entities
   * @returns Array of entities
   */
  async findAll(): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM ${this.tableName}`;
      Database.db.all(query, [], (err: Error | null, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Create new entity
   * @param data - Partial entity data
   * @returns Created entity with ID
   */
  async create(data: Partial<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(',');
      const query = `INSERT INTO ${this.tableName} (${keys.join(',')}) VALUES (${placeholders})`;

      Database.db.run(query, values, function (this: any, err: Error | null) {
        if (err) reject(err);
        else {
          const createdEntity = { id: this.lastID, ...data } as T;
          resolve(createdEntity);
        }
      });
    });
  }

  /**
   * Update entity
   * @param id - Primary key
   * @param data - Partial entity data to update
   * @returns Updated entity or null if not found
   */
  async update(id: number, data: Partial<T>): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const setClause = keys.map((key) => `${key} = ?`).join(',');
      const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;

      Database.db.run(query, [...values, id], function (this: any, err: Error | null) {
        if (err) reject(err);
        else {
          const updatedEntity = { id, ...data } as T;
          resolve(updatedEntity);
        }
      });
    });
  }

  /**
   * Delete entity
   * @param id - Primary key
   * @returns Boolean indicating success
   */
  async delete(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
      Database.db.run(query, [id], function (this: any, err: Error | null) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  /**
   * Execute custom query (use sparingly)
   * @param query - SQL query
   * @param params - Query parameters
   * @returns Query results
   */
  protected async executeQuery(query: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      Database.db.run(query, params, function (this: any, err: Error | null) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }
}

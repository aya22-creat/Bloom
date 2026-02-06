/**
 * Audit logging service
 */

import { Database } from '../lib/database';

interface AuditLogInput {
  user_id: number;
  action: string;
  entity_type?: string;
  entity_id?: number;
  details?: string;
  ip_address?: string;
}

/**
 * Log an audit event
 */
export const logAudit = async (input: AuditLogInput): Promise<void> => {
  return new Promise((resolve, reject) => {
    Database.db.run(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        input.user_id,
        input.action,
        input.entity_type || null,
        input.entity_id || null,
        input.details || null,
        input.ip_address || null,
      ],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};

/**
 * Get audit logs with filtering
 */
export const getAuditLogs = async (filters: {
  userId?: number;
  action?: string;
  entityType?: string;
  limit?: number;
  offset?: number;
}) => {
  let query = `
    SELECT al.*, u.username, u.email 
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters.userId) {
    query += ' AND al.user_id = ?';
    params.push(filters.userId);
  }

  if (filters.action) {
    query += ' AND al.action = ?';
    params.push(filters.action);
  }

  if (filters.entityType) {
    query += ' AND al.entity_type = ?';
    params.push(filters.entityType);
  }

  query += ' ORDER BY al.created_at DESC';

  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
    
    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }
  }

  return new Promise<any[]>((resolve, reject) => {
    Database.db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

import dotenv from 'dotenv';
// @ts-ignore
const sql = require('msnodesqlv8');

dotenv.config();

export interface RunResult {
  lastID: number;
  changes: number;
}

class SqlServerAdapter {
  private conn: any;

  constructor(conn: any) {
    this.conn = conn;
  }

  run(
    query: string,
    params: any[] | ((this: RunResult, err: Error | null) => void),
    callback?: (this: RunResult, err: Error | null) => void
  ): void {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    params = params || [];

    let finalQuery = query;
    const isInsert = /^\s*INSERT\s+INTO/i.test(query);
    const isUpdateOrDelete = /^\s*(UPDATE|DELETE)/i.test(query);

    if (isInsert) {
      finalQuery += '; SELECT SCOPE_IDENTITY() AS id;';
    } else if (isUpdateOrDelete) {
      finalQuery += '; SELECT @@ROWCOUNT AS changes;';
    }

    this.conn.query(finalQuery, params, (err: Error, rows: any[]) => {
      if (err) {
        if (callback) {
           callback.call({ lastID: 0, changes: 0 }, err);
        }
        return;
      }

      let lastID = 0;
      let changes = 0;

      if (isInsert && rows && rows.length > 0) {
        lastID = rows[0].id;
        changes = 1;
      } else if (isUpdateOrDelete && rows && rows.length > 0) {
        changes = rows[0].changes;
      }

      if (callback) {
        callback.call({ lastID, changes }, null);
      }
    });
  }

  get(
    query: string,
    params: any[] | ((err: Error | null, row: any) => void),
    callback?: (err: Error | null, row: any) => void
  ): void {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    params = params || [];

    this.conn.query(query, params, (err: Error, rows: any[]) => {
      if (callback) {
        callback(err, rows && rows.length > 0 ? rows[0] : null);
      }
    });
  }

  all(
    query: string,
    params: any[] | ((err: Error | null, rows: any[]) => void),
    callback?: (err: Error | null, rows: any[]) => void
  ): void {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    params = params || [];

    this.conn.query(query, params, (err: Error, rows: any[]) => {
      if (callback) {
        callback(err, rows || []);
      }
    });
  }
}

export class Database {
  static db: SqlServerAdapter;

  static async init() {
    console.log('📦 Initializing SQL Server connection...');
    const connString = `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || '.\\SQLEXPRESS'};Database=${process.env.DB_NAME || 'BloomHopeDB'};Trusted_Connection=yes;`;
    
    return new Promise<void>((resolve, reject) => {
      sql.open(connString, (err: Error, conn: any) => {
        if (err) {
          console.error('❌ Failed to connect to SQL Server:', err);
          reject(err);
          return;
        }
        this.db = new SqlServerAdapter(conn);
        console.log('✅ Connected to SQL Server');
        resolve();
      });
    });
  }
}

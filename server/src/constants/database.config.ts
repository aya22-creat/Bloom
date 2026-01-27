/**
 * Database Configuration
 * 
 * ARCHITECTURE DECISION:
 * - Centralized database configuration
 * - Environment-based settings
 * - Different configs for dev/test/prod
 * - Connection pooling ready
 */

export interface DatabaseConfig {
  type: 'sqlite' | 'mssql' | 'postgres' | 'mysql';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  filepath?: string; // For SQLite
  connectionString?: string; // For others
  pool?: {
    min: number;
    max: number;
  };
  logging: boolean;
  synchronize: boolean; // Auto-create tables
}

const DEFAULT_CONFIG: DatabaseConfig = {
  type: 'sqlite',
  database: process.env.DB_NAME || 'BloomHopeDB',
  logging: process.env.NODE_ENV !== 'production',
  synchronize: process.env.NODE_ENV === 'development',
};

/**
 * Get database config based on environment
 */
export function getDatabaseConfig(): DatabaseConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';

  switch (nodeEnv) {
    case 'production':
      return {
        ...DEFAULT_CONFIG,
        type: (process.env.DB_TYPE as any) || 'mssql',
        host: process.env.DB_SERVER,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
        database: process.env.DB_NAME || 'BloomHopeDB',
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        logging: false,
        synchronize: false,
      };

    case 'test':
      return {
        ...DEFAULT_CONFIG,
        database: ':memory:', // In-memory DB for tests
        logging: false,
        synchronize: true,
      };

    case 'development':
    default:
      return {
        ...DEFAULT_CONFIG,
        type: 'sqlite',
        filepath: process.env.DB_FILE || './data/BloomHopeDB.db',
        logging: true,
        synchronize: true,
      };
  }
}

/**
 * Get database connection string
 */
export function getConnectionString(): string {
  const config = getDatabaseConfig();

  if (config.connectionString) {
    return config.connectionString;
  }

  switch (config.type) {
    case 'mssql':
      return `mssql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;

    case 'postgres':
      return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;

    case 'mysql':
      return `mysql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;

    case 'sqlite':
    default:
      return config.filepath || './data/BloomHopeDB.db';
  }
}

/**
 * Validate database configuration
 */
export function validateDatabaseConfig(): boolean {
  const config = getDatabaseConfig();

  if (config.type === 'sqlite') {
    // SQLite doesn't need validation
    return true;
  }

  // For other databases, ensure required fields are present
  if (!config.host || !config.port || !config.username || !config.password) {
    console.error('Missing required database configuration');
    return false;
  }

  return true;
}

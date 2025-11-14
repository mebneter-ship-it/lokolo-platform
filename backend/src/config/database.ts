import { Pool, PoolConfig } from 'pg';

let pool: Pool | null = null;

const getPoolConfig = (): PoolConfig => {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'lokolo',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };
};

export const initializeDatabase = (): Pool => {
  if (pool) {
    return pool;
  }

  try {
    const config = getPoolConfig();
    pool = new Pool(config);

    pool.on('connect', () => {
      console.log('✅ Database connected');
    });

    pool.on('error', (err) => {
      console.error('❌ Unexpected database error:', err);
      process.exit(-1);
    });

    return pool;
  } catch (error) {
    console.error('❌ Failed to initialize database pool:', error);
    throw error;
  }
};

export const getPool = (): Pool => {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
};

export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection closed');
  }
};

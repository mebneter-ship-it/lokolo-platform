import { Pool, PoolConfig } from 'pg';

let pool: Pool | null = null;

const getPoolConfig = (): PoolConfig => {
  const host = process.env.DB_HOST || 'localhost';
  const isCloudSqlSocket = host.startsWith('/cloudsql/');
  
  const config: PoolConfig = {
    host: host,
    port: isCloudSqlSocket ? undefined : parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'lokolo_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };

  // Only use SSL for non-socket TCP connections in production
  if (process.env.NODE_ENV === 'production' && !isCloudSqlSocket) {
    config.ssl = { rejectUnauthorized: false };
  }

  console.log(`Database config: host=${host}, db=${config.database}, user=${config.user}, isSocket=${isCloudSqlSocket}`);
  
  return config;
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

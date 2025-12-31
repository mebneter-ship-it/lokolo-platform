import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { initializeFirebase } from './config/firebase';
import { initializeDatabase } from './config/database';
import { initializeStorage } from './config/storage';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import routes from './routes';
import analyticsRoutes from './routes/analytics';


dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// Middleware
// ============================================================

app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ============================================================
// Health Check
// ============================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Lokolo Platform API v1',
    version: '1.0.0',
    documentation: '/api/v1/docs',
  });
});

// ============================================================
// API Routes
// ============================================================

app.use('/api/v1', routes);
app.use('/api/v1/analytics', analyticsRoutes);


// ============================================================
// Error Handling
// ============================================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================================
// Initialization & Server Start
// ============================================================

const startServer = async () => {
  try {
    logger.info('Initializing Firebase Admin SDK...');
    initializeFirebase();

    logger.info('Initializing database connection...');
    const pool = initializeDatabase();
    
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection verified');

    logger.info('Initializing Cloud Storage...');
    initializeStorage();

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();

export default app;

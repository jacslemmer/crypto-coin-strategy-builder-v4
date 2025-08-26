import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { createLogger } from '../infra/logging/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import { requestLogger } from './middleware/requestLogger.js';
import { healthRoutes } from './routes/health.js';
import { pairsRoutes } from './routes/pairs.js';
import { chartsRoutes } from './routes/charts.js';
import { analysisRoutes } from './routes/analysis.js';
import { rankingsRoutes } from './routes/rankings.js';
import { jobsRoutes } from './routes/jobs.js';
import { versionsRoutes } from './routes/versions.js';
import type { ServerDeps } from './types.js';
import { createRealServices } from './services/realServices.js';

export function createServer(deps: ServerDeps) {
  const app = express();
  const logger = createLogger({ level: 'info' });

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-domain.com'] 
      : ['http://localhost:3000', 'http://localhost:4000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 1000 : 10000, // requests per window
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
        details: {
          limit: process.env.NODE_ENV === 'production' ? 1000 : 10000,
          reset_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression
  app.use(compression());

  // Request logging
  app.use(requestLogger(logger));

  // Health check (no auth required)
  app.use('/health', healthRoutes());

  // API routes (auth required)
  app.use('/api', authMiddleware);
  app.use('/api/v1/pairs', pairsRoutes(deps));
  app.use('/api/v1/charts', chartsRoutes(deps));
  app.use('/api/v1/analysis', analysisRoutes(deps));
  app.use('/api/v1/rankings', rankingsRoutes(deps));
  app.use('/api/v1/jobs', jobsRoutes(deps));
  app.use('/api/v1/versions', versionsRoutes(deps));

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
        request_id: req.headers['x-request-id'] || 'unknown',
      },
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler(logger));

  return app;
}

export function startServer(port = Number(process.env.PORT ?? 4000), deps?: ServerDeps) {
  const app = createServer(deps || createDefaultDeps());
  
  const server = app.listen(port, () => {
    console.log(`🚀 Server listening on http://localhost:${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🔒 API endpoints: http://localhost:${port}/api`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  });

  return server;
}

function createDefaultDeps(): ServerDeps {
  return createRealServices();
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

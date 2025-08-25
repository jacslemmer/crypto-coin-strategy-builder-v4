import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

export function createSimpleServer() {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-domain.com'] 
      : ['http://localhost:3000', 'http://localhost:4000'],
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression
  app.use(compression());

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '4.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // Simple API test endpoint
  app.get('/api/test', (req, res) => {
    res.json({
      message: 'API is working!',
      timestamp: new Date().toISOString(),
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
      },
    });
  });

  return app;
}

export function startSimpleServer(port = Number(process.env.PORT ?? 4000)) {
  const app = createSimpleServer();
  
  const server = app.listen(port, () => {
    console.log(`🚀 Simple server listening on http://localhost:${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🔒 API test: http://localhost:${port}/api/test`);
  });

  return server;
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startSimpleServer();
}



import { WinstonLogger } from '@infra/logging/logger';
import { SQLiteDatabase } from '@infra/db/connection';
import { ExpressServer } from '@infra/server/server';
import { ServerConfig } from '@ports/server.port';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main(): Promise<void> {
  try {
    // Initialize logger
    const logger = new WinstonLogger();
    logger.info('Starting Crypto Coin Strategy Builder V4...');

    // Initialize database
    const database = new SQLiteDatabase(logger);
    await database.connect();
    logger.info('Database connected successfully');

    // Server configuration
    const serverConfig: ServerConfig = {
      port: parseInt(process.env.PORT || '4000', 10),
      host: process.env.HOST || 'localhost',
      cors: true,
      compression: true,
      helmet: true,
      rateLimit: true
    };

    // Initialize server
    const server = new ExpressServer(logger, serverConfig);
    
    // Start server
    await server.start();
    
    logger.info('Application started successfully', {
      port: server.getPort(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || 'unknown'
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      try {
        await server.stop();
        await database.disconnect();
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown', { error });
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
main().catch((error) => {
  console.error('Application startup failed:', error);
  process.exit(1);
});

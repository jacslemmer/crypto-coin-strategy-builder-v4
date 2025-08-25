import winston from 'winston';
import { join } from 'node:path';

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to Winston
winston.addColors(colors);

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, jobId, ...meta }: any) => {
    const baseLog = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(jobId && { jobId }),
      ...(meta && typeof meta === 'object' ? meta : {}),
    };
    
    return JSON.stringify(baseLog);
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, jobId, ...meta }: any) => {
    const jobInfo = jobId ? `[${jobId}] ` : '';
    const metaInfo = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${jobInfo}${message}${metaInfo}`;
  })
);

// Create logger instance
export function createLogger(options: {
  level?: string;
  jobId?: string;
  logsDir?: string;
  environment?: 'development' | 'production' | 'test';
} = {}) {
  const {
    level = process.env.LOG_LEVEL || 'info',
    jobId,
    logsDir = process.env.LOGS_DIR || './tmp/logs',
    environment = process.env.NODE_ENV || 'development',
  } = options;

  // Create logs directory if it doesn't exist
  const fs = require('node:fs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Define transports
  const transports: winston.transport[] = [];

  // Console transport
  if (environment !== 'test') {
    transports.push(
      new winston.transports.Console({
        level: environment === 'development' ? 'debug' : 'info',
        format: environment === 'development' ? consoleFormat : structuredFormat,
      })
    );
  }

  // File transports for production
  if (environment === 'production') {
    // Error log file
    transports.push(
      new winston.transports.File({
        filename: join(logsDir, 'error.log'),
        level: 'error',
        format: structuredFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );

    // Combined log file
    transports.push(
      new winston.transports.File({
        filename: join(logsDir, 'combined.log'),
        format: structuredFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  }

  // Development file transport
  if (environment === 'development') {
    transports.push(
      new winston.transports.File({
        filename: join(logsDir, 'app.log'),
        format: structuredFormat,
      })
    );
  }

  // Create logger
  const logger = winston.createLogger({
    level,
    levels,
    format: structuredFormat,
    transports,
    // Handle uncaught exceptions
    exceptionHandlers: [
      new winston.transports.File({
        filename: join(logsDir, 'exceptions.log'),
        format: structuredFormat,
      }),
    ],
    // Handle unhandled rejections
    rejectionHandlers: [
      new winston.transports.File({
        filename: join(logsDir, 'rejections.log'),
        format: structuredFormat,
      }),
    ],
  });

  // Create child logger with job ID if provided
  if (jobId) {
    return logger.child({ jobId });
  }

  return logger;
}

// Default logger instance
export const logger = createLogger();

// Export types
export type Logger = winston.Logger;
export type LogLevel = keyof typeof levels;

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createLogger } from '../../../src/infra/logging/logger.js';
import { initializeSentry } from '../../../src/infra/logging/sentry.js';
import { ErrorFactory, ErrorHandler } from '../../../src/infra/logging/errors.js';

describe('Logging System Integration', () => {
  let logsDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    logsDir = await mkdtemp(join(tmpdir(), 'logs-integration-test-'));
    originalEnv = { ...process.env };
    process.env.LOGS_DIR = logsDir;
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create structured logs with job IDs', async () => {
    const logger = createLogger({ jobId: 'job-123' });
    
    // Log different types of messages
    logger.info('Job started', { step: 'initialization' });
    logger.warn('Rate limit approaching', { remaining: 5 });
    logger.error('API call failed', { endpoint: '/api/coins', status: 429 });
    
    // Wait for file writing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if log file was created
    const logFile = join(logsDir, 'app.log');
    expect(existsSync(logFile)).toBe(true);
    
    // Read log file and verify content
    const logContent = readFileSync(logFile, 'utf-8');
    expect(logContent).toContain('job-123');
    expect(logContent).toContain('Job started');
    expect(logContent).toContain('Rate limit approaching');
    expect(logContent).toContain('API call failed');
  });

  it('should handle errors with proper context', () => {
    const logger = createLogger({ jobId: 'job-456' });
    const errorHandler = new ErrorHandler(logger);
    
    // Create a job error
    const jobError = ErrorFactory.jobError(
      'Failed to fetch data',
      'fetch_pairs',
      'api_call',
      { retries: 3, endpoint: '/api/v3/coins' },
      'job-456'
    );
    
    // Handle the error
    errorHandler.handleError(jobError);
    
    // The error should be logged (we can't easily test Sentry in unit tests)
    expect(jobError.jobId).toBe('job-456');
    expect(jobError.code).toBe('JOB_ERROR');
    expect(jobError.context.jobType).toBe('fetch_pairs');
    expect(jobError.context.step).toBe('api_call');
  });

  it('should create different loggers for different job contexts', () => {
    const logger1 = createLogger({ jobId: 'job-111' });
    const logger2 = createLogger({ jobId: 'job-222' });
    
    expect(logger1).toBeDefined();
    expect(logger2).toBeDefined();
    
    // Both loggers should have the same interface
    expect(typeof logger1.info).toBe('function');
    expect(typeof logger1.error).toBe('function');
    expect(typeof logger1.warn).toBe('function');
    expect(typeof logger2.info).toBe('function');
    expect(typeof logger2.error).toBe('function');
    expect(typeof logger2.warn).toBe('function');
  });

  it('should handle Sentry initialization gracefully without DSN', () => {
    // This should not throw even without a Sentry DSN
    expect(() => {
      initializeSentry({}, createLogger());
    }).not.toThrow();
  });

  it('should create error-specific log files in production', async () => {
    process.env.NODE_ENV = 'production';
    const logger = createLogger({ environment: 'production' });
    
    // Log an error
    logger.error('Production error occurred', { 
      component: 'database',
      operation: 'connection'
    });
    
    // Wait for file writing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if error log file was created
    const errorLogFile = join(logsDir, 'error.log');
    const combinedLogFile = join(logsDir, 'combined.log');
    
    expect(existsSync(errorLogFile)).toBe(true);
    expect(existsSync(combinedLogFile)).toBe(true);
    
    // Verify error log contains the error
    const errorLogContent = readFileSync(errorLogFile, 'utf-8');
    expect(errorLogContent).toContain('Production error occurred');
    expect(errorLogContent).toContain('database');
    expect(errorLogContent).toContain('connection');
  });

  it('should provide consistent error handling across different error types', () => {
    const logger = createLogger({ jobId: 'job-789' });
    const errorHandler = new ErrorHandler(logger);
    
    // Test different error types
    const errors = [
      ErrorFactory.databaseError('DB connection failed', 'CONNECT', 'users', {}, 'job-789'),
      ErrorFactory.apiError('Bad request', 400, '/api/health', {}, 'job-789'), // 400 is operational
      ErrorFactory.validationError('Invalid input', 'email', 'invalid-email', {}, 'job-789'),
      ErrorFactory.externalServiceError('CoinGecko API down', 'CoinGecko', '/api/v3/coins', {}, 'job-789'),
    ];
    
    // All errors should have consistent structure
    errors.forEach(error => {
      expect(error.jobId).toBe('job-789');
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.context).toBeDefined();
      expect(typeof error.log).toBe('function');
      expect(typeof error.captureInSentry).toBe('function');
      expect(typeof error.toJSON).toBe('function');
    });
    
    // All errors should be operational (except configuration errors)
    errors.forEach(error => {
      expect(error.isOperational).toBe(true);
    });
  });
});

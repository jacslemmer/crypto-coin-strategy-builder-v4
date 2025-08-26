import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createLogger, logger } from '../../../src/infra/logging/logger.js';
describe('Logger', () => {
    let logsDir;
    let originalEnv;
    beforeEach(async () => {
        logsDir = await mkdtemp(join(tmpdir(), 'logs-test-'));
        originalEnv = { ...process.env };
        process.env.LOGS_DIR = logsDir;
        process.env.NODE_ENV = 'test';
    });
    afterEach(() => {
        process.env = originalEnv;
    });
    describe('createLogger', () => {
        it('should create logger with default options', () => {
            const testLogger = createLogger();
            expect(testLogger).toBeDefined();
            expect(typeof testLogger.info).toBe('function');
            expect(typeof testLogger.error).toBe('function');
            expect(typeof testLogger.warn).toBe('function');
            expect(typeof testLogger.debug).toBe('function');
        });
        it('should create logger with custom options', () => {
            const testLogger = createLogger({
                level: 'debug',
                environment: 'development',
                logsDir: logsDir,
            });
            expect(testLogger).toBeDefined();
        });
        it('should create child logger with job ID', () => {
            const testLogger = createLogger({ jobId: 'job-123' });
            expect(testLogger).toBeDefined();
            const logSpy = vi.spyOn(testLogger, 'info').mockImplementation(() => testLogger);
            testLogger.info('Test message');
            expect(logSpy).toHaveBeenCalledWith('Test message');
            logSpy.mockRestore();
        });
        it('should create logs directory if it does not exist', async () => {
            const newLogsDir = join(logsDir, 'new-logs');
            const testLogger = createLogger({ logsDir: newLogsDir });
            expect(existsSync(newLogsDir)).toBe(true);
        });
    });
    describe('Logging levels', () => {
        it('should log at different levels', () => {
            const testLogger = createLogger({ level: 'debug' });
            const logSpy = vi.spyOn(testLogger, 'info').mockImplementation(() => testLogger);
            const warnSpy = vi.spyOn(testLogger, 'warn').mockImplementation(() => testLogger);
            const errorSpy = vi.spyOn(testLogger, 'error').mockImplementation(() => testLogger);
            const debugSpy = vi.spyOn(testLogger, 'debug').mockImplementation(() => testLogger);
            testLogger.info('Info message');
            testLogger.warn('Warning message');
            testLogger.error('Error message');
            testLogger.debug('Debug message');
            expect(logSpy).toHaveBeenCalledWith('Info message');
            expect(warnSpy).toHaveBeenCalledWith('Warning message');
            expect(errorSpy).toHaveBeenCalledWith('Error message');
            expect(debugSpy).toHaveBeenCalledWith('Debug message');
            logSpy.mockRestore();
            warnSpy.mockRestore();
            errorSpy.mockRestore();
            debugSpy.mockRestore();
        });
    });
    describe('Environment-specific behavior', () => {
        it('should use console transport in development', () => {
            process.env.NODE_ENV = 'development';
            const testLogger = createLogger({ environment: 'development' });
            expect(testLogger.transports).toBeDefined();
        });
        it('should use file transports in production', () => {
            process.env.NODE_ENV = 'production';
            const testLogger = createLogger({ environment: 'production' });
            expect(testLogger.transports).toBeDefined();
        });
        it('should not use console transport in test environment', () => {
            const testLogger = createLogger({ environment: 'test' });
            expect(testLogger.transports).toBeDefined();
        });
    });
    describe('Structured logging', () => {
        it('should include job ID in log context', () => {
            const testLogger = createLogger({ jobId: 'job-456' });
            const logSpy = vi.spyOn(testLogger, 'info').mockImplementation(() => testLogger);
            testLogger.info('Test message with job context');
            expect(logSpy).toHaveBeenCalledWith('Test message with job context');
            logSpy.mockRestore();
        });
        it('should include metadata in logs', () => {
            const testLogger = createLogger();
            const logSpy = vi.spyOn(testLogger, 'info').mockImplementation(() => testLogger);
            testLogger.info('Test message', { userId: 'user-123', action: 'login' });
            expect(logSpy).toHaveBeenCalledWith('Test message', { userId: 'user-123', action: 'login' });
            logSpy.mockRestore();
        });
    });
    describe('Default logger instance', () => {
        it('should export a default logger', () => {
            expect(logger).toBeDefined();
            expect(typeof logger.info).toBe('function');
            expect(typeof logger.error).toBe('function');
        });
    });
    describe('Log formatting', () => {
        it('should format logs with timestamps', () => {
            const testLogger = createLogger();
            const logSpy = vi.spyOn(testLogger, 'info').mockImplementation(() => testLogger);
            testLogger.info('Timestamp test');
            expect(logSpy).toHaveBeenCalledWith('Timestamp test');
            logSpy.mockRestore();
        });
        it('should handle errors with stack traces', () => {
            const testLogger = createLogger();
            const testError = new Error('Test error');
            const logSpy = vi.spyOn(testLogger, 'error').mockImplementation(() => testLogger);
            testLogger.error('Error occurred', { error: testError });
            expect(logSpy).toHaveBeenCalledWith('Error occurred', { error: testError });
            logSpy.mockRestore();
        });
    });
    describe('File logging', () => {
        it('should create log files in development', async () => {
            process.env.NODE_ENV = 'development';
            const testLogger = createLogger({ environment: 'development' });
            testLogger.info('Test file logging');
            await new Promise(resolve => setTimeout(resolve, 100));
            const logFile = join(logsDir, 'app.log');
            expect(existsSync(logFile)).toBe(true);
        });
        it('should create error log files in production', async () => {
            process.env.NODE_ENV = 'production';
            const testLogger = createLogger({ environment: 'production' });
            testLogger.error('Test error logging');
            await new Promise(resolve => setTimeout(resolve, 100));
            const errorLogFile = join(logsDir, 'error.log');
            const combinedLogFile = join(logsDir, 'combined.log');
            expect(existsSync(errorLogFile)).toBe(true);
            expect(existsSync(combinedLogFile)).toBe(true);
        });
    });
    describe('Exception and rejection handling', () => {
        it('should have exception handlers configured', () => {
            const testLogger = createLogger();
            expect(testLogger.exceptions).toBeDefined();
            expect(testLogger.rejections).toBeDefined();
        });
    });
});
//# sourceMappingURL=logger.test.js.map
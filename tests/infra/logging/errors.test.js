import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppError, DatabaseError, ApiError, ValidationError, JobError, ExternalServiceError, ConfigurationError, ErrorFactory, ErrorHandler, } from '../../../src/infra/logging/errors.js';
describe('Error Classes', () => {
    let mockLogger;
    beforeEach(() => {
        mockLogger = {
            warn: vi.fn(),
            error: vi.fn(),
            info: vi.fn(),
        };
    });
    describe('AppError', () => {
        it('should create base error with all properties', () => {
            const error = new DatabaseError('Test error', 'TEST', undefined, { test: 'data' }, 'job-123');
            expect(error.message).toBe('Test error');
            expect(error.code).toBe('DATABASE_ERROR');
            expect(error.isOperational).toBe(true);
            expect(error.context).toEqual({ operation: 'TEST', test: 'data' });
            expect(error.jobId).toBe('job-123');
            expect(error.timestamp).toBeInstanceOf(Date);
            expect(error.stack).toBeDefined();
        });
        it('should log operational errors as warnings', () => {
            const error = new DatabaseError('Operational error', 'OP', undefined, {}, 'job-123');
            error.log(mockLogger);
            expect(mockLogger.warn).toHaveBeenCalledWith('Operational error occurred', {
                error: 'Operational error',
                code: 'DATABASE_ERROR',
                isOperational: true,
                context: { operation: 'OP' },
                timestamp: error.timestamp.toISOString(),
                jobId: 'job-123',
                stack: error.stack,
            });
        });
        it('should log system errors as errors', () => {
            const error = new ApiError('System error', 500, undefined, {}, 'job-123');
            error.log(mockLogger);
            expect(mockLogger.error).toHaveBeenCalledWith('System error occurred', {
                error: 'System error',
                code: 'API_ERROR',
                isOperational: false,
                context: { statusCode: 500 },
                timestamp: error.timestamp.toISOString(),
                jobId: 'job-123',
                stack: error.stack,
            });
        });
        it('should convert to JSON correctly', () => {
            const error = new DatabaseError('Test error', 'TEST', undefined, { test: 'data' }, 'job-123');
            const json = error.toJSON();
            expect(json).toEqual({
                name: 'DatabaseError',
                message: 'Test error',
                code: 'DATABASE_ERROR',
                isOperational: true,
                context: { operation: 'TEST', test: 'data' },
                timestamp: error.timestamp.toISOString(),
                jobId: 'job-123',
                stack: error.stack,
            });
        });
    });
    describe('DatabaseError', () => {
        it('should create database error with operation and table', () => {
            const error = new DatabaseError('Database failed', 'INSERT', 'users', { userId: '123' }, 'job-456');
            expect(error.message).toBe('Database failed');
            expect(error.code).toBe('DATABASE_ERROR');
            expect(error.isOperational).toBe(true);
            expect(error.context.operation).toBe('INSERT');
            expect(error.context.table).toBe('users');
            expect(error.context.userId).toBe('123');
            expect(error.jobId).toBe('job-456');
        });
    });
    describe('ApiError', () => {
        it('should create API error with status code', () => {
            const error = new ApiError('Not found', 404, '/api/users', { userId: '123' }, 'job-789');
            expect(error.message).toBe('Not found');
            expect(error.code).toBe('API_ERROR');
            expect(error.statusCode).toBe(404);
            expect(error.isOperational).toBe(true);
            expect(error.context.endpoint).toBe('/api/users');
            expect(error.context.statusCode).toBe(404);
        });
        it('should mark 5xx errors as system errors', () => {
            const error = new ApiError('Internal server error', 500, '/api/users', {}, 'job-789');
            expect(error.statusCode).toBe(500);
            expect(error.isOperational).toBe(false);
        });
    });
    describe('ValidationError', () => {
        it('should create validation error with field and value', () => {
            const error = new ValidationError('Invalid email', 'email', 'invalid-email', { form: 'login' }, 'job-101');
            expect(error.message).toBe('Invalid email');
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.field).toBe('email');
            expect(error.value).toBe('invalid-email');
            expect(error.context.form).toBe('login');
        });
    });
    describe('JobError', () => {
        it('should create job error with type and step', () => {
            const error = new JobError('Job failed', 'fetch_pairs', 'api_call', { limit: 100 }, 'job-202');
            expect(error.message).toBe('Job failed');
            expect(error.code).toBe('JOB_ERROR');
            expect(error.jobType).toBe('fetch_pairs');
            expect(error.step).toBe('api_call');
            expect(error.context.limit).toBe(100);
        });
    });
    describe('ExternalServiceError', () => {
        it('should create external service error with service and endpoint', () => {
            const error = new ExternalServiceError('Service unavailable', 'CoinGecko', '/api/v3/coins', { retries: 3 }, 'job-303');
            expect(error.message).toBe('Service unavailable');
            expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
            expect(error.service).toBe('CoinGecko');
            expect(error.endpoint).toBe('/api/v3/coins');
            expect(error.context.retries).toBe(3);
        });
    });
    describe('ConfigurationError', () => {
        it('should create configuration error with config key', () => {
            const error = new ConfigurationError('Missing API key', 'SENTRY_DSN', { env: 'production' }, 'job-404');
            expect(error.message).toBe('Missing API key');
            expect(error.code).toBe('CONFIGURATION_ERROR');
            expect(error.configKey).toBe('SENTRY_DSN');
            expect(error.isOperational).toBe(false);
            expect(error.context.env).toBe('production');
        });
    });
});
describe('ErrorFactory', () => {
    it('should create errors with job context', () => {
        const error = ErrorFactory.withJobContext(DatabaseError, 'job-123', 'Database failed', 'INSERT', 'users', { userId: '123' });
        expect(error).toBeInstanceOf(DatabaseError);
        expect(error.jobId).toBe('job-123');
        expect(error.message).toBe('Database failed');
    });
    it('should create database errors', () => {
        const error = ErrorFactory.databaseError('DB failed', 'SELECT', 'users', { table: 'users' }, 'job-123');
        expect(error).toBeInstanceOf(DatabaseError);
        expect(error.message).toBe('DB failed');
        expect(error.context.operation).toBe('SELECT');
        expect(error.context.table).toBe('users');
    });
    it('should create API errors', () => {
        const error = ErrorFactory.apiError('Not found', 404, '/api/users', { path: '/api/users' }, 'job-123');
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(404);
        expect(error.context.endpoint).toBe('/api/users');
    });
    it('should create validation errors', () => {
        const error = ErrorFactory.validationError('Invalid input', 'email', 'test', { form: 'login' }, 'job-123');
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe('email');
        expect(error.value).toBe('test');
    });
    it('should create job errors', () => {
        const error = ErrorFactory.jobError('Job failed', 'fetch_pairs', 'api_call', { limit: 100 }, 'job-123');
        expect(error).toBeInstanceOf(JobError);
        expect(error.jobType).toBe('fetch_pairs');
        expect(error.step).toBe('api_call');
    });
    it('should create external service errors', () => {
        const error = ErrorFactory.externalServiceError('Service down', 'CoinGecko', '/api/v3/coins', { retries: 3 }, 'job-123');
        expect(error).toBeInstanceOf(ExternalServiceError);
        expect(error.service).toBe('CoinGecko');
        expect(error.endpoint).toBe('/api/v3/coins');
    });
    it('should create configuration errors', () => {
        const error = ErrorFactory.configurationError('Missing config', 'API_KEY', { env: 'prod' }, 'job-123');
        expect(error).toBeInstanceOf(ConfigurationError);
        expect(error.configKey).toBe('API_KEY');
    });
});
describe('ErrorHandler', () => {
    let errorHandler;
    let mockLogger;
    beforeEach(() => {
        mockLogger = {
            warn: vi.fn(),
            error: vi.fn(),
            info: vi.fn(),
        };
        errorHandler = new ErrorHandler(mockLogger);
    });
    describe('handleError', () => {
        it('should handle AppError instances', () => {
            const error = new DatabaseError('DB failed', 'INSERT', 'users', {}, 'job-123');
            vi.spyOn(error, 'captureInSentry').mockReturnValue('sentry-event-id');
            errorHandler.handleError(error);
            expect(mockLogger.warn).toHaveBeenCalled();
            expect(error.captureInSentry).toHaveBeenCalled();
        });
        it('should handle generic Error instances', () => {
            const error = new Error('Generic error');
            vi.doMock('../../../src/infra/logging/sentry.js', () => ({
                captureError: vi.fn().mockReturnValue('sentry-event-id'),
            }));
            errorHandler.handleError(error);
            expect(mockLogger.error).toHaveBeenCalledWith('Unhandled error occurred', {
                error: 'Generic error',
                stack: error.stack,
                context: undefined,
            });
        });
    });
    describe('handleAsyncError', () => {
        it('should handle successful promises', async () => {
            const promise = Promise.resolve('success');
            const result = await errorHandler.handleAsyncError(promise, { context: 'test' });
            expect(result).toBe('success');
        });
        it('should handle failed promises', async () => {
            const promise = Promise.reject(new Error('Promise failed'));
            const result = await errorHandler.handleAsyncError(promise, { context: 'test' });
            expect(result).toBeNull();
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });
    describe('wrapAsync', () => {
        it('should wrap successful async functions', async () => {
            const asyncFn = async (x) => x * 2;
            const wrappedFn = errorHandler.wrapAsync(asyncFn, { context: 'test' });
            const result = await wrappedFn(5);
            expect(result).toBe(10);
        });
        it('should wrap failed async functions', async () => {
            const asyncFn = async (x) => {
                if (x < 0)
                    throw new Error('Negative number');
                return x * 2;
            };
            const wrappedFn = errorHandler.wrapAsync(asyncFn, { context: 'test' });
            const result = await wrappedFn(-5);
            expect(result).toBeNull();
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });
});
describe('Error Integration', () => {
    it('should maintain proper inheritance chain', () => {
        const dbError = new DatabaseError('DB failed', 'INSERT', 'users');
        const apiError = new ApiError('Not found', 404);
        const validationError = new ValidationError('Invalid input', 'email');
        expect(dbError).toBeInstanceOf(AppError);
        expect(apiError).toBeInstanceOf(AppError);
        expect(validationError).toBeInstanceOf(AppError);
        expect(dbError).toBeInstanceOf(DatabaseError);
        expect(apiError).toBeInstanceOf(ApiError);
        expect(validationError).toBeInstanceOf(ValidationError);
    });
    it('should handle job context consistently', () => {
        const jobId = 'job-123';
        const dbError = ErrorFactory.databaseError('DB failed', 'INSERT', 'users', {}, jobId);
        const apiError = ErrorFactory.apiError('Not found', 404, '/api/users', {}, jobId);
        const jobError = ErrorFactory.jobError('Job failed', 'fetch_pairs', 'api_call', {}, jobId);
        expect(dbError.jobId).toBe(jobId);
        expect(apiError.jobId).toBe(jobId);
        expect(jobError.jobId).toBe(jobId);
    });
});
//# sourceMappingURL=errors.test.js.map
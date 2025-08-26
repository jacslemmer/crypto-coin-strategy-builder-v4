import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as Sentry from '@sentry/node';
import { initializeSentry, captureError, captureMessage, setUser, setTag, setExtra, setJobContext, flushSentry, closeSentry, } from '../../../src/infra/logging/sentry.js';
vi.mock('@sentry/node', () => ({
    default: {
        init: vi.fn(),
        captureException: vi.fn(),
        captureMessage: vi.fn(),
        setUser: vi.fn(),
        setTag: vi.fn(),
        setExtra: vi.fn(),
        flush: vi.fn(),
        close: vi.fn(),
    },
    init: vi.fn(),
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    setUser: vi.fn(),
    setTag: vi.fn(),
    setExtra: vi.fn(),
    flush: vi.fn(),
    close: vi.fn(),
}));
describe('Sentry Integration', () => {
    let mockLogger;
    let originalEnv;
    beforeEach(() => {
        mockLogger = {
            warn: vi.fn(),
            error: vi.fn(),
            info: vi.fn(),
        };
        originalEnv = { ...process.env };
        vi.clearAllMocks();
    });
    afterEach(() => {
        process.env = originalEnv;
    });
    describe('initializeSentry', () => {
        it('should initialize Sentry with default configuration', () => {
            process.env.SENTRY_DSN = 'https://test@sentry.io/123';
            process.env.NODE_ENV = 'development';
            process.env.NODE_ENV = 'development';
            initializeSentry({}, mockLogger);
            expect(Sentry.init).toHaveBeenCalledWith({
                dsn: 'https://test@sentry.io/123',
                environment: 'development',
                release: '1.0.0',
                debug: true,
                tracesSampleRate: 1.0,
                profilesSampleRate: 1.0,
                integrations: [],
                beforeSend: expect.any(Function),
            });
            expect(mockLogger.info).toHaveBeenCalledWith('Sentry initialized successfully', {
                environment: 'development',
                release: '1.0.0',
            });
        });
        it('should initialize Sentry with custom configuration', () => {
            process.env.SENTRY_DSN = 'https://test@sentry.io/123';
            process.env.NODE_ENV = 'development';
            initializeSentry({
                environment: 'production',
                release: '2.0.0',
                debug: true,
                tracesSampleRate: 0.5,
                profilesSampleRate: 0.3,
            }, mockLogger);
            expect(Sentry.init).toHaveBeenCalledWith({
                dsn: 'https://test@sentry.io/123',
                environment: 'production',
                release: '2.0.0',
                debug: true,
                tracesSampleRate: 0.5,
                profilesSampleRate: 0.3,
                integrations: [],
                beforeSend: expect.any(Function),
            });
        });
        it('should skip initialization when DSN is not provided', () => {
            delete process.env.SENTRY_DSN;
            initializeSentry({}, mockLogger);
            expect(Sentry.init).not.toHaveBeenCalled();
            expect(mockLogger.warn).toHaveBeenCalledWith('Sentry DSN not provided, skipping Sentry initialization');
        });
        it('should handle initialization errors gracefully', () => {
            process.env.SENTRY_DSN = 'https://test@sentry.io/123';
            process.env.NODE_ENV = 'development';
            const initError = new Error('Sentry init failed');
            vi.mocked(Sentry.init).mockImplementation(() => {
                throw initError;
            });
            initializeSentry({}, mockLogger);
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize Sentry', {
                error: 'Sentry init failed',
            });
        });
        it('should filter expected errors in development', () => {
            process.env.SENTRY_DSN = 'https://test@sentry.io/123';
            process.env.NODE_ENV = 'development';
            process.env.NODE_ENV = 'development';
            initializeSentry({}, mockLogger);
            const initCall = vi.mocked(Sentry.init).mock.calls[0]?.[0];
            const beforeSend = initCall?.beforeSend;
            if (beforeSend) {
                const event = { message: 'Expected error occurred' };
                const hint = { originalException: new Error('Expected error occurred') };
                const result = beforeSend(event, hint);
                expect(result).toBeNull();
            }
        });
    });
    describe('captureError', () => {
        it('should capture errors and return event ID', () => {
            const mockEventId = 'event-123';
            vi.mocked(Sentry.captureException).mockReturnValue(mockEventId);
            const error = new Error('Test error');
            const context = { userId: '123', action: 'test' };
            const result = captureError(error, context);
            expect(result).toBe(mockEventId);
            expect(Sentry.captureException).toHaveBeenCalledWith(error, {
                contexts: { app: context },
            });
        });
        it('should handle Sentry capture failures gracefully', () => {
            vi.mocked(Sentry.captureException).mockImplementation(() => {
                throw new Error('Sentry capture failed');
            });
            const error = new Error('Test error');
            const result = captureError(error);
            expect(result).toBe('unknown');
        });
    });
    describe('captureMessage', () => {
        it('should capture messages and return event ID', () => {
            const mockEventId = 'event-456';
            vi.mocked(Sentry.captureMessage).mockReturnValue(mockEventId);
            const message = 'Test message';
            const level = 'warning';
            const context = { userId: '123' };
            const result = captureMessage(message, level, context);
            expect(result).toBe(mockEventId);
            expect(Sentry.captureMessage).toHaveBeenCalledWith(message, {
                level,
                contexts: { app: context },
            });
        });
        it('should use default info level when not specified', () => {
            const mockEventId = 'event-789';
            vi.mocked(Sentry.captureMessage).mockReturnValue(mockEventId);
            const message = 'Test message';
            const result = captureMessage(message);
            expect(result).toBe(mockEventId);
            expect(Sentry.captureMessage).toHaveBeenCalledWith(message, {
                level: 'info',
                contexts: undefined,
            });
        });
        it('should handle Sentry capture failures gracefully', () => {
            vi.mocked(Sentry.captureMessage).mockImplementation(() => {
                throw new Error('Sentry capture failed');
            });
            const result = captureMessage('Test message');
            expect(result).toBe('unknown');
        });
    });
    describe('setUser', () => {
        it('should set user context in Sentry', () => {
            const user = { id: '123', email: 'test@example.com', username: 'testuser' };
            setUser(user);
            expect(Sentry.setUser).toHaveBeenCalledWith(user);
        });
        it('should handle Sentry setUser failures gracefully', () => {
            vi.mocked(Sentry.setUser).mockImplementation(() => {
                throw new Error('Sentry setUser failed');
            });
            const user = { id: '123' };
            expect(() => setUser(user)).not.toThrow();
        });
    });
    describe('setTag', () => {
        it('should set tag in Sentry', () => {
            setTag('environment', 'production');
            expect(Sentry.setTag).toHaveBeenCalledWith('environment', 'production');
        });
        it('should handle Sentry setTag failures gracefully', () => {
            vi.mocked(Sentry.setTag).mockImplementation(() => {
                throw new Error('Sentry setTag failed');
            });
            expect(() => setTag('test', 'value')).not.toThrow();
            vi.mocked(Sentry.setTag).mockImplementation(() => { });
        });
    });
    describe('setExtra', () => {
        it('should set extra context in Sentry', () => {
            const extraData = { userId: '123', action: 'login' };
            setExtra('userData', extraData);
            expect(Sentry.setExtra).toHaveBeenCalledWith('userData', extraData);
        });
        it('should handle Sentry setExtra failures gracefully', () => {
            vi.mocked(Sentry.setExtra).mockImplementation(() => {
                throw new Error('Sentry setExtra failed');
            });
            expect(() => setExtra('test', 'value')).not.toThrow();
        });
    });
    describe('setJobContext', () => {
        it('should set job context in Sentry', () => {
            const jobId = 'job-123';
            const jobType = 'fetch_pairs';
            const metadata = { limit: 100, exchange: 'binance' };
            setJobContext(jobId, jobType, metadata);
            expect(Sentry.setTag).toHaveBeenCalledWith('job.id', jobId);
            expect(Sentry.setTag).toHaveBeenCalledWith('job.type', jobType);
            expect(Sentry.setExtra).toHaveBeenCalledWith('job.metadata', metadata);
            expect(Sentry.setTag).toHaveBeenCalledTimes(2);
            expect(Sentry.setExtra).toHaveBeenCalledTimes(1);
        });
        it('should set only job ID when other parameters are not provided', () => {
            const jobId = 'job-456';
            setJobContext(jobId);
            expect(Sentry.setTag).toHaveBeenCalledWith('job.id', jobId);
            expect(Sentry.setTag).not.toHaveBeenCalledWith('job.type', expect.anything());
            expect(Sentry.setExtra).not.toHaveBeenCalledWith('job.metadata', expect.anything());
        });
        it('should handle Sentry failures gracefully', () => {
            vi.mocked(Sentry.setTag).mockImplementation(() => {
                throw new Error('Sentry setTag failed');
            });
            expect(() => setJobContext('job-123')).not.toThrow();
            vi.mocked(Sentry.setTag).mockImplementation(() => { });
        });
    });
    describe('flushSentry', () => {
        it('should flush Sentry events', async () => {
            const mockFlushResult = true;
            vi.mocked(Sentry.flush).mockResolvedValue(mockFlushResult);
            const result = await flushSentry(5000);
            expect(result).toBe(mockFlushResult);
            expect(Sentry.flush).toHaveBeenCalledWith(5000);
        });
        it('should use default timeout when not specified', async () => {
            const mockFlushResult = false;
            vi.mocked(Sentry.flush).mockResolvedValue(mockFlushResult);
            const result = await flushSentry();
            expect(result).toBe(mockFlushResult);
            expect(Sentry.flush).toHaveBeenCalledWith(2000);
        });
        it('should handle Sentry flush failures gracefully', async () => {
            vi.mocked(Sentry.flush).mockRejectedValue(new Error('Sentry flush failed'));
            const result = await flushSentry();
            expect(result).toBe(false);
        });
    });
    describe('closeSentry', () => {
        it('should close Sentry', () => {
            closeSentry();
            expect(Sentry.close).toHaveBeenCalled();
        });
        it('should handle Sentry close failures gracefully', () => {
            vi.mocked(Sentry.close).mockImplementation(() => {
                throw new Error('Sentry close failed');
            });
            expect(() => closeSentry()).not.toThrow();
        });
    });
    describe('Integration with logger', () => {
        it('should log Sentry initialization success', () => {
            process.env.SENTRY_DSN = 'https://test@sentry.io/123';
            process.env.NODE_ENV = 'development';
            vi.mocked(Sentry.init).mockImplementation(() => { });
            mockLogger.info.mockClear();
            mockLogger.warn.mockClear();
            mockLogger.error.mockClear();
            initializeSentry({}, mockLogger);
            expect(mockLogger.info).toHaveBeenCalledWith('Sentry initialized successfully', {
                environment: 'development',
                release: '1.0.0',
            });
        });
        it('should log Sentry initialization warnings', () => {
            delete process.env.SENTRY_DSN;
            initializeSentry({}, mockLogger);
            expect(mockLogger.warn).toHaveBeenCalledWith('Sentry DSN not provided, skipping Sentry initialization');
        });
        it('should log Sentry initialization errors', () => {
            process.env.SENTRY_DSN = 'https://test@sentry.io/123';
            process.env.NODE_ENV = 'development';
            vi.mocked(Sentry.init).mockImplementation(() => {
                throw new Error('Sentry init failed');
            });
            initializeSentry({}, mockLogger);
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize Sentry', {
                error: 'Sentry init failed',
            });
        });
    });
});
//# sourceMappingURL=sentry.test.js.map
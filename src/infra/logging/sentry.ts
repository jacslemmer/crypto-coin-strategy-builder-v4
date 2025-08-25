import * as Sentry from '@sentry/node';
import type { Logger } from './logger.js';

// Sentry configuration options
export interface SentryConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  debug?: boolean;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
  integrations?: any[];
  beforeSend?: (event: Sentry.Event, hint: Sentry.EventHint) => Sentry.Event | null;
}

// Helper function to create beforeSend handler
function createBeforeSendHandler(environment: string) {
  return (event: any, hint: any) => {
    // Filter out certain error types in development
    if (environment === 'development') {
      // Don't send expected errors to Sentry in development
      if (hint.originalException && 
          hint.originalException instanceof Error &&
          hint.originalException.message.includes('Expected error')) {
        return null;
      }
    }
    return event;
  };
}

// Initialize Sentry with configuration
export function initializeSentry(config: SentryConfig = {}, logger?: Logger): void {
  try {
    const {
      dsn = process.env.SENTRY_DSN,
      environment = process.env.NODE_ENV || 'development',
      release = process.env.APP_VERSION || '1.0.0',
      debug = environment === 'development',
      tracesSampleRate = environment === 'production' ? 0.1 : 1.0,
      profilesSampleRate = environment === 'production' ? 0.1 : 1.0,
      integrations = [],
      beforeSend,
    } = config;

    // Only initialize if DSN is provided
    if (!dsn) {
      if (logger) {
        logger.warn('Sentry DSN not provided, skipping Sentry initialization');
      }
      return;
    }

    // Initialize Sentry
    Sentry.init({
      dsn,
      environment,
      release,
      debug,
      tracesSampleRate,
      profilesSampleRate,
      integrations,
      beforeSend: (beforeSend || createBeforeSendHandler(environment)) as any,
    });

    if (logger) {
      logger.info('Sentry initialized successfully', { environment, release });
    }
  } catch (error) {
    if (logger) {
      logger.error('Failed to initialize Sentry', { error: error instanceof Error ? error.message : String(error) });
    }
  }
}

// Capture and report errors to Sentry
export function captureError(error: Error | string, context?: Record<string, any>): string {
  try {
    const eventId = Sentry.captureException(error, {
      contexts: context ? { app: context } : undefined,
    });
    return eventId;
  } catch (sentryError) {
    // Fallback logging if Sentry fails
    console.error('Failed to capture error in Sentry:', sentryError);
    console.error('Original error:', error);
    return 'unknown';
  }
}

// Capture and report messages to Sentry
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>): string {
  try {
    const eventId = Sentry.captureMessage(message, {
      level,
      contexts: context ? { app: context } : undefined,
    });
    return eventId;
  } catch (sentryError) {
    // Fallback logging if Sentry fails
    console.error('Failed to capture message in Sentry:', sentryError);
    console.log(`${level.toUpperCase()}: ${message}`);
    return 'unknown';
  }
}

// Set user context for Sentry
export function setUser(user: { id?: string; email?: string; username?: string }): void {
  try {
    Sentry.setUser(user);
  } catch (error) {
    console.error('Failed to set Sentry user:', error);
  }
}

// Set tag for Sentry
export function setTag(key: string, value: string): void {
  try {
    Sentry.setTag(key, value);
  } catch (error) {
    console.error('Failed to set Sentry tag:', error);
  }
}

// Set extra context for Sentry
export function setExtra(key: string, value: any): void {
  try {
    Sentry.setExtra(key, value);
  } catch (error) {
    console.error('Failed to set Sentry extra:', error);
  }
}

// Set job context for Sentry
export function setJobContext(jobId: string, jobType?: string, metadata?: Record<string, any>): void {
  try {
    Sentry.setTag('job.id', jobId);
    if (jobType) {
      Sentry.setTag('job.type', jobType);
    }
    if (metadata) {
      Sentry.setExtra('job.metadata', metadata);
    }
  } catch (error) {
    console.error('Failed to set Sentry job context:', error);
  }
}

// Flush Sentry events (useful for graceful shutdown)
export async function flushSentry(timeout: number = 2000): Promise<boolean> {
  try {
    return await Sentry.flush(timeout);
  } catch (error) {
    console.error('Failed to flush Sentry:', error);
    return false;
  }
}

// Close Sentry
export function closeSentry(): void {
  try {
    Sentry.close();
  } catch (error) {
    console.error('Failed to close Sentry:', error);
  }
}

// Export Sentry instance for advanced usage
export { Sentry };

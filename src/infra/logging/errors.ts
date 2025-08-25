import type { Logger } from './logger.js';
import { captureError, setJobContext } from './sentry.js';

// Base error class for the application
export abstract class AppError extends Error {
  public readonly isOperational: boolean;
  public readonly code: string;
  public readonly context: Record<string, any>;
  public readonly timestamp: Date;
  public jobId?: string;

  constructor(
    message: string,
    code: string,
    isOperational: boolean = true,
    context: Record<string, any> = {},
    jobId?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date();
    this.jobId = jobId;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // Method to log the error
  public log(logger: Logger): void {
    const logData = {
      error: this.message,
      code: this.code,
      isOperational: this.isOperational,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      ...(this.jobId && { jobId: this.jobId }),
      stack: this.stack,
    };

    if (this.isOperational) {
      logger.warn('Operational error occurred', logData);
    } else {
      logger.error('System error occurred', logData);
    }
  }

  // Method to capture error in Sentry
  public captureInSentry(): string {
    if (this.jobId) {
      setJobContext(this.jobId, this.context.jobType, this.context);
    }
    
    return captureError(this, {
      errorCode: this.code,
      isOperational: this.isOperational,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
    });
  }

  // Convert error to plain object for serialization
  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      isOperational: this.isOperational,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      jobId: this.jobId,
      stack: this.stack,
    };
  }
}

// Database-related errors
export class DatabaseError extends AppError {
  constructor(
    message: string,
    operation: string,
    table?: string,
    context: Record<string, any> = {},
    jobId?: string
  ) {
    super(
      message,
      'DATABASE_ERROR',
      true,
      { operation, table, ...context },
      jobId
    );
  }
}

// API-related errors
export class ApiError extends AppError {
  public readonly statusCode: number;

  constructor(
    message: string,
    statusCode: number = 500,
    endpoint?: string,
    context: Record<string, any> = {},
    jobId?: string
  ) {
    super(
      message,
      'API_ERROR',
      statusCode < 500, // 4xx errors are operational, 5xx are system errors
      { statusCode, endpoint, ...context },
      jobId
    );
    this.statusCode = statusCode;
  }
}

// Validation errors
export class ValidationError extends AppError {
  public readonly field: string;
  public readonly value: any;

  constructor(
    message: string,
    field: string,
    value?: any,
    context: Record<string, any> = {},
    jobId?: string
  ) {
    super(
      message,
      'VALIDATION_ERROR',
      true,
      { field, value, ...context },
      jobId
    );
    this.field = field;
    this.value = value;
  }
}

// Job-related errors
export class JobError extends AppError {
  public readonly jobType: string;
  public readonly step: string;

  constructor(
    message: string,
    jobType: string,
    step: string,
    context: Record<string, any> = {},
    jobId?: string
  ) {
    super(
      message,
      'JOB_ERROR',
      true,
      { jobType, step, ...context },
      jobId
    );
    this.jobType = jobType;
    this.step = step;
  }
}

// External service errors
export class ExternalServiceError extends AppError {
  public readonly service: string;
  public readonly endpoint: string;

  constructor(
    message: string,
    service: string,
    endpoint: string,
    context: Record<string, any> = {},
    jobId?: string
  ) {
    super(
      message,
      'EXTERNAL_SERVICE_ERROR',
      true,
      { service, endpoint, ...context },
      jobId
    );
    this.service = service;
    this.endpoint = endpoint;
  }
}

// Configuration errors
export class ConfigurationError extends AppError {
  public readonly configKey: string;

  constructor(
    message: string,
    configKey: string,
    context: Record<string, any> = {},
    jobId?: string
  ) {
    super(
      message,
      'CONFIGURATION_ERROR',
      false, // Configuration errors are system errors
      { configKey, ...context },
      jobId
    );
    this.configKey = configKey;
  }
}

// Error factory for creating errors with job context
export class ErrorFactory {
  static withJobContext<T extends AppError>(
    ErrorClass: new (...args: any[]) => T,
    jobId: string,
    ...args: any[]
  ): T {
    const error = new ErrorClass(...args);
    error.jobId = jobId;
    return error;
  }

  static databaseError(
    message: string,
    operation: string,
    table?: string,
    context: Record<string, any> = {},
    jobId?: string
  ): DatabaseError {
    return new DatabaseError(message, operation, table, context, jobId);
  }

  static apiError(
    message: string,
    statusCode: number = 500,
    endpoint?: string,
    context: Record<string, any> = {},
    jobId?: string
  ): ApiError {
    return new ApiError(message, statusCode, endpoint, context, jobId);
  }

  static validationError(
    message: string,
    field: string,
    value?: any,
    context: Record<string, any> = {},
    jobId?: string
  ): ValidationError {
    return new ValidationError(message, field, value, context, jobId);
  }

  static jobError(
    message: string,
    jobType: string,
    step: string,
    context: Record<string, any> = {},
    jobId?: string
  ): JobError {
    return new JobError(message, jobType, step, context, jobId);
  }

  static externalServiceError(
    message: string,
    service: string,
    endpoint: string,
    context: Record<string, any> = {},
    jobId?: string
  ): ExternalServiceError {
    return new ExternalServiceError(message, service, endpoint, context, jobId);
  }

  static configurationError(
    message: string,
    configKey: string,
    context: Record<string, any> = {},
    jobId?: string
  ): ConfigurationError {
    return new ConfigurationError(message, configKey, context, jobId);
  }
}

// Error handler utility
export class ErrorHandler {
  constructor(private logger: Logger) {}

  // Handle and log an error
  public handleError(error: Error | AppError, context?: Record<string, any>): void {
    if (error instanceof AppError) {
      // Log the error with its built-in logging
      error.log(this.logger);
      
      // Capture in Sentry
      error.captureInSentry();
    } else {
      // Handle generic errors
      this.logger.error('Unhandled error occurred', {
        error: error.message,
        stack: error.stack,
        context,
      });
      
      // Capture in Sentry
      captureError(error, context);
    }
  }

  // Handle async errors
  public async handleAsyncError<T>(
    promise: Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> {
    try {
      return await promise;
    } catch (error) {
      this.handleError(error as Error, context);
      return null;
    }
  }

  // Wrap async function with error handling
  public wrapAsync<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: Record<string, any>
  ): (...args: T) => Promise<R | null> {
    return async (...args: T): Promise<R | null> => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handleError(error as Error, context);
        return null;
      }
    };
  }
}

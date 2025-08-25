import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Validation schemas
const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(1000).default(100),
  offset: z.coerce.number().min(0).default(0),
});

const pairsQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  sort: z.enum(['symbol', 'name', 'market_cap', 'volume']).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

const chartsQuerySchema = paginationSchema.extend({
  version_id: z.string().optional(),
  pair_id: z.string().optional(),
  include_analysis: z.coerce.boolean().default(false),
});

const createChartSchema = z.object({
  pair_id: z.string().min(1, 'Pair ID is required'),
  version_id: z.string().min(1, 'Version ID is required'),
  timeframe: z.string().min(1, 'Timeframe is required'),
  window: z.string().min(1, 'Window is required'),
  theme: z.string().min(1, 'Theme is required'),
});

const analysisQuerySchema = paginationSchema.extend({
  chart_id: z.string().optional(),
  provider: z.enum(['grok', 'openai', 'claude', 'gemini', 'perplexity']).optional(),
  version_id: z.string().optional(),
});

const requestAnalysisSchema = z.object({
  chart_id: z.string().min(1, 'Chart ID is required'),
  providers: z.array(z.enum(['grok', 'openai', 'claude', 'gemini', 'perplexity']))
    .min(1, 'At least one provider is required'),
  options: z.object({
    include_confidence: z.boolean().optional(),
    include_countertrend: z.boolean().optional(),
  }).optional(),
});

const rankingsQuerySchema = paginationSchema.extend({
  version_id: z.string().min(1, 'Version ID is required'),
  provider: z.string().min(1, 'Provider is required'),
  trend_type: z.enum(['up', 'down', 'sideways']).optional(),
});

const generateRankingsSchema = z.object({
  version_id: z.string().min(1, 'Version ID is required'),
  provider: z.string().min(1, 'Provider is required'),
  options: z.object({
    include_confidence: z.boolean().optional(),
    include_countertrend: z.boolean().optional(),
    force_regenerate: z.boolean().optional(),
  }).optional(),
});

const jobsQuerySchema = paginationSchema.extend({
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  type: z.enum(['chart_generation', 'analysis', 'ranking']).optional(),
});

const versionsQuerySchema = paginationSchema;

// Validation middleware factory
export function validationMiddleware(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate query parameters
      if (Object.keys(req.query).length > 0) {
        req.query = schema.parse(req.query);
      }
      
      // Validate body for POST/PUT requests
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        req.body = schema.parse(req.body);
      }
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
            timestamp: new Date().toISOString(),
            request_id: req.headers['x-request-id'] || 'unknown',
          },
        });
      } else {
        next(error);
      }
    }
  };
}

// Export specific validation middlewares
export const validatePairsQuery = validationMiddleware(pairsQuerySchema);
export const validateChartsQuery = validationMiddleware(chartsQuerySchema);
export const validateCreateChart = validationMiddleware(createChartSchema);
export const validateAnalysisQuery = validationMiddleware(analysisQuerySchema);
export const validateRequestAnalysis = validationMiddleware(requestAnalysisSchema);
export const validateRankingsQuery = validationMiddleware(rankingsQuerySchema);
export const validateGenerateRankings = validationMiddleware(generateRankingsSchema);
export const validateJobsQuery = validationMiddleware(jobsQuerySchema);
export const validateVersionsQuery = validationMiddleware(versionsQuerySchema);



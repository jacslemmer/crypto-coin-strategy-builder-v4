import { Router } from 'express';
import type { Response } from 'express';
import type { AuthenticatedRequest, ServerDeps } from '../types.js';
import { validateJobsQuery } from '../middleware/validation.js';

export function jobsRoutes(deps: ServerDeps) {
  const router = Router();

  // GET /api/jobs - Get jobs with pagination and filtering
  router.get('/', validateJobsQuery, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { limit, offset, status, type } = req.query;
      
      const result = await deps.jobsService.getJobs({
        limit: Number(limit),
        offset: Number(offset),
        status: status as any,
        type: type as any,
      });

      res.json(result);
    } catch (error) {
      throw error;
    }
  });

  // GET /api/jobs/:id - Get specific job by ID
  router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Job ID is required',
            timestamp: new Date().toISOString(),
            request_id: req.headers['x-request-id'] as string || 'unknown',
          },
        });
        return;
      }
      
      const job = await deps.jobsService.getJobById(id);
      
      if (!job) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Job with ID '${id}' not found`,
            timestamp: new Date().toISOString(),
            request_id: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      res.json(job);
    } catch (error) {
      throw error;
    }
  });

  return router;
}

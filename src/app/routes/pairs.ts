import { Router } from 'express';
import type { Response } from 'express';
import type { AuthenticatedRequest, ServerDeps } from '../types.js';
import { validatePairsQuery } from '../middleware/validation.js';
import { getStringParam, getNumberParam } from '../utils/queryParams.js';

export function pairsRoutes(deps: ServerDeps) {
  const router = Router();

  // GET /api/pairs - Get trading pairs with pagination and filtering
  router.get('/', validatePairsQuery, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { limit, offset, search, sort, order } = req.query;
      
      const result = await deps.pairsService.getPairs({
        limit: Number(limit) || 100,
        offset: Number(offset) || 0,
        search: search as any,
        sort: sort as any,
        order: order as any,
      } as any);

      res.json(result);
    } catch (error) {
      // Error will be handled by error middleware
      throw error;
    }
  });

  // GET /api/pairs/:id - Get specific trading pair by ID
  router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Pair ID is required',
            timestamp: new Date().toISOString(),
            request_id: req.headers['x-request-id'] as string || 'unknown',
          },
        });
        return;
      }
      
      const pair = await deps.pairsService.getPairById(id);
      
      if (!pair) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Trading pair with ID '${id}' not found`,
            timestamp: new Date().toISOString(),
            request_id: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      res.json(pair);
    } catch (error) {
      throw error;
    }
  });

  return router;
}

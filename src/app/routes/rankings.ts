import { Router } from 'express';
import type { Response } from 'express';
import type { AuthenticatedRequest, ServerDeps } from '../types.js';
import { validateRankingsQuery, validateGenerateRankings } from '../middleware/validation.js';

export function rankingsRoutes(deps: ServerDeps) {
  const router = Router();

  // GET /api/rankings - Get rankings with pagination and filtering
  router.get('/', validateRankingsQuery, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { limit, offset, version_id, provider, trend_type } = req.query;
      
      const result = await deps.rankingsService.getRankings({
        limit: Number(limit),
        offset: Number(offset),
        version_id: version_id as string,
        provider: provider as string,
        trend_type: trend_type as any,
      });

      res.json(result);
    } catch (error) {
      throw error;
    }
  });

  // POST /api/rankings - Generate new rankings
  router.post('/', validateGenerateRankings, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { version_id, provider, options } = req.body;
      
      const result = await deps.rankingsService.generateRankings({
        version_id,
        provider,
        options,
      });

      res.status(202).json(result);
    } catch (error) {
      throw error;
    }
  });

  return router;
}

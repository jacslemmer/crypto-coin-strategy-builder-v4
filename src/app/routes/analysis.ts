import { Router } from 'express';
import type { Response } from 'express';
import type { AuthenticatedRequest, ServerDeps } from '../types.js';
import { validateAnalysisQuery, validateRequestAnalysis } from '../middleware/validation.js';

export function analysisRoutes(deps: ServerDeps) {
  const router = Router();

  // GET /api/analysis - Get chart analyses with pagination and filtering
  router.get('/', validateAnalysisQuery, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { limit, offset, chart_id, provider, version_id } = req.query;
      
      const result = await deps.analysisService.getAnalyses({
        limit: Number(limit),
        offset: Number(offset),
        chart_id: chart_id as string,
        provider: provider as any,
        version_id: version_id as string,
      });

      res.json(result);
    } catch (error) {
      throw error;
    }
  });

  // POST /api/analysis - Request new analysis
  router.post('/', validateRequestAnalysis, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { chart_id, providers, options } = req.body;
      
      const result = await deps.analysisService.requestAnalysis({
        chart_id,
        providers,
        options,
      });

      res.status(202).json(result);
    } catch (error) {
      throw error;
    }
  });

  return router;
}

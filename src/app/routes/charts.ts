import { Router } from 'express';
import type { Response } from 'express';
import type { AuthenticatedRequest, ServerDeps } from '../types.js';
import { validateChartsQuery, validateCreateChart } from '../middleware/validation.js';
import { getStringParam, getNumberParam, getBooleanParam } from '../utils/queryParams.js';

export function chartsRoutes(deps: ServerDeps) {
  const router = Router();

  // GET /api/charts - Get charts with pagination and filtering
  router.get('/', validateChartsQuery, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { limit, offset, version_id, pair_id, include_analysis } = req.query;
      
      const result = await deps.chartsService.getCharts({
        limit: Number(limit) || 50,
        offset: Number(offset) || 0,
        version_id: version_id as any,
        pair_id: pair_id as any,
        include_analysis: include_analysis === 'true',
      } as any);

      res.json(result);
    } catch (error) {
      throw error;
    }
  });

  // GET /api/charts/:id - Get specific chart by ID
  router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Chart ID is required',
            timestamp: new Date().toISOString(),
            request_id: req.headers['x-request-id'] as string || 'unknown',
          },
        });
        return;
      }
      
      const chart = await deps.chartsService.getChartById(id);
      
      if (!chart) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Chart with ID '${id}' not found`,
            timestamp: new Date().toISOString(),
            request_id: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      res.json(chart);
    } catch (error) {
      throw error;
    }
  });

  // POST /api/charts - Create new chart
  router.post('/', validateCreateChart, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { pair_id, version_id, timeframe, window, theme } = req.body;
      
      if (!pair_id || !version_id || !timeframe || !window || !theme) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields',
            timestamp: new Date().toISOString(),
            request_id: req.headers['x-request-id'] as string || 'unknown',
          },
        });
        return;
      }
      
      const result = await deps.chartsService.createChart({
        pair_id,
        version_id,
        timeframe,
        window,
        theme,
      });

      res.status(202).json(result);
    } catch (error) {
      throw error;
    }
  });

  return router;
}

import { Router } from 'express';
import type { Response } from 'express';
import type { AuthenticatedRequest, ServerDeps } from '../types.js';
import { validateVersionsQuery } from '../middleware/validation.js';

export function versionsRoutes(deps: ServerDeps) {
  const router = Router();

  // GET /api/versions - Get versions with pagination
  router.get('/', validateVersionsQuery, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { limit, offset } = req.query;
      
      const result = await deps.versionsService.getVersions({
        limit: Number(limit),
        offset: Number(offset),
      });

      res.json(result);
    } catch (error) {
      throw error;
    }
  });

  return router;
}

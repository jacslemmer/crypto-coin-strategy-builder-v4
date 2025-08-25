import { join } from 'node:path';

import { runFetchJob } from './orchestrator.js';
import type { FetchJobParams, IdGenerator, ProgressLogger } from '../ports.js';
import type { FetchJobDeps } from './orchestrator.js';
import { createFsProgressLogger } from '../infra/fsLogger.js';

export type PostFetchStartBody = Partial<FetchJobParams>;

export type ApiDeps = Omit<FetchJobDeps, 'logger'> & {
  ids: IdGenerator;
  logsDir: string;
  logger?: ProgressLogger;
};

export async function postFetchStart(body: PostFetchStartBody, deps: ApiDeps): Promise<{ jobId: string; versionId: string }> {
  const limit = body.limit ?? 200;
  const source = body.source ?? 'both';
  const includeAnonymized = body.includeAnonymized ?? true;
  const jobId = deps.ids.generateId();
  const logger = deps.logger ?? createFsProgressLogger(join(deps.logsDir, `fetch-${jobId}.log`));
  const result = await runFetchJob({ limit, source, includeAnonymized }, { ...deps, logger });
  return { jobId, versionId: result.versionId };
}



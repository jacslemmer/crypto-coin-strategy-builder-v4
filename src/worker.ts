import { postFetchStart } from './app/api.js';
import { createCfD1, createCfLogger, createCfR2, defaultCapturer, defaultCoinSource, defaultPairResolver } from './infra/cf.js';

export interface Env {
  R2: R2Bucket;
  DB: D1Database;
  LOGS: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/api/fetch/start') {
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const storage = createCfR2(env.R2);
      const db = createCfD1(env.DB);
      const preJobId = crypto.randomUUID();
      const logger = createCfLogger(env.LOGS, `logs:${preJobId}:`);
      const deps = {
        source: defaultCoinSource,
        resolver: defaultPairResolver,
        capturer: defaultCapturer,
        storage,
        db,
        ids: { generateId: () => preJobId },
        now: () => new Date(),
        logsDir: 'kv',
        logger,
      } as const;

      const result = await postFetchStart(body, deps);
      return new Response(JSON.stringify(result), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'content-type': 'application/json' } });
  },
};



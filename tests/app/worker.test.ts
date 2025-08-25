import { describe, expect, it } from 'vitest';

import worker, { type Env } from '../../src/worker.js';

/* eslint-disable @typescript-eslint/no-unused-vars */
const R2 = { put: async (_key: string, _v: string | ArrayBuffer | ReadableStream | ArrayBufferView | Blob | null) => ({} as unknown as R2Object) } as unknown as R2Bucket;
const KV = { put: async (_k: string, _v: string) => {} } as unknown as KVNamespace;
const DB = {
	exec: async (_q: string) => ({ count: 0, duration: 0 } as D1ExecResult),
	prepare: (_q: string) => ({
		bind: () => ({
			run: async <T = Record<string, unknown>>() => ({ results: [] as T[] } as unknown as D1Result<T>),
			all: async <T = Record<string, unknown>>() => ({ results: [] as T[] } as unknown as D1Result<T>),
			raw: async <T = unknown[]>(options?: { columnNames?: boolean } | { columnNames: true }) => (options && (options as { columnNames?: boolean }).columnNames ? [['col']] : ([] as T[])),
		}),
	}),
	batch: async <T = unknown>() => [] as Array<D1Result<T>>,
	dump: async () => new ArrayBuffer(0),
	withSession: async <T>(fn: (db: D1Database) => Promise<T>) => fn({} as unknown as D1Database),
} as unknown as D1Database;
/* eslint-enable @typescript-eslint/no-unused-vars */

describe('Workers handler', () => {
	it('returns jobId and versionId', async () => {
		const env: Env = { R2, DB, LOGS: KV } as unknown as Env;
		const res = await worker.fetch(new Request('http://localhost/api/fetch/start', { method: 'POST', body: JSON.stringify({ limit: 1 }) }), env);
		expect(res.status).toBe(200);
		const json = (await res.json()) as { jobId: string; versionId: string };
		expect(json.jobId).toBeTruthy();
		expect(json.versionId).toBeTruthy();
	});

	it('returns 404 for unknown path', async () => {
		const env: Env = { R2, DB, LOGS: KV } as unknown as Env;
		const res = await worker.fetch(new Request('http://localhost/nope', { method: 'GET' }), env);
		expect(res.status).toBe(404);
	});
});



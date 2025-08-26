import { describe, expect, it } from 'vitest';
import worker from '../../src/worker.js';
const R2 = { put: async (_key, _v) => ({}) };
const KV = { put: async (_k, _v) => { } };
const DB = {
    exec: async (_q) => ({ count: 0, duration: 0 }),
    prepare: (_q) => ({
        bind: () => ({
            run: async () => ({ results: [] }),
            all: async () => ({ results: [] }),
            raw: async (options) => (options && options.columnNames ? [['col']] : []),
        }),
    }),
    batch: async () => [],
    dump: async () => new ArrayBuffer(0),
    withSession: async (fn) => fn({}),
};
describe('Workers handler', () => {
    it('returns jobId and versionId', async () => {
        const env = { R2, DB, LOGS: KV };
        const res = await worker.fetch(new Request('http://localhost/api/fetch/start', { method: 'POST', body: JSON.stringify({ limit: 1 }) }), env);
        expect(res.status).toBe(200);
        const json = (await res.json());
        expect(json.jobId).toBeTruthy();
        expect(json.versionId).toBeTruthy();
    });
    it('returns 404 for unknown path', async () => {
        const env = { R2, DB, LOGS: KV };
        const res = await worker.fetch(new Request('http://localhost/nope', { method: 'GET' }), env);
        expect(res.status).toBe(404);
    });
});
//# sourceMappingURL=worker.test.js.map
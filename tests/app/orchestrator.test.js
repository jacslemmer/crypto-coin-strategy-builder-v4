import { describe, expect, it, vi } from 'vitest';
import { runFetchJob } from '../../src/app/orchestrator.js';
function u8(str) {
    return new TextEncoder().encode(str);
}
describe('runFetchJob', () => {
    it('processes only USDT pairs and stores full + anon images', async () => {
        const params = { limit: 5, source: 'both', includeAnonymized: true };
        const source = {
            async listTopSymbols() {
                return ['BTC', 'ETH', 'ABC'];
            },
        };
        const resolver = {
            async resolvePreferredUsdtPair(symbol) {
                if (symbol === 'ABC')
                    return null;
                return `${symbol}USDT`;
            },
        };
        const capturer = {
            captureFullScreenshot: vi.fn(async () => u8('full')),
            crop: vi.fn(async () => u8('anon')),
        };
        const uploads = [];
        const storage = {
            async upload(path, data) {
                uploads.push({ path, data: new TextDecoder().decode(data) });
                return path;
            },
        };
        const images = [];
        const db = {
            async createVersion(r) {
                return { id: 'v1', source: r.source, createdAt: new Date().toISOString(), coinCount: r.coinCount };
            },
            async insertImage(r) {
                const id = `img_${images.length + 1}`;
                const rec = {
                    id,
                    versionId: r.versionId,
                    type: r.type,
                    pair: r.pair,
                    capturedAt: new Date().toISOString(),
                    path: r.path,
                    thumbPath: r.thumbPath,
                };
                images.push(rec);
                return rec;
            },
        };
        const ids = { generateId: () => 'id' };
        const now = () => new Date('2020-01-01T00:00:00.000Z');
        const logs = [];
        const logger = { log: async (m) => { logs.push(m); } };
        const result = await runFetchJob(params, { source, resolver, capturer, storage, db, ids, now, logger });
        expect(result.versionId).toBe('v1');
        expect(result.processedPairs).toBe(2);
        expect(uploads.map((u) => u.path)).toEqual([
            'screens/v1/BTCUSDT/full.png',
            'screens/v1/BTCUSDT/anon.png',
            'screens/v1/ETHUSDT/full.png',
            'screens/v1/ETHUSDT/anon.png',
        ]);
        expect(images.filter((i) => i.type === 'full').length).toBe(2);
        expect(images.filter((i) => i.type === 'anon').length).toBe(2);
        expect(logs[0]).toMatch(/job:start/);
        expect(logs.at(-1)).toMatch(/job:complete/);
    });
});
//# sourceMappingURL=orchestrator.test.js.map
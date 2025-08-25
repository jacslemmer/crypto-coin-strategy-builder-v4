import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { postFetchStart } from '../../src/app/api.js';
import type { ApiDeps } from '../../src/app/api.js';
import type { UsdtPair } from '../../src/domain/tradingview.js';
import type { Capturer, CoinSource, IdGenerator, PairResolver, PersistenceAdapter, StorageAdapter, VersionRecord } from '../../src/ports.js';

function u8(str: string): Uint8Array {
	return new TextEncoder().encode(str);
}

describe('postFetchStart', () => {
	it('starts a job and returns jobId and versionId; logs are written', async () => {
		const source: CoinSource = { listTopSymbols: async () => ['BTC'] };
		const resolver: PairResolver = { resolvePreferredUsdtPair: async (s) => `${s}USDT` as UsdtPair };
		const capturer: Capturer = { captureFullScreenshot: async () => u8('full'), crop: async () => u8('anon') };
		const storage: StorageAdapter = { upload: async (p) => p };
		const db: PersistenceAdapter = {
			async createVersion(r): Promise<VersionRecord> { return { id: 'v2', source: r.source, createdAt: new Date().toISOString(), coinCount: r.coinCount }; },
			async insertImage(r) {
				return {
					id: 'i1',
					versionId: r.versionId,
					type: r.type,
					pair: r.pair,
					capturedAt: new Date().toISOString(),
					path: r.path,
					thumbPath: r.thumbPath,
				};
			},
		};
		const ids: IdGenerator = { generateId: () => 'job-123' };
		const logsDir = join(process.cwd(), 'tmp', 'logs');
		const deps: ApiDeps = { source, resolver, capturer, storage, db, ids, now: () => new Date(), logsDir };

		const res = await postFetchStart({}, deps);
		expect(res.jobId).toBe('job-123');
		expect(res.versionId).toBe('v2');
		const logFile = join(logsDir, 'fetch-job-123.log');
		const content = await readFile(logFile, 'utf8');
		expect(content).toContain('job:start');
		expect(content).toContain('job:complete');
	});
});



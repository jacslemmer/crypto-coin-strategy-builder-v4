import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createSqliteD1 } from '../../src/infra/d1.js';
describe('createSqliteD1', () => {
    it('creates schema and inserts version and image rows', async () => {
        const dir = await mkdtemp(join(tmpdir(), 'd1-'));
        const dbPath = join(dir, 'test.sqlite');
        const d1 = createSqliteD1(dbPath);
        const v = await d1.createVersion({ source: 'both', coinCount: 2 });
        expect(v.id).toBeTruthy();
        const img = await d1.insertImage({ versionId: v.id, type: 'full', pair: 'BTCUSDT', path: 'p' });
        expect(img.id).toBeTruthy();
        expect(img.versionId).toBe(v.id);
    });
});
//# sourceMappingURL=d1.test.js.map
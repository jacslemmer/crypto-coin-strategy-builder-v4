import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createLocalConnection } from '../../../../src/infra/db/connection.js';
import { ChartsRepository } from '../../../../src/infra/db/repositories.js';
import { createTables } from '../../../../src/infra/db/migrate.js';

describe('ChartsRepository', () => {
  let dbPath: string;
  let db: ReturnType<typeof createLocalConnection>;
  let chartsRepository: ChartsRepository;

  beforeEach(async () => {
    dbPath = await mkdtemp(join(tmpdir(), 'db-test-'));
    const dbFile = join(dbPath, 'test.db');
    db = createLocalConnection(dbFile);
    await createTables(db);
    chartsRepository = new ChartsRepository(db);
  });

  afterEach(async () => {
    const fs = await import('node:fs/promises');
    try {
      await fs.rm(dbPath, { recursive: true, force: true });
    } catch (error) {
      console.error('Error cleaning up test database:', error);
    }
  });

  it('should create a new chart successfully', async () => {
    const newChart = {
      pairId: 'btc-usdt',
      pairSymbol: 'BTCUSDT',
      chartPath: '/charts/btc-usdt-1d-dark.png',
      interval: '1D',
      theme: 'dark',
      style: '1',
      viewport: { width: 1920, height: 1080 },
      metadata: { capturedAt: new Date().toISOString(), source: 'tradingview' }
    };

    const result = await chartsRepository.create(newChart);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.pairId).toBe(newChart.pairId);
  });
});

import type { UsdtPair } from '../domain/tradingview.js';
import type { Capturer, CoinSource, PairResolver, ProgressLogger, StorageAdapter, PersistenceAdapter } from '../ports.js';

export function createCfR2(bucket: R2Bucket): StorageAdapter {
  return {
    async upload(path, data) {
      await bucket.put(path, data);
      return path;
    },
  };
}

export function createCfD1(db: D1Database): PersistenceAdapter {
  // Ensure schema exists (idempotent)
  void db.exec(`
    CREATE TABLE IF NOT EXISTS versions (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      created_at TEXT NOT NULL,
      coin_count INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      version_id TEXT NOT NULL,
      type TEXT NOT NULL,
      pair TEXT NOT NULL,
      captured_at TEXT NOT NULL,
      path TEXT NOT NULL,
      thumb_path TEXT
    );
  `);
  return {
    async createVersion(r) {
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      await db.prepare('INSERT INTO versions (id, source, created_at, coin_count) VALUES (?1, ?2, ?3, ?4)')
        .bind(id, r.source, createdAt, r.coinCount)
        .run();
      return { id, source: r.source, createdAt, coinCount: r.coinCount };
    },
    async insertImage(r) {
      const id = crypto.randomUUID();
      const capturedAt = new Date().toISOString();
      await db.prepare('INSERT INTO images (id, version_id, type, pair, captured_at, path, thumb_path) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)')
        .bind(id, r.versionId, r.type, r.pair, capturedAt, r.path, r.thumbPath ?? null)
        .run();
      return { id, versionId: r.versionId, type: r.type, pair: r.pair, capturedAt, path: r.path, thumbPath: r.thumbPath };
    },
  };
}

export function createCfLogger(logs: KVNamespace, keyPrefix = 'logs:'): ProgressLogger {
  return {
    async log(message) {
      const key = `${keyPrefix}${new Date().toISOString()}`;
      await logs.put(key, message);
    },
  };
}

export const defaultCoinSource: CoinSource = {
  async listTopSymbols({ limit }) {
    return ['BTC', 'ETH', 'ADA', 'SOL'].slice(0, limit);
  },
};

export const defaultPairResolver: PairResolver = {
  async resolvePreferredUsdtPair(symbol: string) {
    return `${symbol}USDT` as UsdtPair;
  },
};

export const defaultCapturer: Capturer = {
  async captureFullScreenshot() {
    return new TextEncoder().encode('image-full');
  },
  async crop() {
    return new TextEncoder().encode('image-anon');
  },
};



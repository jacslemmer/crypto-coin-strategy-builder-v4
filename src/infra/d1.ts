import BetterSqlite3 from 'better-sqlite3';

import type { ImageRecord, PersistenceAdapter, VersionRecord } from '../ports.js';

export function createSqliteD1(dbPath: string): PersistenceAdapter {
  const db = new BetterSqlite3(dbPath);
  db.exec(`
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
    async createVersion(r): Promise<VersionRecord> {
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const stmt = db.prepare(
        'INSERT INTO versions (id, source, created_at, coin_count) VALUES (?, ?, ?, ?)',
      );
      stmt.run(id, r.source, createdAt, r.coinCount);
      return { id, source: r.source, createdAt, coinCount: r.coinCount };
    },
    async insertImage(r): Promise<ImageRecord> {
      const id = crypto.randomUUID();
      const capturedAt = new Date().toISOString();
      const stmt = db.prepare(
        'INSERT INTO images (id, version_id, type, pair, captured_at, path, thumb_path) VALUES (?, ?, ?, ?, ?, ?, ?)',
      );
      stmt.run(id, r.versionId, r.type, r.pair, capturedAt, r.path, r.thumbPath ?? null);
      return { id, versionId: r.versionId, type: r.type, pair: r.pair, capturedAt, path: r.path, thumbPath: r.thumbPath };
    },
  };
}



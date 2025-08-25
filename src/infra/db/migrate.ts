import { sql } from 'drizzle-orm';
import type { Database } from './connection.js';

export async function createTables(db: Database): Promise<void> {
  try {
    // Create tables using Drizzle's sql template
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS pairs (
        id TEXT PRIMARY KEY NOT NULL,
        symbol TEXT NOT NULL,
        rank INTEGER NOT NULL,
        market_cap REAL NOT NULL,
        volume_24h REAL NOT NULL,
        price REAL NOT NULL,
        price_change_24h REAL NOT NULL,
        price_change_percent_24h REAL NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS charts (
        id TEXT PRIMARY KEY NOT NULL,
        pair_id TEXT NOT NULL,
        pair_symbol TEXT NOT NULL,
        original_chart_path TEXT NOT NULL,
        anonymized_chart_path TEXT,
        captured_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        viewport_width INTEGER NOT NULL,
        viewport_height INTEGER NOT NULL,
        exchange TEXT NOT NULL,
        timeframe TEXT NOT NULL,
        theme TEXT NOT NULL,
        window_days INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS chart_analyses (
        id TEXT PRIMARY KEY NOT NULL,
        chart_id TEXT NOT NULL,
        pair_id TEXT NOT NULL,
        ai_name TEXT NOT NULL,
        analysis_json TEXT NOT NULL,
        trend TEXT NOT NULL,
        trend_confidence REAL NOT NULL,
        countertrend TEXT NOT NULL,
        countertrend_confidence REAL NOT NULL,
        trend_rank INTEGER NOT NULL,
        countertrend_rank INTEGER NOT NULL,
        rank_sum INTEGER NOT NULL,
        overall_rank INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        parent_job_id TEXT,
        metadata TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        error TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS versions (
        id TEXT PRIMARY KEY NOT NULL,
        source TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        coin_count INTEGER NOT NULL
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS images (
        id TEXT PRIMARY KEY NOT NULL,
        version_id TEXT NOT NULL,
        type TEXT NOT NULL,
        pair TEXT NOT NULL,
        captured_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        path TEXT NOT NULL,
        thumb_path TEXT
      )
    `);
  } catch (error) {
    console.error('Table creation failed:', error);
    throw error;
  }
}

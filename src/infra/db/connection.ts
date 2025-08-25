import { drizzle } from 'drizzle-orm/d1';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import BetterSqlite3 from 'better-sqlite3';
import * as schema from './schema.js';

// Cloudflare D1 connection (for production)
export function createD1Connection(db: D1Database) {
  return drizzle(db, { schema });
}

// Local SQLite connection (for development/testing)
export function createLocalConnection(dbPath: string) {
  const sqlite = new BetterSqlite3(dbPath);
  return drizzleSqlite(sqlite, { schema });
}

// Type for the database instance
export type Database = ReturnType<typeof createD1Connection> | ReturnType<typeof createLocalConnection>;



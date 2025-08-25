import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Pairs table - stores cryptocurrency trading pairs
export const pairs = sqliteTable('pairs', {
  id: text('id').primaryKey(),
  symbol: text('symbol').notNull(),
  rank: integer('rank').notNull(),
  marketCap: real('market_cap').notNull(),
  volume24h: real('volume_24h').notNull(),
  price: real('price').notNull(),
  priceChange24h: real('price_change_24h').notNull(),
  priceChangePercent24h: real('price_change_percent_24h').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Charts table - stores TradingView chart captures
export const charts = sqliteTable('charts', {
  id: text('id').primaryKey(),
  pairId: text('pair_id').notNull().references(() => pairs.id),
  pairSymbol: text('pair_symbol').notNull(),
  originalChartPath: text('original_chart_path').notNull(),
  anonymizedChartPath: text('anonymized_chart_path'),
  capturedAt: text('captured_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  viewportWidth: integer('viewport_width').notNull(),
  viewportHeight: integer('viewport_height').notNull(),
  exchange: text('exchange').notNull(),
  timeframe: text('timeframe').notNull(),
  theme: text('theme').notNull(),
  windowDays: integer('window_days').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Chart analyses table - stores AI analysis results
export const chartAnalyses = sqliteTable('chart_analyses', {
  id: text('id').primaryKey(),
  chartId: text('chart_id').notNull().references(() => charts.id),
  pairId: text('pair_id').notNull().references(() => charts.pairId),
  aiName: text('ai_name').notNull(),
  analysisJson: text('analysis_json').notNull(),
  trend: text('trend').notNull(),
  trendConfidence: real('trend_confidence').notNull(),
  countertrend: text('countertrend').notNull(),
  countertrendConfidence: real('countertrend_confidence').notNull(),
  trendRank: integer('trend_rank').notNull(),
  countertrendRank: integer('countertrend_rank').notNull(),
  rankSum: integer('rank_sum').notNull(),
  overallRank: integer('overall_rank').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Jobs table - tracks workflow progress across steps
export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['fetch_pairs', 'capture_charts', 'anonymize_charts', 'analyze_charts'] }).notNull(),
  status: text('status', { enum: ['pending', 'in_progress', 'completed', 'failed'] }).notNull(),
  parentJobId: text('parent_job_id'),
  metadata: text('metadata').notNull(), // JSON string
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
  error: text('error'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Versions table - tracks data collection versions (keeping existing structure)
export const versions = sqliteTable('versions', {
  id: text('id').primaryKey(),
  source: text('source', { enum: ['cmc', 'cg', 'both'] }).notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  coinCount: integer('coin_count').notNull(),
});

// Images table - stores chart images (keeping existing structure)
export const images = sqliteTable('images', {
  id: text('id').primaryKey(),
  versionId: text('version_id').notNull().references(() => versions.id),
  type: text('type', { enum: ['full', 'anon'] }).notNull(),
  pair: text('pair').notNull(),
  capturedAt: text('captured_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  path: text('path').notNull(),
  thumbPath: text('thumb_path'),
});

// Export types for the schema
export type Pair = typeof pairs.$inferSelect;
export type NewPair = typeof pairs.$inferInsert;
export type Chart = typeof charts.$inferSelect;
export type NewChart = typeof charts.$inferInsert;
export type ChartAnalysis = typeof chartAnalyses.$inferSelect;
export type NewChartAnalysis = typeof chartAnalyses.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type Version = typeof versions.$inferSelect;
export type NewVersion = typeof versions.$inferInsert;
export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;

-- Migration: 0000_initial_schema.sql
-- Description: Initial database schema for crypto coin strategy builder
-- Tables: pairs, charts, chart_analyses, jobs, versions, images

-- Create pairs table
CREATE TABLE IF NOT EXISTS "pairs" (
	"id" text PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"rank" integer NOT NULL,
	"market_cap" real NOT NULL,
	"volume_24h" real NOT NULL,
	"price" real NOT NULL,
	"price_change_24h" real NOT NULL,
	"price_change_percent_24h" real NOT NULL,
	"created_at" text NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updated_at" text NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create charts table
CREATE TABLE IF NOT EXISTS "charts" (
	"id" text PRIMARY KEY NOT NULL,
	"pair_id" text NOT NULL,
	"pair_symbol" text NOT NULL,
	"original_chart_path" text NOT NULL,
	"anonymized_chart_path" text,
	"captured_at" text NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"viewport_width" integer NOT NULL,
	"viewport_height" integer NOT NULL,
	"exchange" text NOT NULL,
	"timeframe" text NOT NULL,
	"theme" text NOT NULL,
	"window_days" integer NOT NULL,
	"created_at" text NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updated_at" text NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY ("pair_id") REFERENCES "pairs"("id") ON DELETE CASCADE
);

-- Create chart_analyses table
CREATE TABLE IF NOT EXISTS "chart_analyses" (
	"id" text PRIMARY KEY NOT NULL,
	"chart_id" text NOT NULL,
	"pair_id" text NOT NULL,
	"ai_name" text NOT NULL,
	"analysis_json" text NOT NULL,
	"trend" text NOT NULL,
	"trend_confidence" real NOT NULL,
	"countertrend" text NOT NULL,
	"countertrend_confidence" real NOT NULL,
	"trend_rank" integer NOT NULL,
	"countertrend_rank" integer NOT NULL,
	"rank_sum" integer NOT NULL,
	"overall_rank" integer NOT NULL,
	"created_at" text NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updated_at" text NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY ("chart_id") REFERENCES "charts"("id") ON DELETE CASCADE,
	FOREIGN KEY ("pair_id") REFERENCES "charts"("pair_id") ON DELETE CASCADE
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL CHECK ("type" IN ('fetch_pairs', 'capture_charts', 'anonymize_charts', 'analyze_charts')),
	"status" text NOT NULL CHECK ("status" IN ('pending', 'in_progress', 'completed', 'failed')),
	"parent_job_id" text,
	"metadata" text NOT NULL,
	"started_at" text,
	"completed_at" text,
	"error" text,
	"created_at" text NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updated_at" text NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY ("parent_job_id") REFERENCES "jobs"("id") ON DELETE SET NULL
);

-- Create versions table (keeping existing structure)
CREATE TABLE IF NOT EXISTS "versions" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL CHECK ("source" IN ('cmc', 'cg', 'both')),
	"created_at" text NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"coin_count" integer NOT NULL
);

-- Create images table (keeping existing structure)
CREATE TABLE IF NOT EXISTS "images" (
	"id" text PRIMARY KEY NOT NULL,
	"version_id" text NOT NULL,
	"type" text NOT NULL CHECK ("type" IN ('full', 'anon')),
	"pair" text NOT NULL,
	"captured_at" text NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"path" text NOT NULL,
	"thumb_path" text,
	FOREIGN KEY ("version_id") REFERENCES "versions"("id") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "pairs_symbol_idx" ON "pairs" ("symbol");
CREATE INDEX IF NOT EXISTS "pairs_rank_idx" ON "pairs" ("rank");
CREATE INDEX IF NOT EXISTS "charts_pair_id_idx" ON "charts" ("pair_id");
CREATE INDEX IF NOT EXISTS "charts_pair_symbol_idx" ON "charts" ("pair_symbol");
CREATE INDEX IF NOT EXISTS "chart_analyses_chart_id_idx" ON "chart_analyses" ("chart_id");
CREATE INDEX IF NOT EXISTS "chart_analyses_pair_id_idx" ON "chart_analyses" ("pair_id");
CREATE INDEX IF NOT EXISTS "jobs_type_idx" ON "jobs" ("type");
CREATE INDEX IF NOT EXISTS "jobs_status_idx" ON "jobs" ("status");
CREATE INDEX IF NOT EXISTS "jobs_parent_id_idx" ON "jobs" ("parent_job_id");
CREATE INDEX IF NOT EXISTS "images_version_id_idx" ON "images" ("version_id");
CREATE INDEX IF NOT EXISTS "images_pair_idx" ON "images" ("pair");



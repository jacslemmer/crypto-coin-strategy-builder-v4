CREATE TABLE `chart_analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`chart_id` text NOT NULL,
	`pair_id` text NOT NULL,
	`ai_name` text NOT NULL,
	`analysis_json` text NOT NULL,
	`trend` text NOT NULL,
	`trend_confidence` real NOT NULL,
	`countertrend` text NOT NULL,
	`countertrend_confidence` real NOT NULL,
	`trend_rank` integer NOT NULL,
	`countertrend_rank` integer NOT NULL,
	`rank_sum` integer NOT NULL,
	`overall_rank` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`chart_id`) REFERENCES `charts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pair_id`) REFERENCES `charts`(`pair_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `charts` (
	`id` text PRIMARY KEY NOT NULL,
	`pair_id` text NOT NULL,
	`pair_symbol` text NOT NULL,
	`original_chart_path` text NOT NULL,
	`anonymized_chart_path` text,
	`captured_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`viewport_width` integer NOT NULL,
	`viewport_height` integer NOT NULL,
	`exchange` text NOT NULL,
	`timeframe` text NOT NULL,
	`theme` text NOT NULL,
	`window_days` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`pair_id`) REFERENCES `pairs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `images` (
	`id` text PRIMARY KEY NOT NULL,
	`version_id` text NOT NULL,
	`type` text NOT NULL,
	`pair` text NOT NULL,
	`captured_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`path` text NOT NULL,
	`thumb_path` text,
	FOREIGN KEY (`version_id`) REFERENCES `versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`parent_job_id` text,
	`metadata` text NOT NULL,
	`started_at` text,
	`completed_at` text,
	`error` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pairs` (
	`id` text PRIMARY KEY NOT NULL,
	`symbol` text NOT NULL,
	`rank` integer NOT NULL,
	`market_cap` real NOT NULL,
	`volume_24h` real NOT NULL,
	`price` real NOT NULL,
	`price_change_24h` real NOT NULL,
	`price_change_percent_24h` real NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `versions` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`coin_count` integer NOT NULL
);

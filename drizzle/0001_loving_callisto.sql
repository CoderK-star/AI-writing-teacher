CREATE TABLE `plot_maker_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`chapter_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'event' NOT NULL,
	`template_key` text,
	`column_index` integer DEFAULT 0 NOT NULL,
	`row_index` integer DEFAULT 0 NOT NULL,
	`color` text,
	`linked_character_ids` text DEFAULT '[]' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `timeline_cells` (
	`id` text PRIMARY KEY NOT NULL,
	`track_id` text NOT NULL,
	`plot_point_id` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`track_id`) REFERENCES `timeline_tracks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`plot_point_id`) REFERENCES `plot_points`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `timeline_tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`track_type` text DEFAULT 'custom' NOT NULL,
	`character_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `characters` ADD `gender` text;--> statement-breakpoint
ALTER TABLE `characters` ADD `age` integer;--> statement-breakpoint
ALTER TABLE `characters` ADD `birthday` text;--> statement-breakpoint
ALTER TABLE `characters` ADD `height` text;--> statement-breakpoint
ALTER TABLE `characters` ADD `weight` text;--> statement-breakpoint
ALTER TABLE `characters` ADD `personality` text;--> statement-breakpoint
ALTER TABLE `characters` ADD `profile_image` text;--> statement-breakpoint
ALTER TABLE `plot_points` ADD `chapter_id` text REFERENCES chapters(id);--> statement-breakpoint
ALTER TABLE `plot_points` ADD `scope` text DEFAULT 'global' NOT NULL;
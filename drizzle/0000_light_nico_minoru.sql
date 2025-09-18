CREATE TABLE `websites` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`url` text NOT NULL,
	`favicon_url` text,
	`screenshot_url` text,
	`tags` text,
	`category` text,
	`is_ad` integer DEFAULT false NOT NULL,
	`ad_type` text,
	`rating` integer,
	`visit_count` integer DEFAULT 0 NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`is_public` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);

CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`color` text,
	`icon` text,
	`created_at` text DEFAULT 'datetime(''now'')' NOT NULL,
	`updated_at` text DEFAULT 'datetime(''now'')' NOT NULL
);

CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);
CREATE INDEX `categories_name_idx` ON `categories` (`name`);
CREATE INDEX `categories_slug_idx` ON `categories` (`slug`);
CREATE INDEX `categories_created_at_idx` ON `categories` (`created_at`);
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT 'datetime(''now'')' NOT NULL,
	`updated_at` text DEFAULT 'datetime(''now'')' NOT NULL
);

CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);
CREATE INDEX `tags_name_idx` ON `tags` (`name`);
CREATE INDEX `tags_slug_idx` ON `tags` (`slug`);
CREATE INDEX `tags_created_at_idx` ON `tags` (`created_at`);
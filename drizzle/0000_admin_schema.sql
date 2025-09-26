-- WebVault consolidated schema migration

-- Categories
CREATE TABLE `categories` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL,
  `description` text,
  `parent_id` text,
  `display_order` integer DEFAULT 0 NOT NULL,
  `icon` text,
  `is_active` integer DEFAULT 1 NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);

-- Websites
CREATE TABLE `websites` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `description` text,
  `url` text NOT NULL,
  `slug` text,
  `favicon_url` text,
  `screenshot_url` text,
  `category_id` text,
  `is_ad` integer DEFAULT 0 NOT NULL,
  `ad_type` text,
  `rating` integer,
  `visit_count` integer DEFAULT 0 NOT NULL,
  `is_featured` integer DEFAULT 0 NOT NULL,
  `is_public` integer DEFAULT 1 NOT NULL,
  `status` text DEFAULT 'active' NOT NULL,
  `review_status` text DEFAULT 'pending' NOT NULL,
  `notes` text,
  `submitted_by` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  CONSTRAINT `websites_slug_unique` UNIQUE(`slug`),
  CONSTRAINT `websites_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE cascade ON DELETE set null
);

CREATE INDEX `websites_category_idx` ON `websites` (`category_id`);
CREATE INDEX `websites_review_status_idx` ON `websites` (`review_status`);

-- Tags
CREATE TABLE `tags` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL,
  `description` text,
  `color` text,
  `is_active` integer DEFAULT 1 NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  CONSTRAINT `tags_slug_unique` UNIQUE(`slug`)
);

-- Website ↔ Tag relation
CREATE TABLE `website_tags` (
  `website_id` text NOT NULL,
  `tag_id` text NOT NULL,
  `assigned_at` text NOT NULL,
  PRIMARY KEY (`website_id`, `tag_id`),
  CONSTRAINT `website_tags_website_id_websites_id_fk` FOREIGN KEY (`website_id`) REFERENCES `websites`(`id`) ON UPDATE cascade ON DELETE cascade,
  CONSTRAINT `website_tags_tag_id_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE cascade ON DELETE cascade
);

-- Collections
CREATE TABLE `collections` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL,
  `description` text,
  `cover_image` text,
  `is_featured` integer DEFAULT 0 NOT NULL,
  `display_order` integer DEFAULT 0 NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  CONSTRAINT `collections_slug_unique` UNIQUE(`slug`)
);

CREATE INDEX `collections_featured_idx` ON `collections` (`is_featured`);

-- Collection items
CREATE TABLE `collection_items` (
  `id` text PRIMARY KEY NOT NULL,
  `collection_id` text NOT NULL,
  `website_id` text NOT NULL,
  `note` text,
  `position` integer DEFAULT 0 NOT NULL,
  `created_at` text NOT NULL,
  CONSTRAINT `collection_items_collection_id_collections_id_fk` FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE cascade ON DELETE cascade,
  CONSTRAINT `collection_items_website_id_websites_id_fk` FOREIGN KEY (`website_id`) REFERENCES `websites`(`id`) ON UPDATE cascade ON DELETE cascade
);

CREATE INDEX `collection_items_collection_idx` ON `collection_items` (`collection_id`);

-- Blog posts
CREATE TABLE `blog_posts` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `slug` text NOT NULL,
  `summary` text,
  `content` text NOT NULL,
  `status` text DEFAULT 'draft' NOT NULL,
  `published_at` text,
  `cover_image` text,
  `author_id` text,
  `tags` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  CONSTRAINT `blog_posts_slug_unique` UNIQUE(`slug`)
);

CREATE INDEX `blog_posts_status_idx` ON `blog_posts` (`status`);

-- Submission requests (optional moderation queue)
CREATE TABLE `submission_requests` (
  `id` text PRIMARY KEY NOT NULL,
  `website_id` text,
  `payload` text NOT NULL,
  `submitted_by` text,
  `status` text DEFAULT 'pending' NOT NULL,
  `reviewed_by` text,
  `reviewed_at` text,
  `created_at` text NOT NULL,
  CONSTRAINT `submission_requests_website_id_websites_id_fk` FOREIGN KEY (`website_id`) REFERENCES `websites`(`id`) ON UPDATE cascade ON DELETE set null
);

CREATE INDEX `submission_requests_status_idx` ON `submission_requests` (`status`);

-- Audit logs
CREATE TABLE `audit_logs` (
  `id` text PRIMARY KEY NOT NULL,
  `actor_id` text NOT NULL,
  `action` text NOT NULL,
  `entity_type` text NOT NULL,
  `entity_id` text NOT NULL,
  `changes` text,
  `created_at` text NOT NULL
);

CREATE INDEX `audit_logs_entity_idx` ON `audit_logs` (`entity_type`, `entity_id`);


-- Remove isFeatured and rating columns from websites table
-- Migration: 0006_remove_featured_rating

-- SQLite doesn't support DROP COLUMN directly, need to recreate table
-- First, create backup of existing data
CREATE TABLE websites_backup AS SELECT * FROM websites;

-- Drop the old table
DROP TABLE websites;

-- Recreate table without is_featured and rating columns (based on actual current schema)
CREATE TABLE websites (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  slug TEXT,
  favicon_url TEXT,
  screenshot_url TEXT,
  category_id TEXT,
  is_ad INTEGER NOT NULL DEFAULT 0,
  ad_type TEXT,
  visit_count INTEGER NOT NULL DEFAULT 0,
  is_public INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  review_status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  submitted_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Restore data (excluding is_featured and rating)
INSERT INTO websites (
  id, title, description, url, slug, favicon_url, screenshot_url, category_id,
  is_ad, ad_type, visit_count, is_public, status, review_status, notes, submitted_by,
  created_at, updated_at
)
SELECT
  id, title, description, url, slug, favicon_url, screenshot_url, category_id,
  is_ad, ad_type, visit_count, is_public, status, review_status, notes, submitted_by,
  created_at, updated_at
FROM websites_backup;

-- Drop backup table
DROP TABLE websites_backup;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_websites_category ON websites(category_id);
CREATE INDEX IF NOT EXISTS idx_websites_status ON websites(status);
CREATE INDEX IF NOT EXISTS idx_websites_created_at ON websites(created_at);

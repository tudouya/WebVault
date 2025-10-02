-- Simplify website status system
-- Remove review_status and is_public, consolidate into single status field

-- Step 1: Add temporary column for new status values
ALTER TABLE `websites` ADD COLUMN `new_status` text NOT NULL DEFAULT 'draft';

-- Step 2: Migrate existing data
-- Logic: active + public → published, everything else → draft
UPDATE `websites`
SET `new_status` = CASE
  WHEN `status` = 'active' AND `is_public` = 1 THEN 'published'
  ELSE 'draft'
END;

-- Step 3: Drop old columns and index
DROP INDEX IF EXISTS `websites_review_status_idx`;
ALTER TABLE `websites` DROP COLUMN `status`;
ALTER TABLE `websites` DROP COLUMN `review_status`;
ALTER TABLE `websites` DROP COLUMN `is_public`;

-- Step 4: Rename new_status to status
ALTER TABLE `websites` RENAME COLUMN `new_status` TO `status`;

-- Step 5: Create new index for status
CREATE INDEX `websites_status_idx` ON `websites` (`status`);

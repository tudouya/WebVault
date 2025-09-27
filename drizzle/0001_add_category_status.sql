-- Add status column to categories to support hidden/inactive states
ALTER TABLE `categories`
  ADD COLUMN `status` text NOT NULL DEFAULT 'active';

UPDATE `categories`
SET `status` = CASE WHEN `is_active` = 1 THEN 'active' ELSE 'inactive' END
WHERE `status` IS NULL OR `status` = '';

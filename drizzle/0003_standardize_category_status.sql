-- Standardize category status values to the canonical set (active | inactive | hidden)

UPDATE categories
SET status = 'active',
    is_active = 1
WHERE status IN ('active', 'published', 'enabled', 'true', '')
   OR status IS NULL;

UPDATE categories
SET status = 'inactive',
    is_active = 0
WHERE status IN ('inactive', 'draft', 'disabled', 'false');

UPDATE categories
SET status = 'hidden',
    is_active = 0
WHERE status = 'hidden';

-- Any remaining unexpected values fall back to inactive for safety
UPDATE categories
SET status = 'inactive',
    is_active = 0
WHERE status NOT IN ('active', 'inactive', 'hidden');

-- Add source to distinguish Slack completion docs from manual uploads
ALTER TABLE documents ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'upload';
-- 'upload' = manual upload via modal or Add Form
-- 'complete' = submitted via Slack form completion

-- Store full SAM.gov opportunity data (JSON from API)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS sam_data JSONB;

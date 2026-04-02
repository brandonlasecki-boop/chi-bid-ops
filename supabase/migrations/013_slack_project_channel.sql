-- Dedicated Slack channel per contract/project
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS slack_channel_id TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS slack_project_seq INTEGER;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS opportunity_number INTEGER;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS naics TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS opportunity_type TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS service_area TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS prospect_contractors TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS key_personnel TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS equipment_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_contracts_slack_channel_id ON contracts(slack_channel_id) WHERE slack_channel_id IS NOT NULL;

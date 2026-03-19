-- Track when a form was requested in Slack
ALTER TABLE forms ADD COLUMN IF NOT EXISTS slack_requested_at TIMESTAMPTZ;

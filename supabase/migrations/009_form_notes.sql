-- Add notes column to forms
ALTER TABLE forms ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add SAM.gov fields (run this if you already have contracts table from 001)
-- Safe to run: uses IF NOT EXISTS
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS sam_notice_id TEXT,
  ADD COLUMN IF NOT EXISTS solicitation_number TEXT,
  ADD COLUMN IF NOT EXISTS sam_url TEXT;

CREATE INDEX IF NOT EXISTS idx_contracts_sam_notice_id ON contracts(sam_notice_id);

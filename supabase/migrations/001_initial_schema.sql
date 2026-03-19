-- Contract status enum
CREATE TYPE contract_status AS ENUM (
  'intake',
  'in_progress',
  'review',
  'ready',
  'submitted'
);

-- Form status enum
CREATE TYPE form_status AS ENUM (
  'not_started',
  'in_progress',
  'in_review',
  'blocked',
  'complete'
);

-- Contracts table
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  agency TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  status contract_status NOT NULL DEFAULT 'intake',
  progress NUMERIC(5, 2) NOT NULL DEFAULT 0,
  slack_thread_ts TEXT,
  sam_notice_id TEXT,
  solicitation_number TEXT,
  sam_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Forms table
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  status form_status NOT NULL DEFAULT 'not_started',
  due_date TIMESTAMPTZ,
  weight INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_forms_contract_id ON forms(contract_id);
CREATE INDEX idx_forms_assigned_to ON forms(assigned_to);
CREATE INDEX idx_forms_status ON forms(status);
CREATE INDEX idx_documents_form_id ON documents(form_id);
CREATE INDEX idx_contracts_due_date ON contracts(due_date);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_sam_notice_id ON contracts(sam_notice_id);

-- Enable RLS (optional - for Supabase Auth)
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Allow all for now (MVP - can restrict later with auth)
CREATE POLICY "Allow all on contracts" ON contracts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on forms" ON forms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on documents" ON documents FOR ALL USING (true) WITH CHECK (true);

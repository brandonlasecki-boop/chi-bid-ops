-- Assignees table for form assignments
CREATE TABLE assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignees_email ON assignees(email);

-- Seed initial assignees
INSERT INTO assignees (name, email) VALUES
  ('Paul Garraty', 'ptgarraty@gmail.com'),
  ('Anthony Donahue', 'anthony@communityhealthinternational.com'),
  ('Arym Mora', 'arym@bespokeconciergemd.com'),
  ('Candida Carley', 'candycarley@gmail.com'),
  ('Drew Thomas', 'drew.m.thomas92@gmail.com'),
  ('Kyri Mora', 'Kyri@BespokeConciergeMD.com'),
  ('Lance Lim', 'lance3lim@gmail.com'),
  ('Stephanie Martin', 'ariesteff2826@gmail.com'),
  ('Analie Pabello', 'analiepabello.ap@gmail.com');

ALTER TABLE assignees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on assignees" ON assignees FOR ALL USING (true) WITH CHECK (true);

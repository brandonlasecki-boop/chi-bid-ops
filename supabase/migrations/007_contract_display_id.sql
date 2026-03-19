-- Human-readable contract ID (CHI-0001, CHI-0002, ...) for Slack and display
CREATE SEQUENCE IF NOT EXISTS contract_display_seq START 1;

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS display_id TEXT UNIQUE;

-- Backfill existing contracts in created_at order
WITH numbered AS (
  SELECT id, 'CHI-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 4, '0') AS new_id
  FROM contracts
  WHERE display_id IS NULL
)
UPDATE contracts c SET display_id = n.new_id
FROM numbered n WHERE c.id = n.id;

-- Set sequence to continue after existing max
SELECT setval('contract_display_seq', COALESCE(
  (SELECT MAX(SUBSTRING(display_id FROM 5)::int) FROM contracts WHERE display_id ~ '^CHI-[0-9]+$'),
  0
) + 1);

-- Trigger to auto-set display_id on new inserts
CREATE OR REPLACE FUNCTION set_contract_display_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.display_id IS NULL THEN
    NEW.display_id := 'CHI-' || LPAD(nextval('contract_display_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_contract_insert_display_id ON contracts;
CREATE TRIGGER before_contract_insert_display_id
  BEFORE INSERT ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION set_contract_display_id();

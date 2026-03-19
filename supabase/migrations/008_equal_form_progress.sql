-- Update progress calculation: each form contributes equally (ignore weight)
-- Run this if you already have 002 applied

CREATE OR REPLACE FUNCTION calculate_contract_progress(p_contract_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  v_form_count INTEGER;
  v_sum NUMERIC := 0;
  v_form RECORD;
  v_status_pct NUMERIC;
BEGIN
  SELECT COUNT(*) INTO v_form_count
  FROM forms WHERE contract_id = p_contract_id;

  IF v_form_count = 0 THEN
    RETURN 0;
  END IF;

  FOR v_form IN
    SELECT status FROM forms WHERE contract_id = p_contract_id
  LOOP
    v_status_pct := CASE v_form.status
      WHEN 'not_started' THEN 0
      WHEN 'in_progress' THEN 50
      WHEN 'in_review' THEN 80
      WHEN 'blocked' THEN 0
      WHEN 'complete' THEN 100
      ELSE 0
    END;
    v_sum := v_sum + v_status_pct;
  END LOOP;

  RETURN ROUND((v_sum / v_form_count)::NUMERIC, 2);
END;
$$;

-- Update trigger (no longer needs to fire on weight changes)
DROP TRIGGER IF EXISTS forms_progress_trigger ON forms;
CREATE TRIGGER forms_progress_trigger
  AFTER INSERT OR UPDATE OF status OR DELETE ON forms
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_update_contract_progress();

-- Recalculate progress for all existing contracts
UPDATE contracts
SET progress = calculate_contract_progress(id);

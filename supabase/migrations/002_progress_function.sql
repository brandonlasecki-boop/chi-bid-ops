-- Form status to progress percentage mapping
-- not_started = 0, in_progress = 50, in_review = 80, blocked = 0, complete = 100
-- Each form contributes equally (no weight factor)

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
  -- Get form count
  SELECT COUNT(*) INTO v_form_count
  FROM forms
  WHERE contract_id = p_contract_id;

  IF v_form_count = 0 THEN
    RETURN 0;
  END IF;

  -- Map form status to percentage; each form contributes equally
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

-- Trigger function to recalculate contract progress when form changes
CREATE OR REPLACE FUNCTION trigger_update_contract_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_contract_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_contract_id := OLD.contract_id;
  ELSE
    v_contract_id := NEW.contract_id;
  END IF;

  -- Progress only moves up; never decreases when forms are uncompleted
  UPDATE contracts
  SET progress = calculate_contract_progress(v_contract_id)
  WHERE id = v_contract_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on forms table
DROP TRIGGER IF EXISTS forms_progress_trigger ON forms;
CREATE TRIGGER forms_progress_trigger
  AFTER INSERT OR UPDATE OF status OR DELETE ON forms
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_update_contract_progress();

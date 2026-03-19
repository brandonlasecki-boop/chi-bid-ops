-- Progress only moves up; never decreases when forms are uncompleted

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
  SET progress = GREATEST(progress, calculate_contract_progress(v_contract_id))
  WHERE id = v_contract_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

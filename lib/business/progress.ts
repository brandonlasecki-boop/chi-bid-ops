import { createServerClient } from '@/lib/supabase/server';
import { FORM_STATUS_PERCENT } from '@/types';
import type { FormStatus } from '@/types';

/**
 * Calculate contract progress based on form statuses and weights.
 * Status mapping: not_started=0, in_progress=50, in_review=80, blocked=0, complete=100
 */
export async function calculateContractProgress(contractId: string): Promise<number> {
  const supabase = createServerClient();
  const { data: forms, error } = await supabase
    .from('forms')
    .select('status, weight')
    .eq('contract_id', contractId);

  if (error) throw error;
  if (!forms || forms.length === 0) return 0;

  type FormRow = { status: string; weight: number };
  const rows = forms as FormRow[];
  const totalWeight = rows.reduce((sum, f) => sum + f.weight, 0);
  const weightedSum = rows.reduce((sum, f) => {
    const pct = FORM_STATUS_PERCENT[f.status as FormStatus] ?? 0;
    return sum + (pct * f.weight) / 100;
  }, 0);

  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

/**
 * Recalculate and persist contract progress.
 * Note: The DB trigger handles this automatically on form changes.
 * Use this for manual recalculation if needed.
 */
export async function recalculateAndPersistProgress(contractId: string): Promise<number> {
  const progress = await calculateContractProgress(contractId);
  const supabase = createServerClient();
  await supabase.from('contracts').update({ progress }).eq('id', contractId);
  return progress;
}

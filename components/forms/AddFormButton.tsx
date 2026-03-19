'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createFormAction } from '@/app/actions/forms';

interface AddFormButtonProps {
  contractId: string;
}

export function AddFormButton({ contractId }: AddFormButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get('name') as string)?.trim();
    if (!name) {
      setError('Form name is required');
      return;
    }
    setError(null);
    setPending(true);
    try {
      const dueDate = (formData.get('due_date') as string)?.trim();
      await createFormAction({
        contract_id: contractId,
        name,
        description: (formData.get('description') as string)?.trim() || null,
        due_date: dueDate || null,
      });
      setOpen(false);
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add form');
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
        >
          + Add Form
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="p-4 rounded-lg border border-slate-700 bg-slate-800/50 space-y-3"
        >
          {error && (
            <p className="text-rose-400 text-sm">{error}</p>
          )}
          <input
            name="name"
            placeholder="Form name"
            required
            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-100 text-sm"
          />
          <input
            name="description"
            placeholder="Description (optional)"
            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-100 text-sm"
          />
          <input
            name="due_date"
            type="date"
            defaultValue={new Date().toISOString().split('T')[0]}
            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-100 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded disabled:opacity-50"
            >
              {pending ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-200 text-sm rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAssigneeAction } from '@/app/actions/assignees';
import { Modal } from '@/components/ui/Modal';

interface AddAssigneeModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddAssigneeModal({ open, onClose }: AddAssigneeModalProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get('name') as string)?.trim();
    const email = (formData.get('email') as string)?.trim();
    if (!name || !email) {
      setError('Name and email are required');
      return;
    }
    setError(null);
    setPending(true);
    try {
      await createAssigneeAction({ name, email });
      onClose();
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add assignee');
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Assignee">
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <p className="text-rose-400 text-sm">{error}</p>}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Name</label>
          <input
            name="name"
            placeholder="e.g. Jane Smith"
            required
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-slate-100 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Email</label>
          <input
            name="email"
            type="email"
            placeholder="e.g. jane@example.com"
            required
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-slate-100 text-sm"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded disabled:opacity-50"
          >
            {pending ? 'Adding...' : 'Add Assignee'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 text-sm rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

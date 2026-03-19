'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createFormAction } from '@/app/actions/forms';
import { uploadDocumentAction } from '@/app/actions/documents';
import { Modal } from '@/components/ui/Modal';

interface AddFormModalProps {
  open: boolean;
  onClose: () => void;
  contractId: string;
}

export function AddFormModal({ open, onClose, contractId }: AddFormModalProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    const file = formData.get('file') as File | null;
    setError(null);
    setPending(true);
    try {
      const dueDate = (formData.get('due_date') as string)?.trim();
      const newForm = await createFormAction({
        contract_id: contractId,
        name,
        description: (formData.get('description') as string)?.trim() || null,
        notes: (formData.get('notes') as string)?.trim() || null,
        due_date: dueDate || null,
      });

      if (file && file.size > 0) {
        const uploadFormData = new FormData();
        uploadFormData.set('file', file);
        await uploadDocumentAction(newForm.id, uploadFormData);
      }

      onClose();
      form.reset();
      if (fileInputRef.current) fileInputRef.current.value = '';
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add form');
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Form">
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <p className="text-rose-400 text-sm">{error}</p>}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Form name</label>
          <input
            name="name"
            placeholder="e.g. Technical Approach"
            required
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-slate-100 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Description (optional)</label>
          <textarea
            name="description"
            rows={4}
            placeholder="Brief description"
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-slate-100 text-sm resize-y min-h-[100px]"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Notes (optional)</label>
          <textarea
            name="notes"
            rows={2}
            placeholder="Notes for Slack"
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-slate-100 text-sm resize-y"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Due date</label>
          <input
            name="due_date"
            type="date"
            defaultValue={new Date().toISOString().split('T')[0]}
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-slate-100 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Upload file (optional)</label>
          <input
            ref={fileInputRef}
            name="file"
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif"
            className="w-full text-slate-400 text-sm file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-slate-600 file:text-slate-100 file:text-sm file:cursor-pointer"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded disabled:opacity-50"
          >
            {pending ? 'Adding...' : 'Add Form'}
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

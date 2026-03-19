'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteContractAction } from '@/app/actions/contracts';

interface DeleteContractButtonProps {
  contractId: string;
  contractTitle: string;
}

export function DeleteContractButton({ contractId, contractTitle }: DeleteContractButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteContractAction(contractId);
      router.push('/');
      router.refresh();
    } catch (err) {
      setDeleting(false);
      setConfirming(false);
      alert(err instanceof Error ? err.message : 'Failed to delete contract');
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">Delete &quot;{contractTitle}&quot;?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-sm rounded disabled:opacity-50"
        >
          {deleting ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-slate-200 text-sm rounded disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-slate-500 hover:text-rose-400 text-sm"
    >
      Delete contract
    </button>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { uploadDocumentAction, deleteDocumentAction, fetchDocuments } from '@/app/actions/documents';
import { Modal } from '@/components/ui/Modal';
import type { Document } from '@/types';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  formId: string;
  formName: string;
  initialDocuments?: Document[];
}

export function UploadModal({
  open,
  onClose,
  formId,
  formName,
  initialDocuments = [],
}: UploadModalProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);

  useEffect(() => {
    if (open && formId) {
      fetchDocuments(formId).then(setDocuments).catch(() => setDocuments([]));
    }
  }, [open, formId]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [asCompleted, setAsCompleted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleDelete(docId: string) {
    setDeletingId(docId);
    try {
      await deleteDocumentAction(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set('file', file);
      await uploadDocumentAction(formId, formData);
      const updated = await fetchDocuments(formId);
      setDocuments(updated);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Upload — ${formName}`}>
      <div className="space-y-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={asCompleted}
            onChange={(e) => setAsCompleted(e.target.checked)}
            className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
          />
          <span className="text-sm text-slate-300">Mark as completed</span>
        </label>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-3 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : '+ Choose file to upload'}
          </button>
        </div>

        {error && <p className="text-rose-400 text-sm">{error}</p>}

        {documents.length > 0 && (
          <div>
            <p className="text-sm text-slate-400 mb-2">Uploaded files</p>
            <ul className="space-y-1">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center gap-2 group">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 text-sm flex-1 truncate"
                  >
                    {doc.file_name}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="text-slate-500 hover:text-rose-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    title="Remove file"
                  >
                    {deletingId === doc.id ? '…' : 'Remove'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}

'use client';

import { useState } from 'react';
import { FormsTable } from './FormsTable';
import { AddFormModal } from './AddFormModal';
import { AddAssigneeModal } from './AddAssigneeModal';
import { UploadModal } from './UploadModal';
import type { Form } from '@/types';
import type { Assignee } from './FormsTable';

interface FormsSectionProps {
  contractId: string;
  forms: Form[];
  assignees: Assignee[];
  documentsByForm?: Record<string, import('@/types').Document[]>;
}

export function FormsSection({ contractId, forms, assignees, documentsByForm = {} }: FormsSectionProps) {
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [addAssigneeOpen, setAddAssigneeOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState<Form | null>(null);

  const completedForms = forms.filter((f) => f.status === 'complete' && (documentsByForm[f.id]?.length ?? 0) > 0);

  return (
    <section>
      {completedForms.length > 0 && (
        <div className="mb-8 rounded-lg border border-emerald-700/50 bg-emerald-950/20 p-6">
          <h2 className="text-lg font-medium text-emerald-200 mb-4">Completed</h2>
          <div className="space-y-4">
            {completedForms.map((form) => (
              <div key={form.id} className="flex flex-wrap items-center gap-3">
                <span className="font-medium text-slate-100">{form.name}</span>
                <span className="text-slate-500">—</span>
                <div className="flex flex-wrap gap-2">
                  {documentsByForm[form.id].map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                    >
                      {doc.file_name}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-slate-200">Forms</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAddAssigneeOpen(true)}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 text-sm rounded-lg font-medium"
          >
            + Add Assignee
          </button>
          <button
            type="button"
            onClick={() => setAddFormOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg font-medium"
          >
            + Add Form
          </button>
        </div>
      </div>

      <FormsTable
        forms={forms}
        contractId={contractId}
        assignees={assignees}
        documentsByForm={documentsByForm}
        onUploadClick={(form) => setUploadForm(form)}
      />

      <AddAssigneeModal open={addAssigneeOpen} onClose={() => setAddAssigneeOpen(false)} />

      <AddFormModal
        open={addFormOpen}
        onClose={() => setAddFormOpen(false)}
        contractId={contractId}
      />

      {uploadForm && (
        <UploadModal
          open={!!uploadForm}
          onClose={() => setUploadForm(null)}
          formId={uploadForm.id}
          formName={uploadForm.name}
        />
      )}
    </section>
  );
}

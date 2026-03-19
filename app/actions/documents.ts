'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { createDocument, getDocumentById, getUploadDocumentsByFormId } from '@/lib/db/documents';
import { getFormById } from '@/lib/db/forms';

const BUCKET = process.env.STORAGE_BUCKET ?? 'form-documents';

export async function fetchDocuments(formId: string) {
  return getUploadDocumentsByFormId(formId);
}

export async function uploadDocumentAction(formId: string, formData: FormData) {
  const file = formData.get('file') as File;
  if (!file || file.size === 0) {
    throw new Error('No file selected');
  }
  const asCompleted = formData.get('asCompleted') === 'true';

  const form = await getFormById(formId);
  if (!form) throw new Error('Form not found');

  const supabase = createServerClient();
  const ext = file.name.split('.').pop() || 'bin';
  const path = `${form.contract_id}/${formId}/${crypto.randomUUID()}.${ext}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    const msg = typeof uploadError === 'string' ? uploadError : (uploadError as Error).message;
    if (msg?.includes('Bucket not found') || msg?.includes('404')) {
      throw new Error(
        `Storage bucket "${BUCKET}" not found. Known Supabase bug: bucket may exist but upload fails. Try: 1) Delete the bucket in Dashboard, 2) Run the SQL in supabase/migrations/004_storage_bucket.sql in SQL Editor (creates bucket + policies), 3) Wait 1-2 min, 4) Try upload again. Or contact Supabase support.`
      );
    }
    throw new Error(msg ?? 'Upload failed');
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path);
  const fileUrl = urlData.publicUrl;

  await createDocument({
    form_id: formId,
    file_url: fileUrl,
    file_name: file.name,
    source: asCompleted ? 'complete' : 'upload',
  });

  revalidatePath(`/contracts/${form.contract_id}`);
  return { ok: true };
}

export async function deleteDocumentAction(documentId: string) {
  const doc = await getDocumentById(documentId);
  const form = await getFormById(doc.form_id);

  const supabase = createServerClient();
  const pathMatch = doc.file_url.match(/\/object\/public\/[^/]+\/(.+)/);
  if (pathMatch) {
    await supabase.storage.from(BUCKET).remove([pathMatch[1]]);
  }

  const { error } = await supabase.from('documents').delete().eq('id', documentId);
  if (error) throw error;

  revalidatePath(`/contracts/${form.contract_id}`);
  return { ok: true };
}

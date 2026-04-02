import Link from 'next/link';
import { createContractAction } from '@/app/actions/contracts';
import { fetchAssigneesAction } from '@/app/actions/assignees';
import { CreateContractForm } from '@/components/contracts/CreateContractForm';

export const dynamic = 'force-dynamic';

export default async function NewContractPage() {
  const assignees = await fetchAssigneesAction().catch(() => []);

  return (
    <div>
      <Link
        href="/"
        className="text-sm text-slate-400 hover:text-slate-200 mb-6 inline-block"
      >
        ← Back
      </Link>

      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold text-slate-100 mb-6">New project / contract</h1>
        <CreateContractForm
          action={createContractAction}
          assignees={assignees.map((a) => ({ id: a.id, name: a.name, email: a.email }))}
        />
      </div>
    </div>
  );
}

import Link from 'next/link';
import { createContractAction } from '@/app/actions/contracts';

export const dynamic = 'force-dynamic';
import { CreateContractForm } from '@/components/contracts/CreateContractForm';

export default function NewContractPage() {
  return (
    <div>
      <Link
        href="/"
        className="text-sm text-slate-400 hover:text-slate-200 mb-6 inline-block"
      >
        ← Back to Dashboard
      </Link>

      <div className="max-w-xl">
        <h1 className="text-2xl font-semibold text-slate-100 mb-6">
          New Contract
        </h1>
        <CreateContractForm action={createContractAction} />
      </div>
    </div>
  );
}

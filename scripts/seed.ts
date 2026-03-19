import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
import type { Database } from '../types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('Seeding database...');

  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .insert({
      title: 'IT Support Services - GSA Schedule',
      agency: 'General Services Administration',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'in_progress',
      progress: 0,
    })
    .select()
    .single();

  if (contractError) {
    console.error('Failed to create contract:', contractError);
    process.exit(1);
  }

  const formStatuses = [
    'not_started',
    'in_progress',
    'in_review',
    'blocked',
    'complete',
  ] as const;

  const forms = [
    { name: 'Technical Approach', description: 'Describe technical methodology' },
    { name: 'Past Performance', description: 'Relevant past performance examples' },
    { name: 'Staffing Plan', description: 'Key personnel and org chart' },
    { name: 'Pricing Worksheet', description: 'Cost breakdown and pricing' },
    { name: 'Compliance Matrix', description: 'Requirements compliance checklist' },
  ];

  for (let i = 0; i < forms.length; i++) {
    const { error: formError } = await supabase.from('forms').insert({
      contract_id: contract.id,
      name: forms[i].name,
      description: forms[i].description,
      status: formStatuses[i],
      weight: 10,
      due_date: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
      assigned_to: i < 2 ? 'U01234567' : null,
      completed_at: formStatuses[i] === 'complete' ? new Date().toISOString() : null,
    });

    if (formError) {
      console.error('Failed to create form:', formError);
      process.exit(1);
    }
  }

  console.log('Seed complete!');
  console.log('Contract ID:', contract.id);
}

seed();

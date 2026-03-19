'use client';

interface SamDataSectionProps {
  samData: Record<string, unknown> | null;
}

function formatVal(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function ContactRow({ c }: { c: Record<string, unknown> }) {
  const name = c.fullName ?? c.fullname ?? c.name;
  const email = c.email;
  const phone = c.phone;
  const title = c.title;
  if (!name && !email && !phone) return null;
  return (
    <div className="text-sm text-slate-300 py-1">
      {name ? <span className="font-medium">{formatVal(name)}</span> : null}
      {title ? <span className="text-slate-500"> · {formatVal(title)}</span> : null}
      {email ? (
        <a href={`mailto:${formatVal(email)}`} className="text-emerald-400 hover:text-emerald-300 ml-1">
          {formatVal(email)}
        </a>
      ) : null}
      {phone ? <span className="text-slate-400 ml-1">{formatVal(phone)}</span> : null}
    </div>
  );
}

function PopDisplay(pop: Record<string, unknown> | null): string | null {
  if (!pop) return null;
  const parts: string[] = [];
  const addr = pop.streetAddress ?? pop.street_address;
  const cityObj = pop.city as Record<string, unknown> | undefined;
  const city = cityObj?.name ?? (typeof pop.city === 'string' ? pop.city : null);
  const stateObj = pop.state as Record<string, unknown> | undefined;
  const state = stateObj?.code ?? stateObj?.name ?? (typeof pop.state === 'string' ? pop.state : null);
  const zip = pop.zip;
  const countryObj = pop.country as Record<string, unknown> | undefined;
  const country = countryObj?.name ?? (typeof pop.country === 'string' ? pop.country : null);
  if (addr) parts.push(formatVal(addr));
  if (city) parts.push(formatVal(city));
  if (state) parts.push(formatVal(state));
  if (zip) parts.push(formatVal(zip));
  if (country) parts.push(formatVal(country));
  return parts.length ? parts.join(', ') : null;
}

export function SamDataSection({ samData }: SamDataSectionProps) {
  if (!samData || Object.keys(samData).length === 0) return null;

  const type = samData.type ?? samData.baseType;
  const setAside = samData.setAside ?? samData.typeOfSetAsideDescription;
  const naics = samData.naicsCode;
  const classification = samData.classificationCode;
  const posted = samData.postedDate;
  const deadline = samData.responseDeadLine ?? samData.reponseDeadLine;
  const contacts = (samData.pointOfContact ?? samData.pointofcontact) as Record<string, unknown>[] | undefined;
  const pop = (samData.placeOfPerformance ?? samData.placeOfPerformance) as Record<string, unknown> | null;
  const office = (samData.officeAddress ?? samData.office_address) as Record<string, unknown> | null;
  const desc = samData.description as string | undefined;
  const links = (samData.resourceLinks ?? samData.resource_links) as string[] | undefined;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6 mb-8">
      <h2 className="text-lg font-medium text-slate-200 mb-4">SAM.gov details</h2>
      <div className="grid grid-cols-2 gap-4 text-sm">
        {type ? (
          <div>
            <span className="text-slate-500">Type</span>
            <p className="text-slate-200">{formatVal(type)}</p>
          </div>
        ) : null}
        {setAside ? (
          <div>
            <span className="text-slate-500">Set-aside</span>
            <p className="text-slate-200">{formatVal(setAside)}</p>
          </div>
        ) : null}
        {naics ? (
          <div>
            <span className="text-slate-500">NAICS</span>
            <p className="text-slate-200">{formatVal(naics)}</p>
          </div>
        ) : null}
        {classification ? (
          <div>
            <span className="text-slate-500">Classification</span>
            <p className="text-slate-200">{formatVal(classification)}</p>
          </div>
        ) : null}
        {posted ? (
          <div>
            <span className="text-slate-500">Posted</span>
            <p className="text-slate-200">{formatVal(posted).slice(0, 10)}</p>
          </div>
        ) : null}
        {deadline ? (
          <div>
            <span className="text-slate-500">Response deadline</span>
            <p className="text-slate-200">{formatVal(deadline).slice(0, 10)}</p>
          </div>
        ) : null}
      </div>

      {pop && PopDisplay(pop) ? (
        <div className="mt-4">
          <span className="text-slate-500 text-sm block mb-1">Place of performance</span>
          <p className="text-slate-200 text-sm">{PopDisplay(pop)}</p>
        </div>
      ) : null}

      {office && (office.city || office.state || office.zipcode) ? (
        <div className="mt-4">
          <span className="text-slate-500 text-sm block mb-1">Office</span>
          <p className="text-slate-200 text-sm">
            {[office.city, office.state, office.zipcode].filter(Boolean).map(formatVal).join(', ')}
          </p>
        </div>
      ) : null}

      {contacts && contacts.length > 0 ? (
        <div className="mt-4">
          <span className="text-slate-500 text-sm block mb-2">Point of contact</span>
          <div className="space-y-0">
            {contacts.map((c, i) => (
              <ContactRow key={i} c={c as Record<string, unknown>} />
            ))}
          </div>
        </div>
      ) : null}

      {desc ? (
        <div className="mt-4">
          <a
            href={desc}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 text-sm"
          >
            View description →
          </a>
        </div>
      ) : null}

      {links && links.length > 0 ? (
        <div className="mt-4">
          <span className="text-slate-500 text-sm block mb-2">Attachments</span>
          <ul className="space-y-1">
            {links.map((href, i) => (
              <li key={i}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 text-sm"
                >
                  Attachment {i + 1} →
                </a>
              </li>
            ))}
            </ul>
        </div>
      ) : null}
    </div>
  );
}

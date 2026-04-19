import type { Metadata } from 'next';
import CompanyGrid from '@/app/components/CompanyGrid';
import { COMPANIES } from '@/lib/viz-data';

export const metadata: Metadata = { title: 'Company Explorer' };

export default function CompaniesPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div>
        <div
          className="t-muted"
          style={{ fontSize: '10px', fontFamily: 'var(--font-ui)', marginBottom: 'var(--space-xs)' }}
        >
          &gt; companies / {COMPANIES.length} organizations
        </div>
        <h1 className="t-heading" style={{ color: 'var(--brand-accent)' }}>
          Company Explorer
        </h1>
        <p className="t-body" style={{ fontSize: '13px', marginTop: 'var(--space-xs)' }}>
          All organizations by sector and tier — defense contractors, EM-SCA vendors, and commercial space SIGINT.
        </p>
      </div>
      <CompanyGrid companies={COMPANIES} />
    </div>
  );
}

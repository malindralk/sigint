import type { Metadata } from 'next';
import { COMPANIES } from '@/lib/viz-data';
import CompanyGrid from '@/app/components/CompanyGrid';

export const metadata: Metadata = { title: 'Company Explorer' };

export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-xs text-text-muted mb-1">&gt; companies / {COMPANIES.length} organizations</div>
        <h1 className="text-2xl font-bold text-accent-purple">Company Explorer</h1>
        <p className="text-text-secondary text-sm mt-1">
          All organizations by sector and tier — defense contractors, EM-SCA vendors, and commercial space SIGINT.
        </p>
      </div>
      <CompanyGrid companies={COMPANIES} />
    </div>
  );
}

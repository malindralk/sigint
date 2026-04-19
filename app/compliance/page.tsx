// MALINDRA PHASE 4
// app/compliance/page.tsx
// Static compliance page: privacy policy, data retention schedule, consent management.
// Refactored for mobile-consistent layout matching other data section pages.

import type { Metadata } from 'next';
import GDPRConsent from '@/components/GDPRConsent';

export const metadata: Metadata = {
  title: 'Compliance & Privacy · Malindra',
  description:
    'Privacy policy, data retention schedule, GDPR consent management, and compliance documentation for the Malindra intelligence platform.',
};

const RETENTION_SCHEDULE = [
  { dataset: 'Analytics Events', period: '90 days', legal_basis: 'Legitimate Interest', pii: 'None (hashed IP only)' },
  { dataset: 'Lead Capture Records', period: '365 days', legal_basis: 'Consent', pii: 'Name, Email, Organization' },
  { dataset: 'Consent Decisions', period: '3 years', legal_basis: 'Legal Obligation', pii: 'Hashed IP, locale' },
  { dataset: 'Engagement Feedback', period: '180 days', legal_basis: 'Legitimate Interest', pii: 'None' },
  { dataset: 'API Access Logs', period: '90 days', legal_basis: 'Legal Obligation', pii: 'Hashed IP, key ID' },
  {
    dataset: 'Intelligence Exports',
    period: '365 days (custody log)',
    legal_basis: 'Legal Obligation',
    pii: 'Hashed IP, key ID',
  },
];

const RIGHTS = [
  { right: 'Right of Access', description: 'Request a copy of all personal data held about you.' },
  { right: 'Right to Rectification', description: 'Correct inaccurate personal data.' },
  {
    right: 'Right to Erasure',
    description: 'Request deletion of personal data where no legal obligation to retain exists.',
  },
  { right: 'Right to Restriction', description: 'Restrict processing while a complaint is under review.' },
  { right: 'Right to Portability', description: 'Receive personal data in a structured, machine-readable format.' },
  { right: 'Right to Object', description: 'Object to processing on legitimate interest grounds.' },
  {
    right: 'Right to Withdraw Consent',
    description: 'Withdraw analytics consent at any time via the banner or Privacy Settings.',
  },
];

export default function CompliancePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* Page header — consistent with other data pages */}
      <div>
        <div
          className="t-muted"
          style={{ fontSize: '10px', fontFamily: 'var(--font-ui)', marginBottom: 'var(--space-xs)' }}
        >
          &gt; compliance / privacy_policy / gdpr
        </div>
        <h1 className="t-heading" style={{ color: 'var(--info)' }}>
          Privacy Policy & Data Governance
        </h1>
        <p className="t-body" style={{ fontSize: '13px', marginTop: 'var(--space-xs)' }}>
          Effective: 1 January 2025 · Malindra Intelligence Platform
        </p>
      </div>

      {/* Overview */}
      <section>
        <div className="t-eyebrow">/ Overview</div>
        <p className="t-body" style={{ fontSize: '13px', lineHeight: 1.8, marginTop: 'var(--space-sm)' }}>
          Malindra is a sovereign SIGINT intelligence platform operated in Sri Lanka. We process personal data only
          where necessary, under lawful bases defined by GDPR and applicable Sri Lankan data protection law. We do not
          sell personal data.
        </p>
        <div
          className="card"
          style={{
            marginTop: 'var(--space-md)',
            padding: 'var(--space-md)',
            borderLeft: '3px solid var(--info)',
          }}
        >
          <div className="t-body" style={{ fontSize: '12px', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--info)' }}>[INFO]</strong> Analytics on this platform are first-party only. No
            Google Analytics, Meta Pixel, or third-party tracking scripts are loaded. Consent is required before any
            event data is collected.
          </div>
        </div>
      </section>

      {/* Data retention schedule */}
      <section>
        <div className="t-eyebrow">/ Data Retention Schedule</div>

        {/* Desktop table — hidden on mobile */}
        <div className="hidden sm:block" style={{ overflowX: 'auto', marginTop: 'var(--space-sm)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {['Dataset', 'Retention', 'Legal Basis', 'PII Held'].map((h) => (
                  <th
                    key={h}
                    className="text-left t-label"
                    style={{ padding: 'var(--space-sm) var(--space-md)', whiteSpace: 'nowrap' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RETENTION_SCHEDULE.map((row, _i) => (
                <tr
                  key={row.dataset}
                  className="border-b hover:bg-white/[0.02] transition-colors"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <td
                    style={{
                      padding: 'var(--space-sm) var(--space-md)',
                      color: 'var(--text-primary)',
                      fontWeight: 500,
                      fontSize: '13px',
                    }}
                  >
                    {row.dataset}
                  </td>
                  <td
                    className="t-muted"
                    style={{
                      padding: 'var(--space-sm) var(--space-md)',
                      fontFamily: 'var(--font-ui)',
                      fontSize: '12px',
                      color: 'var(--info)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.period}
                  </td>
                  <td className="t-muted" style={{ padding: 'var(--space-sm) var(--space-md)', fontSize: '12px' }}>
                    {row.legal_basis}
                  </td>
                  <td className="t-muted" style={{ padding: 'var(--space-sm) var(--space-md)', fontSize: '12px' }}>
                    {row.pii}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards — shown only on mobile */}
        <div className="sm:hidden space-y-2" style={{ marginTop: 'var(--space-sm)' }}>
          {RETENTION_SCHEDULE.map((row) => (
            <div key={row.dataset} className="card" style={{ padding: 'var(--space-sm) var(--space-md)' }}>
              <div
                className="t-body"
                style={{
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  marginBottom: 'var(--space-xs)',
                }}
              >
                {row.dataset}
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <div className="t-muted" style={{ fontSize: '10px', fontFamily: 'var(--font-ui)' }}>
                    Retention
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--info)', fontFamily: 'var(--font-ui)' }}>
                    {row.period}
                  </div>
                </div>
                <div>
                  <div className="t-muted" style={{ fontSize: '10px', fontFamily: 'var(--font-ui)' }}>
                    Legal Basis
                  </div>
                  <div className="t-muted" style={{ fontSize: '12px' }}>
                    {row.legal_basis}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 'var(--space-xs)' }}>
                <div className="t-muted" style={{ fontSize: '10px', fontFamily: 'var(--font-ui)' }}>
                  PII Held
                </div>
                <div className="t-muted" style={{ fontSize: '12px' }}>
                  {row.pii}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Your rights */}
      <section>
        <div className="t-eyebrow">/ Your Rights</div>
        <div className="space-y-2" style={{ marginTop: 'var(--space-sm)' }}>
          {RIGHTS.map((r) => (
            <div key={r.right} className="flex gap-3 items-start">
              <span
                className="shrink-0"
                style={{
                  width: '8px',
                  height: '8px',
                  background: 'var(--brand-accent)',
                  borderRadius: '50%',
                  marginTop: '6px',
                }}
              />
              <div>
                <span className="t-body" style={{ fontSize: '13px', fontWeight: 600 }}>
                  {r.right}:{' '}
                </span>
                <span className="t-muted" style={{ fontSize: '13px' }}>
                  {r.description}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="t-muted" style={{ fontSize: '13px', lineHeight: 1.7, marginTop: 'var(--space-md)' }}>
          To exercise any of these rights, contact:{' '}
          <span style={{ color: 'var(--brand-accent)', fontFamily: 'var(--font-ui)' }}>privacy@malindra.lk</span>
        </p>
      </section>

      {/* Export controls */}
      <section>
        <div className="t-eyebrow">/ Export Controls</div>
        <div
          className="card"
          style={{
            marginTop: 'var(--space-sm)',
            padding: 'var(--space-md)',
            borderLeft: '3px solid var(--danger)',
          }}
        >
          <div className="t-body" style={{ fontSize: '12px', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--danger)' }}>[RESTRICTED]</strong> Intelligence data exports via the
            Enterprise API are blocked for requests originating from jurisdictions subject to international sanctions
            (DPRK, Iran, Cuba, Syria). This is a legal obligation under applicable export control frameworks. All export
            attempts are logged for chain of custody purposes.
          </div>
        </div>
      </section>

      {/* Consent management */}
      <section>
        <div className="t-eyebrow">/ Consent Management</div>
        <p className="t-body" style={{ fontSize: '13px', lineHeight: 1.7, marginTop: 'var(--space-sm)' }}>
          You can update your analytics consent preferences at any time. Your current decision is stored in your
          browser&apos;s localStorage under the key{' '}
          <code
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '12px',
              color: 'var(--brand-accent)',
              background: 'rgba(212,150,40,0.10)',
              borderRadius: 'var(--radius-sm)',
              padding: '1px 6px',
            }}
          >
            malindra-consent
          </code>
          . Declining or withdrawing consent immediately stops all analytics collection.
        </p>
        <div style={{ marginTop: 'var(--space-md)' }}>
          <GDPRConsent />
        </div>
      </section>

      {/* Legal disclaimer */}
      <section className="card" style={{ padding: 'var(--space-md)' }}>
        <div className="t-label" style={{ marginBottom: 'var(--space-sm)' }}>
          Legal Disclaimer
        </div>
        <p className="t-muted" style={{ fontSize: '12px', lineHeight: 1.8 }}>
          All intelligence analysis published on Malindra is provided for informational and research purposes only.
          Content labeled <code style={{ fontFamily: 'var(--font-ui)', fontSize: '11px' }}>[MODEL v1.0]</code> or{' '}
          <code style={{ fontFamily: 'var(--font-ui)', fontSize: '11px' }}>[ANALYSIS]</code> represents pre-computed
          algorithmic synthesis and does not constitute financial, investment, legal, or policy advice. Scenario
          confidence scores are statistical estimates, not guarantees of outcome. Malindra Intelligence Platform accepts
          no liability for decisions made on the basis of published analysis.
        </p>
      </section>
    </div>
  );
}

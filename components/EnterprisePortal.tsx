'use client';
// MALINDRA PHASE 4
// components/EnterprisePortal.tsx
// Static UI for enterprise API key management, usage dashboard, export requests.
// All forms POST to FastAPI endpoints.
// Uses brand token CSS variables.

import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const LABELS = {
  en: {
    heading: 'Enterprise Intelligence Access',
    eyebrow: 'Institutional Tier',
    keyHeading: 'Request API Access',
    name: 'Contact Name',
    email: 'Email Address',
    organization: 'Organization',
    role: 'Role',
    tier: 'Access Tier',
    submit: 'Request API Key',
    submitting: 'Requesting…',
    keySuccess: 'API key generated. Store it securely — it will not be shown again.',
    keyError: 'Key generation failed. Please try again.',
    usageHeading: 'Usage Dashboard',
    apiKeyLabel: 'Your API Key',
    checkUsage: 'Check Usage',
    checking: 'Checking…',
    exportHeading: 'Data Export',
    dataset: 'Dataset',
    format: 'Format',
    exportBtn: 'Download Export',
    exporting: 'Preparing…',
    exportError: 'Export failed. Verify your API key.',
    quota: 'Monthly Quota',
    used: 'Used This Month',
    remaining: 'Remaining',
    lastAccess: 'Last Access',
    total: 'Total Requests',
    roles: ['Analyst', 'Researcher', 'Policy Maker', 'Journalist', 'Investor', 'Institutional'],
    tiers: ['standard', 'premium', 'institutional'],
    datasets: ['predictions', 'articles', 'votes'],
    formats: ['json', 'csv'],
    heritage: 'Malindra · මලින්ද්‍ර',
  },
};

type UsageData = {
  key_id: string;
  organization: string;
  tier: string;
  quota: number;
  used_this_month: number;
  remaining: number;
  last_access: string | null;
  total_requests: number;
};

type KeyData = {
  key: string;
  key_id: string;
  organization: string;
  tier: string;
  quota: number;
  created_at: string;
};

export default function EnterprisePortal({ locale = 'en' }: { locale?: 'en' }) {
  const t = LABELS[locale];

  // Key creation form state
  const [keyForm, setKeyForm] = useState({
    name: '',
    email: '',
    organization: '',
    role: 'Analyst',
    tier: 'standard',
  });
  const [keySubmitting, setKeySubmitting] = useState(false);
  const [keyResult, setKeyResult] = useState<KeyData | null>(null);
  const [keyError, setKeyError] = useState('');

  // Usage check state
  const [usageKey, setUsageKey] = useState('');
  const [usageChecking, setUsageChecking] = useState(false);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [usageError, setUsageError] = useState('');

  // Export state
  const [exportKey, setExportKey] = useState('');
  const [exportDataset, setExportDataset] = useState('predictions');
  const [exportFormat, setExportFormat] = useState('json');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  async function handleKeySubmit(e: React.FormEvent) {
    e.preventDefault();
    setKeySubmitting(true);
    setKeyError('');
    setKeyResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/enterprise/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keyForm),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as KeyData;
      setKeyResult(data);
    } catch {
      setKeyError(t.keyError);
    } finally {
      setKeySubmitting(false);
    }
  }

  async function handleUsageCheck(e: React.FormEvent) {
    e.preventDefault();
    setUsageChecking(true);
    setUsageError('');
    setUsageData(null);
    try {
      const res = await fetch(`${API_BASE}/api/enterprise/usage`, {
        headers: { 'X-API-Key': usageKey },
      });
      if (!res.ok) throw new Error(await res.text());
      setUsageData((await res.json()) as UsageData);
    } catch {
      setUsageError('Failed to retrieve usage. Check your API key.');
    } finally {
      setUsageChecking(false);
    }
  }

  async function handleExport(e: React.FormEvent) {
    e.preventDefault();
    setExporting(true);
    setExportError('');
    try {
      const res = await fetch(
        `${API_BASE}/api/enterprise/export?dataset=${exportDataset}&format=${exportFormat}`,
        { headers: { 'X-API-Key': exportKey } }
      );
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `malindra_${exportDataset}.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError(t.exportError);
    } finally {
      setExporting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '3px',
    padding: '0.5rem 0.75rem',
    color: 'var(--color-ola)',
    fontSize: '0.85rem',
    fontFamily: 'var(--font-ui)',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    color: 'var(--color-stone)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '0.3rem',
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '4px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  };

  return (
    <section
      style={{
        fontFamily: 'var(--font-ui)',
        color: 'var(--color-ola)',
        maxWidth: '680px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <span
          style={{
            fontSize: '0.6rem',
            color: 'var(--color-temple-gold)',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            fontWeight: 600,
            display: 'block',
            marginBottom: '0.4rem',
          }}
        >
          {t.eyebrow}
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--color-ola)',
            margin: 0,
          }}
        >
          {t.heading}
        </h1>
      </div>

      {/* Key creation form */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-ola)', marginTop: 0, marginBottom: '1.25rem' }}>
          {t.keyHeading}
        </h2>

        {keyResult ? (
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-water-fortress, #28805e)', marginBottom: '1rem' }}>
              {t.keySuccess}
            </p>
            <div
              style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-temple-gold)',
                borderRadius: '3px',
                padding: '0.75rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.75rem',
                color: 'var(--color-temple-gold)',
                wordBreak: 'break-all',
                marginBottom: '0.75rem',
              }}
            >
              {keyResult.key}
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--color-stone)', flexWrap: 'wrap' }}>
              <span>ID: {keyResult.key_id}</span>
              <span>Org: {keyResult.organization}</span>
              <span>Tier: <span style={{ color: 'var(--color-temple-gold)' }}>{keyResult.tier}</span></span>
              <span>Quota: {keyResult.quota.toLocaleString()}/month</span>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { void handleKeySubmit(e); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={labelStyle}>{t.name}</label>
                <input
                  style={inputStyle}
                  value={keyForm.name}
                  onChange={(e) => setKeyForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>{t.email}</label>
                <input
                  type="email"
                  style={inputStyle}
                  value={keyForm.email}
                  onChange={(e) => setKeyForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>{t.organization}</label>
                <input
                  style={inputStyle}
                  value={keyForm.organization}
                  onChange={(e) => setKeyForm((f) => ({ ...f, organization: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>{t.role}</label>
                <select
                  style={inputStyle}
                  value={keyForm.role}
                  onChange={(e) => setKeyForm((f) => ({ ...f, role: e.target.value }))}
                >
                  {t.roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>{t.tier}</label>
                <select
                  style={inputStyle}
                  value={keyForm.tier}
                  onChange={(e) => setKeyForm((f) => ({ ...f, tier: e.target.value }))}
                >
                  {t.tiers.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            {keyError && (
              <p style={{ color: 'var(--color-sinha-maroon)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{keyError}</p>
            )}
            <button
              type="submit"
              disabled={keySubmitting}
              style={{
                background: 'var(--color-sinha-maroon)',
                color: 'var(--color-ola)',
                border: 'none',
                borderRadius: '3px',
                padding: '0.6rem 1.25rem',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-ui)',
                cursor: keySubmitting ? 'not-allowed' : 'pointer',
                opacity: keySubmitting ? 0.65 : 1,
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              {keySubmitting ? t.submitting : t.submit}
            </button>
          </form>
        )}
      </div>

      {/* Usage dashboard */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-ola)', marginTop: 0, marginBottom: '1.25rem' }}>
          {t.usageHeading}
        </h2>
        <form onSubmit={(e) => { void handleUsageCheck(e); }} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            style={{ ...inputStyle, flex: '1', minWidth: '200px' }}
            placeholder={t.apiKeyLabel}
            value={usageKey}
            onChange={(e) => setUsageKey(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={usageChecking}
            style={{
              background: 'var(--color-temple-gold)',
              color: 'var(--color-bg)',
              border: 'none',
              borderRadius: '3px',
              padding: '0.5rem 1rem',
              fontSize: '0.8rem',
              cursor: usageChecking ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: usageChecking ? 0.65 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {usageChecking ? t.checking : t.checkUsage}
          </button>
        </form>
        {usageError && <p style={{ color: 'var(--color-sinha-maroon)', fontSize: '0.8rem' }}>{usageError}</p>}
        {usageData && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { label: t.quota, value: usageData.quota.toLocaleString(), accent: 'var(--color-temple-gold)' },
              { label: t.used, value: usageData.used_this_month.toLocaleString(), accent: 'var(--color-zheng-he)' },
              { label: t.remaining, value: usageData.remaining.toLocaleString(), accent: 'var(--color-water-fortress)' },
              { label: t.total, value: usageData.total_requests.toLocaleString(), accent: 'var(--color-parchment)' },
            ].map(({ label, value, accent }) => (
              <div
                key={label}
                style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderTop: `2px solid ${accent}`,
                  borderRadius: '3px',
                  padding: '0.75rem',
                  minWidth: '110px',
                  flex: '1',
                }}
              >
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: accent, fontFamily: 'var(--font-display)' }}>{value}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-stone)', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data export */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-ola)', marginTop: 0, marginBottom: '1.25rem' }}>
          {t.exportHeading}
        </h2>
        <form onSubmit={(e) => { void handleExport(e); }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{t.apiKeyLabel}</label>
              <input
                style={inputStyle}
                value={exportKey}
                onChange={(e) => setExportKey(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>{t.dataset}</label>
              <select style={inputStyle} value={exportDataset} onChange={(e) => setExportDataset(e.target.value)}>
                {t.datasets.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t.format}</label>
              <select style={inputStyle} value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                {t.formats.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
          {exportError && <p style={{ color: 'var(--color-sinha-maroon)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{exportError}</p>}
          <button
            type="submit"
            disabled={exporting}
            style={{
              background: 'transparent',
              color: 'var(--color-temple-gold)',
              border: '1px solid var(--color-temple-gold)',
              borderRadius: '3px',
              padding: '0.6rem 1.25rem',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-ui)',
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.65 : 1,
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            {exporting ? t.exporting : t.exportBtn}
          </button>
        </form>
      </div>

      {/* Heritage footer */}
      <div
        style={{
          textAlign: 'center',
          fontSize: '0.65rem',
          color: 'var(--color-stone)',
          opacity: 0.45,
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.08em',
          marginTop: '1rem',
        }}
      >
        {t.heritage}
      </div>
    </section>
  );
}

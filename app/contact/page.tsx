import Link from 'next/link';

export const metadata = {
  title: 'Contact Us — Malindra',
  description: 'Get in touch with the Malindra intelligence platform team.',
};

export default function ContactPage() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="t-eyebrow">&gt; CONTACT</div>
      <h1 className="t-heading" style={{ marginTop: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
        Contact Us
      </h1>

      <p className="t-muted" style={{ marginBottom: 'var(--space-xl)', fontSize: '13px' }}>
        මලින්ද්‍ර · Sovereign Strategist · Kotte Heritage 1412–1467 CE
      </p>

      <div className="prose" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>

        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>General Enquiries</h2>
          <p className="t-body">
            For questions, feedback, partnership enquiries, or data requests, reach us at:
          </p>
          <p className="t-body" style={{ marginTop: 'var(--space-sm)' }}>
            <a
              href="mailto:info@malindra.lk"
              style={{ color: 'var(--brand-primary)', fontWeight: 500 }}
            >
              info@malindra.lk
            </a>
          </p>
        </section>

        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>Privacy &amp; Data Requests</h2>
          <p className="t-body">
            To request a copy of your personal data, correction of inaccurate information, or deletion of
            your account, email <strong>info@malindra.lk</strong> with the subject line
            &quot;Data Request&quot;. We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>Content Corrections</h2>
          <p className="t-body">
            If you identify factual errors, outdated information, or wish to contribute corrections to
            any published analysis, please email us with the article title and a description of the
            correction needed. All contributions are reviewed for accuracy before publication.
          </p>
        </section>

        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>Response Time</h2>
          <p className="t-body">
            We aim to respond to all enquiries within 5 working days. Data-related requests under
            applicable privacy regulations will be processed within 30 calendar days.
          </p>
        </section>

      </div>

      <div style={{ marginTop: 'var(--space-2xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border-subtle)' }}>
        <Link href="/privacy" style={{ color: 'var(--brand-primary)', fontSize: '13px', marginRight: 'var(--space-lg)' }}>
          Privacy Policy
        </Link>
        <Link href="/terms" style={{ color: 'var(--brand-primary)', fontSize: '13px', marginRight: 'var(--space-lg)' }}>
          Terms of Service
        </Link>
        <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Back to home
        </Link>
      </div>
    </div>
  );
}

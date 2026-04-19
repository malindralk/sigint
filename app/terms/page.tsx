import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Malindra',
  description: 'Terms of service for malindra.com',
};

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="t-eyebrow">&gt; LEGAL</div>
      <h1 className="t-heading" style={{ marginTop: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
        Terms of Service
      </h1>

      <p className="t-muted" style={{ marginBottom: 'var(--space-xl)', fontSize: '13px' }}>
        Last updated: April 2026
      </p>

      <div className="prose" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>
            1. Acceptance
          </h2>
          <p className="t-body">
            By accessing or using <strong>malindra.com</strong> (&quot;the Site&quot;), you agree to these Terms of
            Service. If you do not agree, do not use the Site. We may update these terms at any time; continued use
            after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>
            2. Description of Service
          </h2>
          <p className="t-body">
            Malindra is a public knowledge base and research reference covering signals intelligence (SIGINT),
            electromagnetic side-channel analysis (EM-SCA), hardware security, and related topics. Content is provided
            for educational and research purposes only. Articles reflect publicly available academic and industry
            research.
          </p>
        </section>

        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>
            3. User Accounts
          </h2>
          <p className="t-body" style={{ marginBottom: 'var(--space-sm)' }}>
            You may create an account to access additional features. You are responsible for maintaining the
            confidentiality of your credentials and for all activity under your account. You must provide accurate
            information when registering.
          </p>
          <p className="t-body">
            We reserve the right to suspend or terminate accounts that violate these terms, engage in abuse, or attempt
            to compromise site security.
          </p>
        </section>

        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>
            4. Acceptable Use
          </h2>
          <p className="t-body" style={{ marginBottom: 'var(--space-sm)' }}>
            You agree not to:
          </p>
          <ul
            className="t-body"
            style={{ paddingLeft: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}
          >
            <li>Use the Site for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to any part of the Site or its backend systems</li>
            <li>Scrape, crawl, or harvest content in a manner that disrupts service</li>
            <li>Upload or transmit malicious code, spam, or disruptive content</li>
            <li>Impersonate another user or organization</li>
            <li>Use the Site in ways that violate applicable export control or sanctions laws</li>
          </ul>
        </section>

        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>
            5. Intellectual Property
          </h2>
          <p className="t-body">
            All original content on the Site — including articles, visualizations, and data compilations — is owned by
            Malindra or its contributors. Research paper titles, abstracts, and citations are referenced under fair use
            for educational commentary. You may not reproduce or redistribute original content without permission.
          </p>
        </section>

        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>
            6. Disclaimer of Warranties
          </h2>
          <p className="t-body">
            The Site is provided &quot;as is&quot; without warranties of any kind. We do not warrant that content is
            accurate, complete, or current. Research data and market figures are estimates based on publicly available
            sources and should not be relied upon for operational, financial, or legal decisions.
          </p>
        </section>

        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>
            7. Limitation of Liability
          </h2>
          <p className="t-body">
            To the maximum extent permitted by law, Malindra shall not be liable for any indirect, incidental, or
            consequential damages arising from your use of or inability to use the Site. Our total liability for any
            claim shall not exceed the amount you paid us in the twelve months preceding the claim (which, for a free
            service, is zero).
          </p>
        </section>

        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>
            8. Governing Law
          </h2>
          <p className="t-body">
            These terms are governed by applicable law. Any disputes shall be resolved in the jurisdiction where the
            operator is domiciled.
          </p>
        </section>

        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>
            9. Contact
          </h2>
          <p className="t-body">
            Questions about these terms: <strong>info@malindra.lk</strong>
          </p>
        </section>
      </div>

      <div
        style={{
          marginTop: 'var(--space-2xl)',
          paddingTop: 'var(--space-lg)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <Link
          href="/privacy"
          style={{ color: 'var(--brand-primary)', fontSize: '13px', marginRight: 'var(--space-lg)' }}
        >
          Privacy Policy
        </Link>
        <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Back to home
        </Link>
      </div>
    </div>
  );
}

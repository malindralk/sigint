import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Malindra',
  description: 'Privacy policy for malindra.com',
};

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="t-eyebrow">&gt; LEGAL</div>
      <h1 className="t-heading" style={{ marginTop: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
        Privacy Policy
      </h1>

      <p className="t-muted" style={{ marginBottom: 'var(--space-xl)', fontSize: '13px' }}>
        Last updated: April 2026
      </p>

      <div className="prose" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>
            1. Overview
          </h2>
          <p className="t-body">
            Malindra (<strong>malindra.com</strong>) is a public knowledge base covering signals intelligence (SIGINT),
            electromagnetic side-channel analysis (EM-SCA), and hardware security research. This policy explains what
            data we collect, why, and how it is used. We collect the minimum necessary to operate the site.
          </p>
        </section>

        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>
            2. Information We Collect
          </h2>

          <p className="t-body" style={{ marginBottom: 'var(--space-sm)' }}>
            <strong>Account data (if you register):</strong> email address, username, and a hashed password. If you sign
            in with Google, we receive your name, email address, and Google profile picture URL from Google&apos;s OAuth
            service. We do not store your Google password.
          </p>
          <p className="t-body" style={{ marginBottom: 'var(--space-sm)' }}>
            <strong>Usage data:</strong> pages visited, referrer, browser type, and IP address for security and
            analytics purposes. This data is stored server-side and not sold or shared with third parties.
          </p>
          <p className="t-body">
            <strong>Session data:</strong> an authentication token stored in an HTTPOnly cookie to keep you logged in.
            This cookie is not accessible to JavaScript and is cleared when you sign out.
          </p>
        </section>

        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>
            3. How We Use Your Data
          </h2>
          <ul
            className="t-body"
            style={{ paddingLeft: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}
          >
            <li>To create and manage your account</li>
            <li>To authenticate you on subsequent visits</li>
            <li>To send transactional emails (password reset) if you request them</li>
            <li>To detect and prevent abuse, spam, and security incidents</li>
            <li>To understand aggregate traffic patterns and improve the site</li>
          </ul>
          <p className="t-body" style={{ marginTop: 'var(--space-sm)' }}>
            We do not sell your data. We do not use your data for advertising.
          </p>
        </section>

        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>
            4. Google OAuth
          </h2>
          <p className="t-body" style={{ marginBottom: 'var(--space-sm)' }}>
            When you choose &quot;Continue with Google&quot;, you are redirected to Google&apos;s authentication
            servers. We request only the <code>openid</code>, <code>email</code>, and <code>profile</code> scopes. This
            gives us your name, email address, and profile picture. We do not request access to your Gmail, Google
            Drive, or any other Google service.
          </p>
          <p className="t-body">
            Google&apos;s use of information received from this application is governed by the{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--brand-primary)' }}
            >
              Google Privacy Policy
            </a>
            . For information on how Google handles OAuth data, see{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--brand-primary)' }}
            >
              Google API Services User Data Policy
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>
            5. Data Retention
          </h2>
          <p className="t-body">
            Account data is retained until you delete your account. You can request deletion by emailing the contact
            address below. Session tokens expire after 7 days of inactivity. Server logs are retained for up to 90 days.
          </p>
        </section>

        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>
            6. Cookies
          </h2>
          <p className="t-body">
            We use one first-party HTTPOnly cookie for authentication. We do not use tracking cookies, advertising
            cookies, or third-party analytics cookies. No cookie consent banner is required because we do not set
            non-essential cookies.
          </p>
        </section>

        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>
            7. Third-Party Services
          </h2>
          <p className="t-body">
            The site is hosted on a private server in the EU. We do not use third-party analytics platforms (e.g. Google
            Analytics), advertising networks, or data brokers. The only third-party service involved in account creation
            is Google OAuth, described in Section 4.
          </p>
        </section>

        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>
            8. Your Rights
          </h2>
          <p className="t-body" style={{ marginBottom: 'var(--space-sm)' }}>
            You may at any time:
          </p>
          <ul
            className="t-body"
            style={{ paddingLeft: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}
          >
            <li>Request a copy of the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Revoke Google OAuth access via your Google Account settings</li>
          </ul>
        </section>

        <section>
          <h2 className="t-card-heading" style={{ marginBottom: 'var(--space-sm)' }}>
            9. Contact
          </h2>
          <p className="t-body">
            For privacy requests or questions, contact: <strong>info@malindra.lk</strong>
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

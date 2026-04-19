// MALINDRA PHASE 5
// app/subscribe/page.tsx
// Subscription plans page — static export compatible.
// Displays tier comparison, upgrade CTAs, and Stripe checkout initiation.

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Subscribe — Malindra Intelligence Platform",
  description:
    "Choose your Malindra subscription tier. From free signal summaries to enterprise-grade multilateral data and white-label briefs.",
};

interface PlanFeature {
  label: string;
  free: string | boolean;
  signal: string | boolean;
  sovereign: string | boolean;
  enterprise: string | boolean;
}

const FEATURES: PlanFeature[] = [
  { label: "Signal Summaries", free: true, signal: true, sovereign: true, enterprise: true },
  { label: "Full Signal Depth", free: false, signal: true, sovereign: true, enterprise: true },
  { label: "Scenario Engine", free: false, signal: true, sovereign: true, enterprise: true },
  { label: "Raw Data Export", free: false, signal: true, sovereign: true, enterprise: true },
  { label: "Multilateral Data (IMF, WB, ILO)", free: false, signal: false, sovereign: true, enterprise: true },
  { label: "Monthly API Calls", free: "500", signal: "5,000", sovereign: "50,000", enterprise: "500,000" },
  { label: "White-label Briefs", free: false, signal: false, sovereign: false, enterprise: true },
  { label: "Autonomous Signal Engine", free: false, signal: true, sovereign: true, enterprise: true },
  { label: "A/B Test Variant Access", free: false, signal: false, sovereign: true, enterprise: true },
  { label: "Support", free: "Community", signal: "Email", sovereign: "Priority", enterprise: "Dedicated" },
  { label: "SLA", free: false, signal: false, sovereign: false, enterprise: "99.9%" },
];

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    tagline: "Signal summaries for the curious",
    color: "var(--color-warm-stone)",
    cta: "Start Free",
    ctaHref: "/",
    highlight: false,
  },
  {
    id: "signal",
    name: "Signal",
    price: "$29",
    period: "per month",
    tagline: "Full depth for independent analysts",
    color: "var(--color-zheng-he)",
    cta: "Subscribe",
    ctaHref: "/subscribe/checkout?tier=signal",
    highlight: false,
  },
  {
    id: "sovereign",
    name: "Sovereign",
    price: "$149",
    period: "per month",
    tagline: "Multilateral data for policy professionals",
    color: "var(--color-temple-gold)",
    cta: "Subscribe",
    ctaHref: "/subscribe/checkout?tier=sovereign",
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "annual contract",
    tagline: "White-label platform for institutions",
    color: "var(--color-zheng-he)",
    cta: "Contact Us",
    ctaHref: "/partner",
    highlight: false,
  },
] as const;

type PlanId = "free" | "signal" | "sovereign" | "enterprise";

function FeatureCell({ value }: { value: string | boolean }) {
  if (value === true)
    return (
      <span
        style={{ color: "var(--color-water-fortress)", fontWeight: 700 }}
        aria-label="Included"
      >
        ✓
      </span>
    );
  if (value === false)
    return (
      <span style={{ color: "var(--color-warm-stone)" }} aria-label="Not included">
        –
      </span>
    );
  return (
    <span style={{ fontSize: "0.75rem", color: "var(--theme-text-muted)" }}>{value}</span>
  );
}

export default function SubscribePage() {
  return (
    <main
      id="main-content"
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "3rem 1.5rem",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
      }}
    >
      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-temple-gold)",
            marginBottom: "0.75rem",
          }}
        >
          Intelligence Access
        </p>
        <h1
          style={{
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 800,
            color: "var(--theme-text-primary)",
            marginBottom: "1rem",
            lineHeight: 1.2,
          }}
        >
          Choose Your Signal Tier
        </h1>
        <p
          style={{
            fontSize: "1.0625rem",
            color: "var(--theme-text-muted)",
            maxWidth: "560px",
            margin: "0 auto",
            lineHeight: 1.7,
          }}
        >
          From free signal summaries to enterprise-grade multilateral data.
          Sovereign intelligence, precisely calibrated.
        </p>
      </header>

      {/* Plan cards */}
      <div
        id="compare"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
          marginBottom: "3rem",
        }}
      >
        {PLANS.map((plan) => (
          <article
            key={plan.id}
            aria-labelledby={`plan-${plan.id}-name`}
            style={{
              border: plan.highlight
                ? `2px solid ${plan.color}`
                : "1px solid var(--theme-border)",
              borderRadius: "0.875rem",
              padding: "1.75rem 1.25rem",
              background: plan.highlight
                ? `color-mix(in srgb, ${plan.color} 5%, var(--theme-bg-surface))`
                : "var(--theme-bg-surface)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              position: "relative",
            }}
          >
            {plan.highlight && (
              <div
                style={{
                  position: "absolute",
                  top: "-1px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: plan.color,
                  color: "var(--color-ola-leaf)",
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "0 0 0.5rem 0.5rem",
                }}
                aria-label="Most popular plan"
              >
                Most Popular
              </div>
            )}

            <div>
              <h2
                id={`plan-${plan.id}-name`}
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: plan.color,
                  marginBottom: "0.25rem",
                }}
              >
                {plan.name}
              </h2>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--theme-text-muted)",
                  lineHeight: 1.5,
                }}
              >
                {plan.tagline}
              </p>
            </div>

            <div>
              <span
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "var(--theme-text-primary)",
                }}
              >
                {plan.price}
              </span>
              <span
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--theme-text-muted)",
                  marginLeft: "0.25rem",
                }}
              >
                /{plan.period}
              </span>
            </div>

            <Link
              href={plan.ctaHref}
              style={{
                display: "block",
                textAlign: "center",
                padding: "0.625rem 1rem",
                background: plan.highlight ? plan.color : "transparent",
                color: plan.highlight ? "var(--color-ola-leaf)" : plan.color,
                border: `1.5px solid ${plan.color}`,
                borderRadius: "0.5rem",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none",
                transition: "opacity 0.15s",
              }}
              aria-label={`${plan.cta} — ${plan.name} plan`}
            >
              {plan.cta}
            </Link>
          </article>
        ))}
      </div>

      {/* Feature comparison table */}
      <section aria-labelledby="feature-table-heading">
        <h2
          id="feature-table-heading"
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--theme-text-muted)",
            marginBottom: "1.25rem",
            textAlign: "center",
          }}
        >
          Plan Features
        </h2>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.875rem",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid var(--theme-border)" }}>
                <th
                  scope="col"
                  style={{
                    textAlign: "left",
                    padding: "0.75rem 1rem",
                    color: "var(--theme-text-muted)",
                    fontWeight: 500,
                    width: "35%",
                  }}
                >
                  Feature
                </th>
                {PLANS.map((p) => (
                  <th
                    key={p.id}
                    scope="col"
                    style={{
                      textAlign: "center",
                      padding: "0.75rem 0.5rem",
                      color: p.color,
                      fontWeight: 700,
                    }}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f, i) => (
                <tr
                  key={f.label}
                  style={{
                    borderBottom: "1px solid var(--theme-border)",
                    background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.01)",
                  }}
                >
                  <td
                    style={{
                      padding: "0.625rem 1rem",
                      color: "var(--theme-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    {f.label}
                  </td>
                  {(["free", "signal", "sovereign", "enterprise"] as PlanId[]).map(
                    (pid) => (
                      <td
                        key={pid}
                        style={{ textAlign: "center", padding: "0.625rem 0.5rem" }}
                      >
                        <FeatureCell value={f[pid]} />
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ section */}
      <section
        aria-labelledby="faq-heading"
        style={{ marginTop: "3rem", maxWidth: "640px", margin: "3rem auto 0" }}
      >
        <h2
          id="faq-heading"
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--theme-text-primary)",
            marginBottom: "1.5rem",
          }}
        >
          Frequently Asked Questions
        </h2>

        {[
          {
            q: "Can I cancel anytime?",
            a: "Yes. Monthly subscriptions can be cancelled at any time. You retain access until the end of your billing period.",
          },
          {
            q: "Is my data stored when I subscribe?",
            a: "We store only your email hash and subscription tier — no payment card data (handled by Stripe). No cookies. No tracking beyond consent-based analytics.",
          },
          {
            q: "What is the Sovereign tier's multilateral data?",
            a: "Direct API-sourced data from IMF DataMapper, World Bank, ILO STAT, UN Comtrade, and ASEAN Trade Portal — refreshed daily and included in signal projections.",
          },
          {
            q: "How does Enterprise white-labeling work?",
            a: "Enterprise subscribers can generate custom-branded intelligence briefs via the API, embedding Malindra signal analysis under their own organisation's identity.",
          },
        ].map(({ q, a }) => (
          <details
            key={q}
            style={{
              borderBottom: "1px solid var(--theme-border)",
              padding: "1rem 0",
            }}
          >
            <summary
              style={{
                fontWeight: 600,
                cursor: "pointer",
                color: "var(--theme-text-primary)",
                fontSize: "0.9375rem",
                listStyle: "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {q}
              <span style={{ color: "var(--theme-text-muted)", fontSize: "1.25rem", lineHeight: 1 }}>+</span>
            </summary>
            <p
              style={{
                marginTop: "0.75rem",
                color: "var(--theme-text-secondary)",
                lineHeight: 1.7,
                fontSize: "0.875rem",
              }}
            >
              {a}
            </p>
          </details>
        ))}
      </section>


    </main>
  );
}

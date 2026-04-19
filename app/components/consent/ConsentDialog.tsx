'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useConsent } from '@/app/hooks/useConsent';

export default function ConsentDialog() {
  const { showConsentDialog, acceptConsent, declineConsent, isLoaded } = useConsent();
  const [isVisible, setIsVisible] = useState(false);

  // Delay showing the dialog slightly for better UX
  useEffect(() => {
    if (showConsentDialog) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [showConsentDialog]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isVisible]);

  if (!isLoaded || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(10, 10, 13, 0.85)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          animation: 'fadeIn 200ms ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 101,
          animation: 'slideUp 300ms ease-out',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--color-manuscript)',
            borderTop: '1px solid var(--color-border-default)',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.4)',
            padding: '24px 20px 32px',
            maxWidth: '100%',
          }}
        >
          {/* Handle bar for mobile */}
          <div
            style={{
              width: '40px',
              height: '4px',
              backgroundColor: 'var(--color-spear-iron)',
              borderRadius: '2px',
              margin: '0 auto 20px',
            }}
          />

          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {/* Title */}
            <h2
              id="consent-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--color-ola-leaf)',
                marginBottom: '12px',
                lineHeight: 1.3,
              }}
            >
              Privacy Consent
            </h2>

            {/* Description */}
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '14px',
                lineHeight: 1.6,
                color: 'var(--color-parchment)',
                marginBottom: '20px',
              }}
            >
              We use minimal data collection to improve your experience. 
              By continuing, you agree to our{' '}
              <Link
                href="/privacy"
                style={{
                  color: 'var(--color-temple-gold)',
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                }}
              >
                Privacy Policy
              </Link>
              . You can manage your preferences at any time.
            </p>

            {/* Buttons */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Accept Button */}
              <button
                onClick={acceptConsent}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  backgroundColor: 'var(--color-water-fortress)',
                  color: 'var(--color-white-parasol)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '16px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  minHeight: '52px',
                  touchAction: 'manipulation',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-water-fortress)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-water-fortress)';
                }}
              >
                Accept & Continue
              </button>

              {/* Decline Button */}
              <button
                onClick={declineConsent}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  backgroundColor: 'transparent',
                  color: 'var(--color-warm-stone)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '16px',
                  fontWeight: 500,
                  border: '1px solid var(--color-spear-iron)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  minHeight: '52px',
                  touchAction: 'manipulation',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-warm-stone)';
                  e.currentTarget.style.color = 'var(--color-parchment)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-spear-iron)';
                  e.currentTarget.style.color = 'var(--color-warm-stone)';
                }}
              >
                Decline
              </button>
            </div>

            {/* Footer note */}
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '12px',
                color: 'var(--color-warm-stone)',
                textAlign: 'center',
                marginTop: '16px',
              }}
            >
              Your choice will be remembered for 30 days
            </p>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

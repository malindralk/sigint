"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success) {
      // OAuth login successful, redirect to dashboard
      router.push("/dashboard");
    } else if (error) {
      // OAuth login failed
      console.error("OAuth error:", error);
      router.push(`/login?error=${encodeURIComponent(error)}`);
    } else {
      // No params, redirect to login
      router.push("/login");
    }
  }, [router, searchParams]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "var(--theme-bg-base)",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "3px solid var(--theme-border)",
          borderTop: "3px solid var(--theme-accent)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <p
        style={{
          marginTop: "1rem",
          color: "var(--theme-text-muted)",
        }}
      >
        Completing sign in...
      </p>
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "var(--theme-bg-base)",
          }}
        >
          <div>Loading...</div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}

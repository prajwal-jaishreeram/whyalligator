"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createBrowserClient, hasSupabaseConfig } from "@/lib/supabase";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig()) {
      window.location.href = "/";
      return;
    }

    const next = searchParams.get("next") || "/dashboard";
    const supabase = createBrowserClient();

    // 1. Listen for auth state changes (PKCE code exchange, hash tokens, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || session) {
        window.location.href = next;
      } else if (event === "USER_UPDATED" && session) {
        window.location.href = next;
      }
    });

    // 2. Check if session is already active or immediately established
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setErrorMsg(error.message);
      } else if (data.session) {
        window.location.href = next;
      }
    });

    // 3. Fallback timer if session resolving takes a couple seconds
    const timer = setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session) {
          window.location.href = next;
        } else {
          window.location.href = "/login";
        }
      });
    }, 4000);

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [searchParams]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      {errorMsg ? (
        <div style={{ color: "#dc2626", maxWidth: "400px" }}>
          <p style={{ fontWeight: 600, marginBottom: "8px" }}>Authentication Error</p>
          <p style={{ fontSize: "14px", marginBottom: "16px" }}>{errorMsg}</p>
          <a
            href="/login"
            style={{
              display: "inline-block",
              padding: "8px 16px",
              background: "#111827",
              color: "#ffffff",
              borderRadius: "6px",
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            Back to Log in
          </a>
        </div>
      ) : (
        <div>
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "3px solid #e5e7eb",
              borderTopColor: "#111827",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ fontSize: "16px", fontWeight: 500, color: "var(--ink)" }}>
            Logging you in...
          </p>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>
            Please wait while we complete authentication.
          </p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Loading...
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

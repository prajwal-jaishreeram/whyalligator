"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";

const COOLDOWN_SECONDS = 60;

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "38px",
  boxSizing: "border-box",
  padding: "6px 12px",
  fontSize: "14px",
  borderRadius: "6px",
  border: "1px solid var(--search-border)",
  backgroundColor: "#ffffff",
  color: "var(--ink)",
};

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (cooldown > 0) return;

    setLoading(true);
    try {
      const supabase = createBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) {
        const msg = resetError.message.toLowerCase();
        if (msg.includes("rate limit") || msg.includes("security purposes") || resetError.status === 429) {
          setError("Too many requests. Please wait a minute and try again.");
          setCooldown(COOLDOWN_SECONDS);
          return;
        }
        // Do not reveal whether the account exists; log other errors only.
        console.error("resetPasswordForEmail failed:", resetError.message);
      }
      // Always show the same message so attackers cannot discover which emails are registered.
      setSent(true);
      setCooldown(COOLDOWN_SECONDS);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <section style={{ textAlign: "center", padding: "20px 20px 14px" }}>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-source-serif), "Source Serif 4", serif',
            fontSize: "36px",
            fontWeight: 500,
            fontStyle: "italic",
            letterSpacing: "-0.8px",
            lineHeight: 1.2,
          }}
        >
          Forgot your password?
        </h1>
        <p
          style={{
            margin: "6px auto 0",
            maxWidth: "480px",
            fontSize: "14px",
            fontWeight: 300,
            lineHeight: "20px",
            color: "var(--muted)",
          }}
        >
          Enter your account email and we will send you a link to reset it.
        </p>
      </section>

      <div style={{ maxWidth: "420px", margin: "0 auto", padding: "0 16px 20px" }}>
        <div
          className="form-card"
          style={{
            padding: "18px 22px",
            borderRadius: "8px",
            background: "var(--card)",
            border: "0.8px solid var(--line)",
          }}
        >
          {error ? (
            <p className="form-error" style={{ marginBottom: "10px", fontSize: "13px" }}>
              {error}
            </p>
          ) : null}

          {sent ? (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                padding: "10px 14px",
                borderRadius: "8px",
                color: "#15803d",
                fontSize: "13px",
                lineHeight: "19px",
                marginBottom: "12px",
              }}
            >
              If an account exists for <strong>{email.trim().toLowerCase()}</strong>, a password reset
              link is on its way. Check your inbox and spam folder. The link can only be used once.
            </div>
          ) : null}

          <form className="add-form" onSubmit={handleSubmit} style={{ display: "grid", gap: "10px" }}>
            <label style={{ display: "grid", gap: "3px", fontSize: "13px", fontWeight: 500 }}>
              Email address
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@example.com"
                autoComplete="email"
                className="auth-input-field"
                maxLength={254}
                style={inputStyle}
              />
            </label>

            <button
              type="submit"
              className="hero-cta"
              style={{ width: "100%", height: "40px", marginTop: "4px", fontSize: "15px", borderRadius: "6px" }}
              disabled={loading || cooldown > 0}
            >
              {loading
                ? "Sending..."
                : cooldown > 0
                ? `Resend available in ${cooldown}s`
                : sent
                ? "Resend reset link"
                : "Send reset link"}
            </button>

            <p style={{ margin: "8px 0 0", textAlign: "center", fontSize: "13px", color: "var(--muted)" }}>
              Remembered it?{" "}
              <Link href="/login" style={{ color: "var(--ink)", fontWeight: 500, textDecoration: "underline" }}>
                Back to log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="page-width narrow" style={{ padding: "60px 0", textAlign: "center" }}>
          Loading...
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}

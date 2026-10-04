"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { createBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { checkPassword, PASSWORD_RULES_MESSAGE } from "@/lib/password";

type Stage = "checking" | "ready" | "invalid";

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

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "13px",
        color: met ? "#16a34a" : "var(--muted)",
      }}
    >
      <span style={{ fontSize: "14px" }}>{met ? "✓" : "○"}</span>
      <span>{label}</span>
    </div>
  );
}

/** Reads the recovery info Supabase puts in the URL before the client clears it. */
function readRecoveryUrl(): { isRecovery: boolean; errorDescription: string | null } {
  if (typeof window === "undefined") return { isRecovery: false, errorDescription: null };
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const errorDescription =
    hash.get("error_description") || query.get("error_description") || null;
  const isRecovery = hash.get("type") === "recovery" || query.has("code") || query.get("type") === "recovery";
  return { isRecovery, errorDescription };
}

export default function ResetPasswordPage() {
  // Captured on the very first client render, before any Supabase client can consume the hash.
  const urlInfo = useRef<ReturnType<typeof readRecoveryUrl> | null>(null);
  if (urlInfo.current === null && typeof window !== "undefined") {
    urlInfo.current = readRecoveryUrl();
  }

  const [stage, setStage] = useState<Stage>("checking");
  const [invalidReason, setInvalidReason] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checks = checkPassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  useEffect(() => {
    if (!hasSupabaseConfig()) {
      setStage("invalid");
      return;
    }
    const info = urlInfo.current ?? readRecoveryUrl();
    if (info.errorDescription) {
      setInvalidReason(info.errorDescription.replace(/\+/g, " "));
      setStage("invalid");
      return;
    }

    const supabase = createBrowserClient();
    let settled = false;
    const markReady = () => {
      if (settled) return;
      settled = true;
      setStage("ready");
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) markReady();
    });

    // The client may already have processed the recovery link before we subscribed.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && info.isRecovery) markReady();
    });

    const timer = setTimeout(async () => {
      if (settled) return;
      const { data } = await supabase.auth.getSession();
      if (data.session && info.isRecovery) {
        markReady();
      } else {
        settled = true;
        setStage("invalid");
      }
    }, 5000);

    return () => {
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!checks.strong) {
      setError(PASSWORD_RULES_MESSAGE);
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      // Sign out everywhere so any old or stolen sessions are revoked.
      await supabase.auth.signOut({ scope: "global" });
      window.location.href = "/login?reset=success";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset password.";
      setError(
        msg.toLowerCase().includes("different from the old")
          ? "Your new password must be different from your old password."
          : msg,
      );
      setSaving(false);
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
          Set a new password
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
          Choose a strong password you have not used before.
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
          {stage === "checking" ? (
            <p style={{ margin: 0, textAlign: "center", fontSize: "14px", color: "var(--muted)" }}>
              Verifying your reset link...
            </p>
          ) : null}

          {stage === "invalid" ? (
            <div style={{ textAlign: "center" }}>
              <p className="form-error" style={{ marginBottom: "12px", fontSize: "13px" }}>
                {invalidReason
                  ? `This reset link is not valid: ${invalidReason}.`
                  : "This reset link is invalid or has expired."}{" "}
                Reset links can only be used once.
              </p>
              <Link
                href="/forgot-password"
                className="hero-cta"
                style={{ display: "inline-flex", height: "38px", padding: "0 18px", fontSize: "14px", borderRadius: "6px" }}
              >
                Request a new link
              </Link>
            </div>
          ) : null}

          {stage === "ready" ? (
            <form className="add-form" onSubmit={handleSubmit} style={{ display: "grid", gap: "10px" }}>
              {error ? (
                <p className="form-error" style={{ margin: 0, fontSize: "13px" }}>
                  {error}
                </p>
              ) : null}

              <label style={{ display: "grid", gap: "3px", fontSize: "13px", fontWeight: 500 }}>
                New password
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="auth-input-field"
                  style={inputStyle}
                />
              </label>

              {password.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "2px 8px",
                    background: "#f9fafb",
                    padding: "5px 8px",
                    borderRadius: "5px",
                    border: "1px solid #f3f4f6",
                  }}
                >
                  <Requirement met={checks.hasMinLength} label="8+ characters" />
                  <Requirement met={checks.hasUppercase} label="1 uppercase" />
                  <Requirement met={checks.hasLowercase} label="1 lowercase" />
                  <Requirement met={checks.hasNumber} label="1 number" />
                </div>
              ) : null}

              <label style={{ display: "grid", gap: "3px", fontSize: "13px", fontWeight: 500 }}>
                Confirm new password
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="auth-input-field"
                  style={inputStyle}
                />
                {confirmPassword.length > 0 ? (
                  <span style={{ fontSize: "12px", color: passwordsMatch ? "#16a34a" : "#dc2626", marginTop: "2px" }}>
                    {passwordsMatch ? "✓ Passwords match" : "✕ Passwords do not match"}
                  </span>
                ) : null}
              </label>

              <button
                type="submit"
                className="hero-cta"
                style={{ width: "100%", height: "40px", marginTop: "4px", fontSize: "15px", borderRadius: "6px" }}
                disabled={saving || !checks.strong || !passwordsMatch}
              >
                {saving ? "Saving..." : "Save new password"}
              </button>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)", textAlign: "center" }}>
                For your security, you will be signed out on all devices after this.
              </p>
            </form>
          ) : null}
        </div>
      </div>
    </main>
  );
}

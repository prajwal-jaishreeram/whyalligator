"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";

function PasswordRequirement({
  met,
  label,
}: {
  met: boolean;
  label: string;
}) {
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.4 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.6 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

function AuthForm() {
  const searchParams = useSearchParams();
  const urlMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [mode, setMode] = useState<"login" | "signup">(urlMode);

  useEffect(() => {
    setMode(urlMode);
    setError(null);
    setMessage(null);
  }, [urlMode]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Password strength checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const passwordStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  async function handleGoogleSignIn() {
    setError(null);
    setMessage(null);
    setGoogleLoading(true);

    try {
      const supabase = createBrowserClient();
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(
              redirect || "/dashboard"
            )}`
          : "/dashboard";

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (oauthError) throw oauthError;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect to Google. Please try again."
      );
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Signup-specific validation
    if (mode === "signup") {
      if (!passwordStrong) {
        setError(
          "Password must be at least 8 characters with an uppercase letter, a lowercase letter, and a number."
        );
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      const supabase = createBrowserClient();
      if (mode === "signup") {
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email,
            password,
          });
        if (signUpError) throw signUpError;
        if (signUpData.session) {
          window.location.href = redirect;
          return;
        }
        setMessage(
          "Account created! Please check your inbox to confirm your email, then log in."
        );
      } else {
        const { error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });
        if (signInError) throw signInError;
        window.location.href = redirect;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <section
        style={{
          textAlign: "center",
          padding: "20px 20px 14px",
        }}
      >
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
          {mode === "login"
            ? "Log in to WhyAlligator"
            : "Create your account"}
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
          {mode === "login"
            ? "Sign in to view, edit, and manage your startup listings."
            : "Register with your email to claim and update your startup on WhyAlligator."}
        </p>
      </section>

      <div
        style={{
          maxWidth: "420px",
          margin: "0 auto",
          padding: "0 16px 20px",
        }}
      >
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
          {message ? (
            <p
              style={{
                color: "#16a34a",
                fontSize: "13px",
                fontWeight: 500,
                marginBottom: "10px",
              }}
            >
              {message}
            </p>
          ) : null}

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              height: "38px",
              minHeight: "38px",
              borderRadius: "6px",
              border: "1px solid var(--search-border)",
              backgroundColor: "#ffffff",
              color: "var(--ink)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: loading || googleLoading ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
            }}
          >
            <GoogleIcon />
            <span>
              {googleLoading
                ? "Connecting to Google..."
                : mode === "login"
                ? "Continue with Google"
                : "Sign up with Google"}
            </span>
          </button>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              textAlign: "center",
              margin: "10px 0",
              color: "var(--muted)",
              fontSize: "12px",
            }}
          >
            <div
              style={{
                flex: 1,
                borderBottom: "1px solid var(--line)",
              }}
            />
            <span style={{ padding: "0 10px" }}>or continue with email</span>
            <div
              style={{
                flex: 1,
                borderBottom: "1px solid var(--line)",
              }}
            />
          </div>

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
                style={{
                  display: "block",
                  width: "100%",
                  height: "38px",
                  minHeight: "38px",
                  maxHeight: "38px",
                  boxSizing: "border-box",
                  padding: "6px 12px",
                  fontSize: "14px",
                  lineHeight: "normal",
                  borderRadius: "6px",
                  border: "1px solid var(--search-border)",
                  backgroundColor: "#ffffff",
                  color: "var(--ink)",
                }}
              />
            </label>

            <label style={{ display: "grid", gap: "3px", fontSize: "13px", fontWeight: 500 }}>
              Password
              <input
                type="password"
                required
                minLength={mode === "signup" ? 8 : 6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                className="auth-input-field"
                style={{
                  display: "block",
                  width: "100%",
                  height: "38px",
                  minHeight: "38px",
                  maxHeight: "38px",
                  boxSizing: "border-box",
                  padding: "6px 12px",
                  fontSize: "14px",
                  lineHeight: "normal",
                  borderRadius: "6px",
                  border: "1px solid var(--search-border)",
                  backgroundColor: "#ffffff",
                  color: "var(--ink)",
                }}
              />
            </label>

            {mode === "signup" && password.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "2px 8px",
                  margin: "0 0 2px 0",
                  background: "#f9fafb",
                  padding: "5px 8px",
                  borderRadius: "5px",
                  border: "1px solid #f3f4f6",
                }}
              >
                <PasswordRequirement
                  met={hasMinLength}
                  label="8+ characters"
                />
                <PasswordRequirement
                  met={hasUppercase}
                  label="1 uppercase"
                />
                <PasswordRequirement
                  met={hasLowercase}
                  label="1 lowercase"
                />
                <PasswordRequirement met={hasNumber} label="1 number" />
              </div>
            ) : null}

            {mode === "signup" ? (
              <label style={{ display: "grid", gap: "3px", fontSize: "13px", fontWeight: 500 }}>
                Confirm password
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="auth-input-field"
                  style={{
                    display: "block",
                    width: "100%",
                    height: "38px",
                    minHeight: "38px",
                    maxHeight: "38px",
                    boxSizing: "border-box",
                    padding: "6px 12px",
                    fontSize: "14px",
                    lineHeight: "normal",
                    borderRadius: "6px",
                    border: "1px solid var(--search-border)",
                    backgroundColor: "#ffffff",
                    color: "var(--ink)",
                  }}
                />
                {confirmPassword.length > 0 ? (
                  <span
                    style={{
                      fontSize: "12px",
                      color: passwordsMatch ? "#16a34a" : "#dc2626",
                      marginTop: "2px",
                      display: "block",
                    }}
                  >
                    {passwordsMatch
                      ? "✓ Passwords match"
                      : "✕ Passwords do not match"}
                  </span>
                ) : null}
              </label>
            ) : null}

            <button
              type="submit"
              className="hero-cta"
              style={{
                width: "100%",
                height: "40px",
                marginTop: "4px",
                fontSize: "15px",
                borderRadius: "6px",
              }}
              disabled={
                loading ||
                (mode === "signup" && (!passwordStrong || !passwordsMatch))
              }
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Log in"
                : "Create account"}
            </button>

            <div
              style={{
                textAlign: "center",
                marginTop: "8px",
                fontSize: "13px",
                color: "var(--muted)",
              }}
            >
              {mode === "login" ? (
                <p style={{ margin: 0 }}>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                      setMessage(null);
                      setConfirmPassword("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--ink)",
                      fontWeight: 500,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p style={{ margin: 0 }}>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError(null);
                      setMessage(null);
                      setConfirmPassword("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--ink)",
                      fontWeight: 500,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Log in
                  </button>
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="page-width narrow"
          style={{ padding: "60px 0", textAlign: "center" }}
        >
          Loading...
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}

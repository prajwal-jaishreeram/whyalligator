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
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Password strength checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const passwordStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber;

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
      <section className="hero">
        <h1>
          {mode === "login"
            ? "Log in to WhyAlligator"
            : "Create your account"}
        </h1>
        <p className="hero-copy">
          {mode === "login"
            ? "Sign in to view, edit, and manage your startup listings."
            : "Register with your email to claim and update your startup on WhyAlligator."}
        </p>
      </section>

      <div className="page-width narrow">
        <div className="form-card">
          <form className="add-form" onSubmit={handleSubmit}>
            {error ? <p className="form-error">{error}</p> : null}
            {message ? (
              <p
                style={{
                  color: "#16a34a",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                {message}
              </p>
            ) : null}

            <label>
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
                  height: "44px",
                  minHeight: "44px",
                  maxHeight: "44px",
                  boxSizing: "border-box",
                  padding: "10px 14px",
                  fontSize: "15px",
                  lineHeight: "normal",
                  borderRadius: "6px",
                  border: "1px solid var(--search-border)",
                  backgroundColor: "#ffffff",
                  color: "var(--ink)",
                }}
              />
            </label>

            <label>
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
                  height: "44px",
                  minHeight: "44px",
                  maxHeight: "44px",
                  boxSizing: "border-box",
                  padding: "10px 14px",
                  fontSize: "15px",
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
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  marginTop: "-4px",
                  marginBottom: "8px",
                }}
              >
                <PasswordRequirement
                  met={hasMinLength}
                  label="At least 8 characters"
                />
                <PasswordRequirement
                  met={hasUppercase}
                  label="One uppercase letter"
                />
                <PasswordRequirement
                  met={hasLowercase}
                  label="One lowercase letter"
                />
                <PasswordRequirement met={hasNumber} label="One number" />
              </div>
            ) : null}

            {mode === "signup" ? (
              <label>
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
                    height: "44px",
                    minHeight: "44px",
                    maxHeight: "44px",
                    boxSizing: "border-box",
                    padding: "10px 14px",
                    fontSize: "15px",
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
                      fontSize: "13px",
                      color: passwordsMatch ? "#16a34a" : "#dc2626",
                      marginTop: "4px",
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
              style={{ width: "100%", marginTop: "8px" }}
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
                marginTop: "16px",
                fontSize: "14px",
                color: "var(--muted)",
              }}
            >
              {mode === "login" ? (
                <p>
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
                <p>
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

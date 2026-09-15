"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";

function AuthForm() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const supabase = createBrowserClient();
      if (mode === "signup") {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        if (signUpData.session) {
          window.location.href = "/dashboard";
          return;
        }
        setMessage("Account created! Please check your inbox if email confirmation is required, or click Log In to sign in.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        window.location.href = "/dashboard";
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
        <h1>{mode === "login" ? "Log in to WhyAlligator" : "Create your account"}</h1>
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
              <p style={{ color: "#16a34a", fontSize: "14px", fontWeight: 500 }}>
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
              />
            </label>

            <label>
              Password
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </label>

            <button type="submit" className="hero-cta" style={{ width: "100%", marginTop: "8px" }} disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Log in"
                : "Create account"}
            </button>

            <div style={{ textAlign: "center", marginTop: "16px", fontSize: "14px", color: "var(--muted)" }}>
              {mode === "login" ? (
                <p>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                      setMessage(null);
                    }}
                    style={{ background: "none", border: "none", color: "var(--ink)", fontWeight: 500, cursor: "pointer", textDecoration: "underline" }}
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
                    }}
                    style={{ background: "none", border: "none", color: "var(--ink)", fontWeight: 500, cursor: "pointer", textDecoration: "underline" }}
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
    <Suspense fallback={<div className="page-width narrow" style={{ padding: "60px 0", textAlign: "center" }}>Loading...</div>}>
      <AuthForm />
    </Suspense>
  );
}

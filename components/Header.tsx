"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserClient, hasSupabaseConfig } from "@/lib/supabase";

function Chevron() {
  return (
    <svg className="nav-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M6 8L10 12L14 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    try {
      const supabase = createBrowserClient();
      supabase.auth.getSession().then(({ data }) => {
        setUserEmail(data.session?.user?.email ?? null);
      });

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUserEmail(session?.user?.email ?? null);
      });

      return () => {
        listener.subscription.unsubscribe();
      };
    } catch {
      // ignore in environments without browser auth
    }
  }, []);

  async function handleSignOut() {
    if (!hasSupabaseConfig()) return;
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    setUserEmail(null);
    window.location.href = "/";
  }

  function close() {
    setMenuOpen(false);
  }

  return (
    <header className="site-header">
      <nav className="site-header-inner" aria-label="Primary">
        <div className="nav-left">
          <div className="nav-item">
            <Link href="/about" className="nav-link">
              About <Chevron />
            </Link>
            <div className="dropdown">
              <Link href="/about">What is WhyAlligator?</Link>
              <Link href="/add">Add your startup</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>
          <div className="nav-item">
            <Link href="/" className="nav-link">
              Companies <Chevron />
            </Link>
            <div className="dropdown">
              <Link href="/">Startup Directory</Link>
              <Link href="/jobs">Startup Jobs</Link>
            </div>
          </div>
          <Link href="/library" className="nav-link">
            Library
          </Link>
        </div>

        <Link href="/" className="brand-mark" title="WhyAlligator" onClick={close}>
          <Image src="/logo.png" alt="WhyAlligator" width={40} height={40} priority />
        </Link>

        <div className="nav-right">
          <div className="nav-right-links">
            <Link href="/partners" className="nav-link">
              Partners
            </Link>
            <div className="nav-item">
              <Link href="/resources" className="nav-link">
                Resources <Chevron />
              </Link>
              <div className="dropdown">
                <Link href="/">Startup Directory</Link>
                <Link href="/library">Library</Link>
                <Link href="/jobs">Jobs</Link>
                <Link href="/privacy">Privacy Policy</Link>
                <Link href="/terms">Terms of Use</Link>
              </div>
            </div>
            <Link href="/jobs" className="nav-link">
              Startup Jobs
            </Link>
          </div>
          <div className="header-actions">
            {userEmail ? (
              <>
                <Link href="/dashboard" className="login-link" title={userEmail}>
                  My Startups
                </Link>
                <button
                  type="button"
                  className="login-link"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  onClick={handleSignOut}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="login-link">
                  Log in
                </Link>
                <Link href="/login?mode=signup" className="login-link">
                  Sign up
                </Link>
              </>
            )}
            <Link href="/add" className="apply-btn">
              Add yours
            </Link>
          </div>
        </div>

        <button
          type="button"
          className={`menu-btn${menuOpen ? " is-open" : ""}`}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {menuOpen ? (
        <div className="mobile-menu">
          {userEmail ? (
            <>
              <Link href="/dashboard" onClick={close}>My Startups ({userEmail})</Link>
              <button
                type="button"
                className="nav-link"
                style={{ textAlign: "left", padding: "10px 0", background: "none", border: "none", cursor: "pointer" }}
                onClick={() => {
                  close();
                  handleSignOut();
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={close}>Log in</Link>
              <Link href="/login?mode=signup" onClick={close}>Create account</Link>
            </>
          )}
          <Link href="/about" onClick={close}>About</Link>
          <Link href="/" onClick={close}>Companies</Link>
          <Link href="/library" onClick={close}>Library</Link>
          <Link href="/partners" onClick={close}>Partners</Link>
          <Link href="/resources" onClick={close}>Resources</Link>
          <Link href="/jobs" onClick={close}>Startup Jobs</Link>
          <Link href="/add" onClick={close}>Add your startup ($20)</Link>
          <Link href="/privacy" onClick={close}>Privacy Policy</Link>
          <Link href="/terms" onClick={close}>Terms of Use</Link>
          <Link href="/contact" onClick={close}>Contact</Link>
        </div>
      ) : null}
    </header>
  );
}

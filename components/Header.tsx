"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { createBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import type { UserNotification } from "@/lib/types";

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

function formatNotificationTime(iso: string) {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return new Date(iso).toLocaleDateString();
  } catch {
    return "";
  }
}

function NotificationTypeIcon({ type }: { type: string }) {
  if (type === "top_3") {
    return (
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      </div>
    );
  }
  if (type === "milestone_100") {
    return (
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#ede9fe", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </div>
    );
  }
  if (type === "reply" || type === "new_comment") {
    return (
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
    );
  }
  if (type === "upvote") {
    return (
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#ffedd5", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </div>
    );
  }
  return (
    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#f3f4f6", color: "#4b5563", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    </div>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const refreshNotifications = (token: string) => {
    fetch("/api/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (typeof res.unread_count === "number") {
          setUnreadCount(res.unread_count);
        }
        if (Array.isArray(res.notifications)) {
          setNotifications(res.notifications);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    try {
      const supabase = createBrowserClient();
      supabase.auth.getSession().then(({ data }) => {
        setUserEmail(data.session?.user?.email ?? null);
        const token = data.session?.access_token;
        if (token) {
          refreshNotifications(token);
        }
      });

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUserEmail(session?.user?.email ?? null);
        const token = session?.access_token;
        if (token) {
          refreshNotifications(token);
        } else {
          setUnreadCount(0);
          setNotifications([]);
        }
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

  function navigateToNotificationTarget(targetUrl: string) {
    setNotificationsOpen(false);
    setMenuOpen(false);

    if (typeof window !== "undefined") {
      const isDashboardTab =
        targetUrl === "/dashboard?tab=notifications" || targetUrl.startsWith("/dashboard?tab=");
      const onDashboard = window.location.pathname === "/dashboard";

      if (onDashboard && isDashboardTab) {
        const tabMatch = targetUrl.match(/tab=([a-z0-9_-]+)/i);
        const targetTab = tabMatch ? tabMatch[1] : "notifications";
        window.history.pushState(null, "", targetUrl);
        window.dispatchEvent(new CustomEvent("dashboard-tab-change", { detail: targetTab }));
        return;
      }

      window.location.href = targetUrl;
    }
  }

  async function handleNotificationClick(n: UserNotification) {
    setNotificationsOpen(false);

    if (!n.is_read) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (hasSupabaseConfig()) {
        try {
          const supabase = createBrowserClient();
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          if (token) {
            fetch("/api/notifications", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ notification_id: n.id }),
            }).catch(() => {});
          }
        } catch {}
      }
    }

    const targetUrl = n.link || "/dashboard?tab=notifications";
    navigateToNotificationTarget(targetUrl);
  }

  async function handleMarkAllNotificationsRead(e: React.MouseEvent) {
    e.stopPropagation();
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);

    if (hasSupabaseConfig()) {
      try {
        const supabase = createBrowserClient();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) {
          fetch("/api/notifications", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ mark_all_read: true }),
          }).catch(() => {});
        }
      } catch {}
    }
  }

  const recentNotifications = notifications.slice(0, 4);

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
                <div ref={notifRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen((prev) => !prev)}
                    className="login-link"
                    style={{
                      position: "relative",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "6px 8px",
                      background: notificationsOpen ? "#f3f4f6" : "transparent",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      color: unreadCount > 0 ? "#111827" : "#4b5563",
                      transition: "all 0.15s ease",
                    }}
                    title={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
                    aria-expanded={notificationsOpen}
                    aria-haspopup="true"
                  >
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {unreadCount > 0 ? (
                      <span
                        style={{
                          position: "absolute",
                          top: "2px",
                          right: "2px",
                          background: "#dc2626",
                          color: "#fff",
                          fontSize: "10px",
                          fontWeight: 700,
                          minWidth: "16px",
                          height: "16px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0 3px",
                          boxShadow: "0 0 0 2px #fff",
                          lineHeight: 1,
                        }}
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : null}
                  </button>

                  {/* Notification Popover Dropdown */}
                  {notificationsOpen ? (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: 0,
                        width: "360px",
                        maxWidth: "calc(100vw - 32px)",
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "14px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
                        zIndex: 1000,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                          borderBottom: "1px solid #f3f4f6",
                          background: "#fafafa",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>
                            Notifications
                          </span>
                          {unreadCount > 0 ? (
                            <span
                              style={{
                                background: "#dc2626",
                                color: "#ffffff",
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: "10px",
                              }}
                            >
                              {unreadCount} new
                            </span>
                          ) : null}
                        </div>
                        {unreadCount > 0 ? (
                          <button
                            type="button"
                            onClick={handleMarkAllNotificationsRead}
                            style={{
                              border: "none",
                              background: "transparent",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#2563eb",
                              cursor: "pointer",
                              padding: "2px 4px",
                            }}
                          >
                            Mark all read
                          </button>
                        ) : null}
                      </div>

                      {/* Notification Items List */}
                      <div style={{ maxHeight: "380px", overflowY: "auto" }}>
                        {recentNotifications.length === 0 ? (
                          <div style={{ padding: "32px 16px", textAlign: "center", color: "#6b7280" }}>
                            <div
                              style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "50%",
                                background: "#f3f4f6",
                                color: "#9ca3af",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 10px",
                              }}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                              </svg>
                            </div>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827", marginBottom: "4px" }}>
                              No notifications yet
                            </div>
                            <div style={{ fontSize: "12px", color: "#6b7280" }}>
                              You are all caught up!
                            </div>
                          </div>
                        ) : (
                          recentNotifications.map((n) => (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => handleNotificationClick(n)}
                              style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "12px",
                                padding: "12px 16px",
                                textAlign: "left",
                                border: "none",
                                borderBottom: "1px solid #f3f4f6",
                                background: !n.is_read ? "#f8fafc" : "#ffffff",
                                cursor: "pointer",
                                transition: "background 0.15s ease",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = !n.is_read ? "#f8fafc" : "#ffffff")
                              }
                            >
                              <NotificationTypeIcon type={n.type} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "8px",
                                    marginBottom: "3px",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "13px",
                                      fontWeight: !n.is_read ? 700 : 600,
                                      color: "#111827",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {n.title}
                                  </span>
                                  <span style={{ fontSize: "11px", color: "#9ca3af", flexShrink: 0 }}>
                                    {formatNotificationTime(n.created_at)}
                                  </span>
                                </div>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "12px",
                                    color: "#4b5563",
                                    lineHeight: 1.4,
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                >
                                  {n.message}
                                </p>
                              </div>
                              {!n.is_read ? (
                                <span
                                  style={{
                                    width: "7px",
                                    height: "7px",
                                    borderRadius: "50%",
                                    background: "#2563eb",
                                    flexShrink: 0,
                                    marginTop: "5px",
                                  }}
                                />
                              ) : null}
                            </button>
                          ))
                        )}
                      </div>

                      {/* Footer */}
                      <div
                        style={{
                          padding: "10px 16px",
                          borderTop: "1px solid #f3f4f6",
                          background: "#fafafa",
                          textAlign: "center",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => navigateToNotificationTarget("/dashboard?tab=notifications")}
                          style={{
                            border: "none",
                            background: "transparent",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#111827",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 8px",
                          }}
                        >
                          See all notifications →
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <Link href="/dashboard" className="login-link" title={userEmail}>
                  Profile
                </Link>
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
              {userEmail ? "Add more" : "Add yours"}
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
              <Link href="/dashboard" onClick={close}>Profile</Link>
              <button
                type="button"
                onClick={() => navigateToNotificationTarget("/dashboard?tab=notifications")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "transparent",
                  border: "none",
                  padding: "12px 0",
                  width: "100%",
                  color: "#111827",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  <span>Notifications</span>
                </div>
                {unreadCount > 0 ? (
                  <span
                    style={{
                      background: "#dc2626",
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "10px",
                    }}
                  >
                    {unreadCount}
                  </span>
                ) : null}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={close}>Log in</Link>
              <Link href="/login?mode=signup" onClick={close}>Sign up</Link>
            </>
          )}
          <Link href="/about" onClick={close}>About</Link>
          <Link href="/" onClick={close}>Companies</Link>
          <Link href="/library" onClick={close}>Library</Link>
          <Link href="/partners" onClick={close}>Partners</Link>
          <Link href="/resources" onClick={close}>Resources</Link>
          <Link href="/jobs" onClick={close}>Startup Jobs</Link>
          <Link href="/add" onClick={close}>{userEmail ? "Add more" : "Add your startup"}</Link>
          <Link href="/privacy" onClick={close}>Privacy Policy</Link>
          <Link href="/terms" onClick={close}>Terms of Use</Link>
          <Link href="/contact" onClick={close}>Contact</Link>
        </div>
      ) : null}
    </header>
  );
}

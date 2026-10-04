"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import type { Company, Job, UserNotification } from "@/lib/types";
import { companyPath } from "@/lib/companies";
import { ActivityStatusBadge } from "@/components/ActivityStatusBadge";

type DashboardTab = "startups" | "jobs" | "upvoted" | "notifications" | "settings";

function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return new Date(isoString).toLocaleDateString();
  } catch {
    return "";
  }
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "top_3") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    );
  }
  if (type === "milestone_100") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  }
  if (type === "upvote") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    );
  }
  if (type === "reply" || type === "new_comment") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function computeDisplayName(email: string | null, metaName: string | undefined, companies: Company[]): string {
  if (metaName && metaName.trim()) return metaName.trim();
  // Check if any founder in user's companies has a name
  for (const c of companies) {
    if (Array.isArray(c.founders) && c.founders.length > 0 && c.founders[0].name?.trim()) {
      return c.founders[0].name.trim();
    }
  }
  if (!email) return "Founder";
  const prefix = email.split("@")[0] || "Founder";
  // Remove trailing numbers or special chars e.g. prajwalshinde985 -> prajwalshinde
  const clean = prefix.replace(/[0-9_.-]+$/, "");
  const base = clean.length >= 2 ? clean : prefix;
  // If compound like prajwalshinde, take first part if identifiable or capitalize nicely
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("Founder");
  const [userRole, setUserRole] = useState<"founder" | "user">("founder");
  const [roleSwitching, setRoleSwitching] = useState(false);
  const [roleMsg, setRoleMsg] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [upvotedCompanies, setUpvotedCompanies] = useState<Company[]>([]);
  const [activeTab, setActiveTab] = useState<DashboardTab>("startups");

  // Notifications state
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Settings: Unique Username state
  const [username, setUsername] = useState<string>("");
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameMsg, setUsernameMsg] = useState<string | null>(null);
  const [usernameSaving, setUsernameSaving] = useState(false);

  // Inline quick-edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPitch, setEditPitch] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Company Username / Slug custom URL state per company
  const [slugEditingCompanyId, setSlugEditingCompanyId] = useState<string | null>(null);
  const [slugInput, setSlugInput] = useState<string>("");
  const [slugChecking, setSlugChecking] = useState<boolean>(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugSaving, setSlugSaving] = useState<boolean>(false);
  const [slugSuccessMsg, setSlugSuccessMsg] = useState<string | null>(null);
  const [copiedSlugId, setCopiedSlugId] = useState<string | null>(null);

  // Settings: Profile state
  const [nameInput, setNameInput] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Settings: Email state
  const [emailInput, setEmailInput] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Settings: Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Settings: Partner email inputs per company
  const [partnerInputs, setPartnerInputs] = useState<Record<string, string>>({});
  const [partnerSavingId, setPartnerSavingId] = useState<string | null>(null);
  const [partnerMsg, setPartnerMsg] = useState<string | null>(null);
  const [partnerError, setPartnerError] = useState<string | null>(null);

  function switchTab(tab: DashboardTab) {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState(null, "", url.toString());
    }
  }

  useEffect(() => {
    function handleTabChange(e: Event) {
      const customEvent = e as CustomEvent<DashboardTab>;
      if (customEvent.detail && ["startups", "jobs", "upvoted", "notifications", "settings"].includes(customEvent.detail)) {
        setActiveTab(customEvent.detail);
      }
    }
    function handlePopState() {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as DashboardTab | null;
      if (tabParam && ["startups", "jobs", "upvoted", "notifications", "settings"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
    window.addEventListener("dashboard-tab-change", handleTabChange as EventListener);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("dashboard-tab-change", handleTabChange as EventListener);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    loadData();

    if (hasSupabaseConfig()) {
      const supabase = createBrowserClient();
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          loadData();
        }
      });
      return () => {
        authListener.subscription.unsubscribe();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    if (!hasSupabaseConfig()) {
      setLoading(false);
      return;
    }
    const supabase = createBrowserClient();
    const { data: authData } = await supabase.auth.getSession();
    const session = authData.session;
    const user = session?.user;
    if (!user) {
      // Allow 1.5 seconds for OAuth PKCE token exchange to settle if navigating from OAuth callback
      const timer = setTimeout(async () => {
        const { data: retryAuth } = await supabase.auth.getSession();
        if (!retryAuth.session?.user) {
          window.location.href = "/login";
        } else {
          loadData();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }

    setUserEmail(user.email ?? null);
    const metaName = user.user_metadata?.full_name || user.user_metadata?.name || "";
    if (metaName) setNameInput(metaName);

    // Initial role and username from cached metadata so dashboard renders immediately
    const metaUsername = (user.user_metadata?.username as string) || "";
    if (metaUsername) {
      setUsername(metaUsername);
      setUsernameInput(metaUsername);
    }
    const metaRole = (user.user_metadata?.role as "founder" | "user") || "user";
    setUserRole(metaRole);
    setDisplayName(metaName || user.email?.split("@")[0] || "User");
    setLoading(false); // Render dashboard immediately with zero perceived lag!

    const userEmailClean = (user.email ?? "").trim().toLowerCase();
    const token = session.access_token;

    // Run data queries in parallel in the background
    Promise.allSettled([
      // 1. User's companies
      supabase
        .from("companies")
        .select(
          "id, slug, company_name, pitch, batch, location, logo_url, email, status, user_id, created_at, description, website_url, founded_year, team_size, activity_status, industries, linkedin_url, twitter_url, primary_partner, founders, jobs, hq_region, is_nonprofit, is_top_company, partner_emails, upvotes_count"
        )
        .or(`user_id.eq.${user.id},email.ilike.${user.email},partner_emails.cs.{"${userEmailClean}"}`)
        .order("created_at", { ascending: false }),

      // 2. User profile (username, role)
      supabase
        .from("user_profiles")
        .select("username, role")
        .eq("id", user.id)
        .maybeSingle(),

      // 3. User upvotes
      token
        ? fetch("/api/user/upvotes", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json())
        : Promise.resolve(null),

      // 4. Notifications
      token
        ? fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json())
        : Promise.resolve(null),
    ]).then(([compRes, profRes, upvotesRes, notifRes]) => {
      let compList: Company[] = [];
      if (compRes.status === "fulfilled" && compRes.value.data) {
        compList = compRes.value.data as Company[];
        setCompanies(compList);
      }

      const computed = computeDisplayName(user.email ?? null, metaName, compList);
      setDisplayName(computed);
      if (!metaName && computed) setNameInput(computed);

      let profRole: "founder" | "user" | null = null;
      if (profRes.status === "fulfilled" && profRes.value.data) {
        const p = profRes.value.data;
        if (p.username) {
          setUsername(p.username);
          setUsernameInput(p.username);
        }
        if (p.role) profRole = p.role as "founder" | "user";
      }

      const resolvedRole = profRole || metaRole || (compList.length > 0 ? "founder" : "user");
      setUserRole(resolvedRole);

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get("tab") as DashboardTab | null;
        if (tabParam && ["startups", "jobs", "upvoted", "notifications", "settings"].includes(tabParam)) {
          setActiveTab(tabParam);
        } else {
          setActiveTab(resolvedRole === "user" ? "upvoted" : "startups");
        }
      }

      if (upvotesRes.status === "fulfilled" && upvotesRes.value && Array.isArray(upvotesRes.value.upvoted_companies)) {
        setUpvotedCompanies(upvotesRes.value.upvoted_companies);
      }

      if (notifRes.status === "fulfilled" && notifRes.value && Array.isArray(notifRes.value.notifications)) {
        setNotifications(notifRes.value.notifications);
        setUnreadCount(typeof notifRes.value.unread_count === "number" ? notifRes.value.unread_count : 0);
      }
    });
  }

  function startQuickEdit(company: Company) {
    setEditingId(company.id);
    setEditName(company.company_name);
    setEditPitch(company.pitch);
    setEditSlug(company.slug || company.id);
    setEditError(null);
    setEditSuccess(null);
  }

  function cancelQuickEdit() {
    setEditingId(null);
    setEditName("");
    setEditPitch("");
    setEditSlug("");
    setEditError(null);
  }

  async function saveQuickEdit(company: Company) {
    setEditSaving(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      const supabase = createBrowserClient();
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) throw new Error("Please log in to save changes.");

      const trimmedName = editName.trim();
      const trimmedPitch = editPitch.trim();
      const trimmedSlug = editSlug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      if (trimmedName.length < 2) {
        throw new Error("Company name must be at least 2 characters.");
      }
      if (trimmedPitch.length < 4) {
        throw new Error("Tagline must be at least 4 characters.");
      }
      if (trimmedPitch.length > 90) {
        throw new Error("Tagline must be 90 characters or fewer.");
      }

      const slug = company.slug || company.id;
      const res = await fetch(`/api/companies/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          company_name: trimmedName,
          pitch: trimmedPitch,
          slug: trimmedSlug || slug,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to update.");
      }

      const updatedSlug = resData.slug || trimmedSlug || company.slug || company.id;

      // Update local state
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === company.id
            ? { ...c, company_name: trimmedName, pitch: trimmedPitch, slug: updatedSlug }
            : c
        )
      );
      setEditSuccess(`"${trimmedName}" updated successfully!`);
      setEditingId(null);

      setTimeout(() => setEditSuccess(null), 3500);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Error saving.");
    } finally {
      setEditSaving(false);
    }
  }

  function startEditSlug(company: Company) {
    setSlugEditingCompanyId(company.id);
    setSlugInput(company.slug || company.id);
    setSlugAvailable(null);
    setSlugError(null);
  }

  function cancelEditSlug() {
    setSlugEditingCompanyId(null);
    setSlugInput("");
    setSlugAvailable(null);
    setSlugError(null);
  }

  // Live debounced check for company username availability
  useEffect(() => {
    if (!slugEditingCompanyId) return;
    const currentComp = companies.find((c) => c.id === slugEditingCompanyId);
    const trimmed = slugInput
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!trimmed) {
      setSlugAvailable(null);
      setSlugError(null);
      return;
    }

    if (currentComp && (currentComp.slug || currentComp.id).toLowerCase() === trimmed) {
      setSlugAvailable(true);
      setSlugError(null);
      return;
    }

    if (trimmed.length < 2) {
      setSlugAvailable(false);
      setSlugError("Username must be at least 2 characters");
      return;
    }

    if (trimmed.length > 50) {
      setSlugAvailable(false);
      setSlugError("Username must be 50 characters or less");
      return;
    }

    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(trimmed)) {
      setSlugAvailable(false);
      setSlugError("Use only lowercase letters, numbers, and hyphens");
      return;
    }

    setSlugChecking(true);
    setSlugError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/companies/check-slug?slug=${encodeURIComponent(trimmed)}&currentId=${encodeURIComponent(slugEditingCompanyId)}`
        );
        const data = await res.json();
        if (data.available) {
          setSlugAvailable(true);
          setSlugError(null);
        } else {
          setSlugAvailable(false);
          setSlugError(data.error || "This company username is not available");
        }
      } catch {
        setSlugAvailable(null);
      } finally {
        setSlugChecking(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [slugInput, slugEditingCompanyId, companies]);

  async function handleSaveCompanySlug(company: Company) {
    const cleanSlug = slugInput
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!cleanSlug || cleanSlug.length < 2) {
      setSlugError("Company username must be at least 2 characters");
      return;
    }

    setSlugSaving(true);
    setSlugError(null);

    try {
      const supabase = createBrowserClient();
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) throw new Error("Please log in to save company username.");

      const currentSlug = company.slug || company.id;
      const res = await fetch(`/api/companies/${currentSlug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slug: cleanSlug }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to update company username.");
      }

      const updatedSlug = resData.slug || cleanSlug;
      setCompanies((prev) =>
        prev.map((c) => (c.id === company.id ? { ...c, slug: updatedSlug } : c))
      );

      setSlugEditingCompanyId(null);
      setSlugSuccessMsg(`Company link updated: https://www.whyalligator.com/companies/${updatedSlug}`);
      setTimeout(() => setSlugSuccessMsg(null), 5000);
    } catch (err: unknown) {
      setSlugError(err instanceof Error ? err.message : "Error updating username.");
    } finally {
      setSlugSaving(false);
    }
  }

  function handleCopyCompanyLink(company: Company) {
    const url = `https://www.whyalligator.com/companies/${company.slug || company.id}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedSlugId(company.id);
      setTimeout(() => setCopiedSlugId(null), 2500);
    }
  }

  // Live debounced check for username availability
  useEffect(() => {
    const trimmed = usernameInput.trim().toLowerCase();
    if (!trimmed) {
      setUsernameAvailable(null);
      setUsernameError(null);
      return;
    }
    if (trimmed === username.toLowerCase()) {
      setUsernameAvailable(true);
      setUsernameError(null);
      return;
    }
    if (trimmed.length < 3) {
      setUsernameAvailable(false);
      setUsernameError("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,25}$/.test(trimmed)) {
      setUsernameAvailable(false);
      setUsernameError("Only letters, numbers, and underscores allowed (max 25 chars)");
      return;
    }

    setUsernameChecking(true);
    setUsernameError(null);

    const timer = setTimeout(async () => {
      try {
        const supabase = createBrowserClient();
        const { data: authData } = await supabase.auth.getSession();
        const token = authData.session?.access_token;
        const res = await fetch(`/api/profile/username?check=${encodeURIComponent(trimmed)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.available) {
          setUsernameAvailable(true);
          setUsernameError(null);
        } else {
          setUsernameAvailable(false);
          setUsernameError(data.error || "Username is already taken");
        }
      } catch {
        setUsernameAvailable(null);
      } finally {
        setUsernameChecking(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [usernameInput, username]);

  // Handle saving unique username
  async function handleSaveUsername(e: React.FormEvent) {
    e.preventDefault();
    setUsernameError(null);
    setUsernameMsg(null);
    const trimmed = usernameInput.trim();
    if (!trimmed) {
      setUsernameError("Please enter a username.");
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,25}$/.test(trimmed)) {
      setUsernameError("Username must be 3-25 characters using letters, numbers, or underscores.");
      return;
    }
    setUsernameSaving(true);
    try {
      const supabase = createBrowserClient();
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) throw new Error("Please log in to save your username.");

      const res = await fetch("/api/profile/username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to set username.");
      }

      const savedName = data.username || trimmed;
      setUsername(savedName);
      setUsernameInput(savedName);
      setUsernameAvailable(true);
      setUsernameMsg(`Username successfully reserved as @${savedName}!`);
      setTimeout(() => setUsernameMsg(null), 4000);
    } catch (err: unknown) {
      setUsernameError(err instanceof Error ? err.message : "Failed to update username.");
    } finally {
      setUsernameSaving(false);
    }
  }

  // Handle marking notification as read
  async function handleMarkNotificationRead(id: string, link?: string | null) {
    try {
      const supabase = createBrowserClient();
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (token) {
        fetch("/api/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ notification_id: id }),
        }).catch(() => {});
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (link) {
        window.location.href = link;
      }
    } catch {}
  }

  // Handle marking all notifications as read
  async function handleMarkAllNotificationsRead() {
    try {
      const supabase = createBrowserClient();
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) return;

      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mark_all_read: true }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  }

  // Handle Profile (Name) update
  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileMsg(null);
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setProfileError("Please enter your display name.");
      return;
    }
    setProfileSaving(true);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.updateUser({
        data: { full_name: trimmed, name: trimmed },
      });
      if (error) throw error;
      setDisplayName(trimmed);
      setProfileMsg("Profile name updated successfully!");
      setTimeout(() => setProfileMsg(null), 4000);
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile name.");
    } finally {
      setProfileSaving(false);
    }
  }

  // Handle Email update
  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setEmailMsg(null);
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    if (trimmed === userEmail?.toLowerCase()) {
      setEmailError("New email must be different from current email.");
      return;
    }
    setEmailSaving(true);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.updateUser({ email: trimmed });
      if (error) throw error;
      setEmailMsg("Confirmation email sent! Please check both your current and new inbox to confirm.");
      setEmailInput("");
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : "Failed to update email.");
    } finally {
      setEmailSaving(false);
    }
  }

  // Handle Password update
  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMsg(null);
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMsg("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordMsg(null), 4000);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setPasswordSaving(false);
    }
  }

  // Handle adding partner to a startup
  async function handleAddPartner(company: Company) {
    const inputVal = (partnerInputs[company.id] || "").trim().toLowerCase();
    setPartnerError(null);
    setPartnerMsg(null);
    if (!inputVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputVal)) {
      setPartnerError("Please enter a valid email address for the partner.");
      return;
    }
    const currentPartners = Array.isArray(company.partner_emails) ? [...company.partner_emails] : [];
    if (currentPartners.map((e) => e.toLowerCase()).includes(inputVal)) {
      setPartnerError("This partner email is already added.");
      return;
    }

    setPartnerSavingId(company.id);
    try {
      const supabase = createBrowserClient();
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) throw new Error("Please log in to manage partners.");

      const updatedPartners = [...currentPartners, inputVal];
      const slug = company.slug || company.id;

      const res = await fetch(`/api/companies/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ partner_emails: updatedPartners }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to add partner.");

      setCompanies((prev) =>
        prev.map((c) => (c.id === company.id ? { ...c, partner_emails: updatedPartners } : c))
      );
      setPartnerInputs((prev) => ({ ...prev, [company.id]: "" }));
      setPartnerMsg(`Partner ${inputVal} added to ${company.company_name}!`);
      setTimeout(() => setPartnerMsg(null), 4000);
    } catch (err: unknown) {
      setPartnerError(err instanceof Error ? err.message : "Error adding partner.");
    } finally {
      setPartnerSavingId(null);
    }
  }

  // Handle removing partner from a startup
  async function handleRemovePartner(company: Company, emailToRemove: string) {
    setPartnerError(null);
    setPartnerMsg(null);
    setPartnerSavingId(company.id);

    try {
      const supabase = createBrowserClient();
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) throw new Error("Please log in to manage partners.");

      const currentPartners = Array.isArray(company.partner_emails) ? company.partner_emails : [];
      const updatedPartners = currentPartners.filter(
        (e) => e.toLowerCase() !== emailToRemove.toLowerCase()
      );
      const slug = company.slug || company.id;

      const res = await fetch(`/api/companies/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ partner_emails: updatedPartners }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to remove partner.");

      setCompanies((prev) =>
        prev.map((c) => (c.id === company.id ? { ...c, partner_emails: updatedPartners } : c))
      );
      setPartnerMsg(`Partner ${emailToRemove} removed from ${company.company_name}.`);
      setTimeout(() => setPartnerMsg(null), 4000);
    } catch (err: unknown) {
      setPartnerError(err instanceof Error ? err.message : "Error removing partner.");
    } finally {
      setPartnerSavingId(null);
    }
  }

  // Collect all jobs across user's companies
  const allJobs: (Job & {
    company_name: string;
    company_slug: string;
    company_logo: string | null;
  })[] = companies.flatMap((company) =>
    (company.jobs ?? []).map((job) => ({
      ...job,
      company_name: company.company_name,
      company_slug: company.slug || company.id,
      company_logo: company.logo_url,
    }))
  );

  async function handleSwitchRole(targetRole: "founder" | "user") {
    setRoleSwitching(true);
    setRoleMsg(null);
    try {
      // 1. Instant optimistic UI update
      setUserRole(targetRole);
      switchTab(targetRole === "user" ? "upvoted" : "startups");
      setRoleMsg(`Switched to ${targetRole === "founder" ? "Founder" : "Community Member"} profile!`);

      const supabase = createBrowserClient();
      const { data: authData } = await supabase.auth.getSession();
      const user = authData.session?.user;
      const token = authData.session?.access_token;

      if (!user) throw new Error("Please log in to switch role.");

      // 2. Direct client-side persistence in Supabase
      await Promise.allSettled([
        supabase.auth.updateUser({ data: { role: targetRole } }),
        supabase.from("user_profiles").upsert({
          id: user.id,
          email: user.email,
          role: targetRole,
          updated_at: new Date().toISOString(),
        }),
      ]);

      // 3. Resilient server API call with 4-second timeout
      if (token) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        fetch("/api/profile/role", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: targetRole }),
          signal: controller.signal,
        })
          .catch(() => {})
          .finally(() => clearTimeout(timeoutId));
      }

      setTimeout(() => setRoleMsg(null), 4000);
    } catch (err: unknown) {
      console.error("Error switching role:", err);
      alert(err instanceof Error ? err.message : "Error switching profile role.");
    } finally {
      setRoleSwitching(false);
    }
  }

  async function handleSignOut() {
    if (!hasSupabaseConfig()) return;
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main
        className="page-width"
        style={{ padding: "80px 16px", textAlign: "center" }}
      >
        <p>Loading your dashboard...</p>
      </main>
    );
  }

  return (
    <main>
      <section className="hero">
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span className="pill pill-batch" style={{ fontSize: "13px", padding: "4px 12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            {userRole === "founder" ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                  <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                  <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                </svg>
                <span>Founder Account</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Community Member</span>
              </>
            )}
          </span>
        </div>
        <h1>{userRole === "founder" ? "Founder Dashboard" : "Community Dashboard"}</h1>
        <p className="hero-copy" style={{ marginBottom: "16px" }}>
          {userRole === "founder"
            ? "Manage and edit your listed startups, jobs, and partner access. "
            : "Explore curated startups, cast upvotes, and participate in comments & community feedback. "}
          Logged in as <strong style={{ color: "#111827", fontWeight: 600 }}>{displayName}</strong>
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          {userRole === "founder" ? (
            <Link
              href="/add"
              className="hero-cta"
              style={{
                margin: 0,
                height: "36px",
                padding: "0 18px",
                fontSize: "13px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>+ List Startup</span>
            </Link>
          ) : null}
          <button
            type="button"
            className="ghost-btn"
            style={{ fontSize: "13px", padding: "6px 14px", height: "auto", cursor: "pointer" }}
            onClick={() => handleSwitchRole(userRole === "founder" ? "user" : "founder")}
            disabled={roleSwitching}
          >
            {roleSwitching ? "Switching..." : `Switch to ${userRole === "founder" ? "Community Member" : "Founder"} Profile`}
          </button>
        </div>
      </section>

      <div className="page-width">
        {/* Community Member Promotion Banner */}
        {userRole === "user" && (
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "18px 20px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <div style={{ maxWidth: "580px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "18px" }}>🚀</span>
                <strong style={{ fontSize: "15px", color: "#0f172a" }}>
                  Building a startup?
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: "13.5px", color: "#475569", lineHeight: 1.5 }}>
                Switch to a Founder Profile to list your startup, publish open job postings, claim your custom company handle, and get discovered by thousands of tech users.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <Link
                href="/add"
                className="hero-cta"
                style={{
                  margin: 0,
                  height: "36px",
                  padding: "0 16px",
                  fontSize: "13px",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                + List a Startup
              </Link>
              <button
                type="button"
                onClick={() => handleSwitchRole("founder")}
                disabled={roleSwitching}
                className="ghost-btn"
                style={{
                  height: "36px",
                  fontSize: "13px",
                  padding: "0 14px",
                  cursor: "pointer",
                  background: "#ffffff",
                }}
              >
                {roleSwitching ? "Switching..." : "Switch to Founder"}
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Tabs & Actions */}
        {/* Mobile View: Quick Tab Dropdown for Ultra-Fast One-Tap Navigation */}
        <div className="mobile-dashboard-tab-dropdown-wrap" style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--muted)",
              marginBottom: "6px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Dashboard View
          </label>
          <div style={{ position: "relative" }}>
            <select
              value={activeTab}
              onChange={(e) => switchTab(e.target.value as DashboardTab)}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "15px",
                fontWeight: 600,
                borderRadius: "10px",
                border: "1.5px solid #111827",
                background: "#ffffff",
                color: "#111827",
                appearance: "none",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              {userRole === "founder" && (
                <>
                  <option value="startups">Your Startups ({companies.length})</option>
                  <option value="jobs">Job Listings ({allJobs.length})</option>
                </>
              )}
              <option value="upvoted">Upvoted Startups ({upvotedCompanies.length})</option>
              <option value="notifications">
                Notifications {unreadCount > 0 ? `(${unreadCount} new)` : `(${notifications.length})`}
              </option>
              <option value="settings">Profile & Settings</option>
            </select>
            <span
              style={{
                position: "absolute",
                right: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                fontSize: "12px",
                color: "#4b5563",
              }}
            >
              ▼
            </span>
          </div>
        </div>

        {/* Dashboard Tabs: Generous Gap & Touch-Friendly Pill Bar */}
        <div
          className="dashboard-tabs-bar"
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            overflowX: "auto",
            paddingBottom: "12px",
            marginBottom: "24px",
            borderBottom: "1px solid #e5e7eb",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
          }}
        >
          {userRole === "founder" && (
            <>
              <button
                type="button"
                onClick={() => switchTab("startups")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "9999px",
                  fontSize: "14px",
                  fontWeight: activeTab === "startups" ? 600 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  border: activeTab === "startups" ? "1px solid #111827" : "1px solid #e5e7eb",
                  background: activeTab === "startups" ? "#111827" : "#f9fafb",
                  color: activeTab === "startups" ? "#ffffff" : "#4b5563",
                  boxShadow: activeTab === "startups" ? "0 2px 6px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                  <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                  <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                </svg>
                <span>Your Startups</span>
                {companies.length > 0 ? (
                  <span
                    style={{
                      background: activeTab === "startups" ? "rgba(255,255,255,0.22)" : "#e5e7eb",
                      color: activeTab === "startups" ? "#ffffff" : "#374151",
                      padding: "1px 8px",
                      borderRadius: "99px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {companies.length}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => switchTab("jobs")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "9999px",
                  fontSize: "14px",
                  fontWeight: activeTab === "jobs" ? 600 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  border: activeTab === "jobs" ? "1px solid #111827" : "1px solid #e5e7eb",
                  background: activeTab === "jobs" ? "#111827" : "#f9fafb",
                  color: activeTab === "jobs" ? "#ffffff" : "#4b5563",
                  boxShadow: activeTab === "jobs" ? "0 2px 6px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                <span>Job Listings</span>
                {allJobs.length > 0 ? (
                  <span
                    style={{
                      background: activeTab === "jobs" ? "rgba(255,255,255,0.22)" : "#e5e7eb",
                      color: activeTab === "jobs" ? "#ffffff" : "#374151",
                      padding: "1px 8px",
                      borderRadius: "99px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {allJobs.length}
                  </span>
                ) : null}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => switchTab("upvoted")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "9999px",
              fontSize: "14px",
              fontWeight: activeTab === "upvoted" ? 600 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              border: activeTab === "upvoted" ? "1px solid #111827" : "1px solid #e5e7eb",
              background: activeTab === "upvoted" ? "#111827" : "#f9fafb",
              color: activeTab === "upvoted" ? "#ffffff" : "#4b5563",
              boxShadow: activeTab === "upvoted" ? "0 2px 6px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
            <span>Upvoted Startups</span>
            {upvotedCompanies.length > 0 ? (
              <span
                style={{
                  background: activeTab === "upvoted" ? "rgba(255,255,255,0.22)" : "#e5e7eb",
                  color: activeTab === "upvoted" ? "#ffffff" : "#374151",
                  padding: "1px 8px",
                  borderRadius: "99px",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {upvotedCompanies.length}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => switchTab("notifications")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "9999px",
              fontSize: "14px",
              fontWeight: activeTab === "notifications" ? 600 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              border: activeTab === "notifications" ? "1px solid #111827" : "1px solid #e5e7eb",
              background: activeTab === "notifications" ? "#111827" : "#f9fafb",
              color: activeTab === "notifications" ? "#ffffff" : "#4b5563",
              boxShadow: activeTab === "notifications" ? "0 2px 6px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span>Notifications</span>
            {unreadCount > 0 ? (
              <span
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "1px 7px",
                  borderRadius: "10px",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : notifications.length > 0 ? (
              <span
                style={{
                  background: activeTab === "notifications" ? "rgba(255,255,255,0.22)" : "#e5e7eb",
                  color: activeTab === "notifications" ? "#ffffff" : "#374151",
                  padding: "1px 8px",
                  borderRadius: "99px",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {notifications.length}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => switchTab("settings")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "9999px",
              fontSize: "14px",
              fontWeight: activeTab === "settings" ? 600 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              border: activeTab === "settings" ? "1px solid #111827" : "1px solid #e5e7eb",
              background: activeTab === "settings" ? "#111827" : "#f9fafb",
              color: activeTab === "settings" ? "#ffffff" : "#4b5563",
              boxShadow: activeTab === "settings" ? "0 2px 6px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>Profile & Settings</span>
          </button>
        </div>

        {roleMsg ? (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "16px",
              color: "#15803d",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            ✓ {roleMsg}
          </div>
        ) : null}

        {editSuccess ? (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "16px",
              color: "#15803d",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            ✓ {editSuccess}
          </div>
        ) : null}

        {slugSuccessMsg ? (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "16px",
              color: "#15803d",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            ✓ {slugSuccessMsg}
          </div>
        ) : null}

        {/* STARTUPS TAB */}
        {activeTab === "startups" ? (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ margin: 0 }}>Your Listed Startups ({companies.length})</h2>
              <Link href="/add" className="apply-btn">
                + List another startup
              </Link>
            </div>

            {companies.length === 0 ? (
              <div
                className="form-card"
                style={{ textAlign: "center", padding: "48px 20px" }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "#f3f4f6",
                    color: "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                  </svg>
                </div>
                <h3 style={{ margin: "0 0 8px" }}>No Listed Startups Yet</h3>
                <p
                  style={{
                    fontSize: "15px",
                    color: "var(--muted)",
                    marginBottom: "20px",
                    maxWidth: "500px",
                    margin: "0 auto 20px",
                    lineHeight: 1.6,
                  }}
                >
                  {userRole === "founder"
                    ? "You don't have any startups listed yet. List your startup to collect verified upvotes, recruit talent, and reach the Top 10 rankings!"
                    : "You are currently logged in as a Community Member. Want to list your startup and get discovered by founders and investors?"}
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                  <Link href="/add" className="hero-cta" style={{ height: "40px", padding: "0 22px", display: "inline-flex", alignItems: "center" }}>
                    + List your startup
                  </Link>
                  {userRole !== "founder" ? (
                    <button
                      type="button"
                      onClick={() => handleSwitchRole("founder")}
                      className="ghost-btn"
                      style={{ height: "40px", padding: "0 18px", cursor: "pointer" }}
                    >
                      Switch to Founder Profile
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="results-box">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className="company-row"
                    style={{
                      flexDirection: "column",
                      alignItems: "stretch",
                      gap: "14px",
                    }}
                  >
                    {editingId === company.id ? (
                      /* Mobile-friendly full width Quick Edit form */
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          saveQuickEdit(company);
                        }}
                        style={{
                          background: "#fafafa",
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            </svg>
                            <strong style={{ fontSize: "15px", color: "#111827" }}>
                              Quick Edit: {company.company_name}
                            </strong>
                          </div>
                          <button
                            type="button"
                            onClick={cancelQuickEdit}
                            style={{
                              background: "none",
                              border: "none",
                              fontSize: "18px",
                              cursor: "pointer",
                              color: "#6b7280",
                              padding: "4px 8px",
                            }}
                            aria-label="Close quick edit"
                          >
                            ✕
                          </button>
                        </div>

                        {editError ? (
                          <div
                            style={{
                              color: "#dc2626",
                              fontSize: "13px",
                              background: "#fef2f2",
                              padding: "8px 12px",
                              borderRadius: "6px",
                            }}
                          >
                            {editError}
                          </div>
                        ) : null}

                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "13px",
                              fontWeight: 500,
                              marginBottom: "4px",
                              color: "#374151",
                            }}
                          >
                            Company Name
                          </label>
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Company name"
                            maxLength={80}
                            required
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: "10px 12px",
                              fontSize: "15px",
                              border: "1px solid #d1d5db",
                              borderRadius: "8px",
                              background: "#fff",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "13px",
                              fontWeight: 500,
                              marginBottom: "4px",
                              color: "#374151",
                            }}
                          >
                            Tagline (One-line pitch)
                          </label>
                          <input
                            value={editPitch}
                            onChange={(e) => setEditPitch(e.target.value)}
                            placeholder="e.g. AI-powered analytics that transforms user feedback"
                            maxLength={90}
                            required
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: "10px 12px",
                              fontSize: "15px",
                              border: "1px solid #d1d5db",
                              borderRadius: "8px",
                              background: "#fff",
                            }}
                          />
                          <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                            {editPitch.length}/90 characters (1 line on desktop, max 3 lines on mobile)
                          </div>
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "13px",
                              fontWeight: 500,
                              marginBottom: "4px",
                              color: "#374151",
                            }}
                          >
                            Company URL / Username
                          </label>
                          <input
                            value={editSlug}
                            onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                            placeholder="username"
                            maxLength={50}
                            required
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: "10px 12px",
                              fontSize: "14px",
                              fontFamily: "monospace",
                              border: "1px solid #d1d5db",
                              borderRadius: "8px",
                              background: "#fff",
                            }}
                          />
                          <span style={{ fontSize: "12px", color: "#6b7280", marginTop: "3px", display: "block" }}>
                            https://www.whyalligator.com/companies/{editSlug || "username"}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                            marginTop: "4px",
                          }}
                        >
                          <button
                            type="submit"
                            className="hero-cta"
                            style={{
                              height: "40px",
                              fontSize: "14px",
                              padding: "0 20px",
                              margin: 0,
                              flex: 1,
                              minWidth: "120px",
                            }}
                            disabled={editSaving}
                          >
                            {editSaving ? "Saving..." : "Save Changes"}
                          </button>
                          <button
                            type="button"
                            className="ghost-btn"
                            style={{
                              height: "40px",
                              fontSize: "14px",
                              padding: "0 16px",
                              flex: 1,
                              minWidth: "100px",
                            }}
                            onClick={cancelQuickEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Normal company card header */
                      <div className="dash-card-header">
                        <div className="dash-card-info">
                          <div
                            className="company-logo-wrap"
                            style={{
                              width: "48px",
                              flexBasis: "48px",
                              flexShrink: 0,
                              padding: 0,
                            }}
                          >
                            {company.logo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={company.logo_url}
                                alt=""
                                className="company-logo"
                                style={{ width: "48px", height: "48px", borderRadius: "10px", objectFit: "cover" }}
                              />
                            ) : (
                              <div
                                className="company-logo fallback"
                                style={{
                                  width: "48px",
                                  height: "48px",
                                  fontSize: "18px",
                                  borderRadius: "10px",
                                }}
                              >
                                {company.company_name.slice(0, 1).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h3
                              style={{
                                fontSize: "18px",
                                margin: "0 0 4px",
                                fontWeight: 600,
                                wordBreak: "break-word",
                              }}
                            >
                              {company.company_name}
                            </h3>
                            <p
                              className="dash-startup-tagline"
                              title={(company.pitch || "").replace(/[\r\n\t]+/g, " ").trim()}
                            >
                              {(company.pitch || "").replace(/[\r\n\t]+/g, " ").trim()}
                            </p>
                          </div>
                        </div>

                        <div className="dash-card-actions">
                          <button
                            type="button"
                            className="ghost-btn"
                            style={{ height: "36px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                            onClick={() => startQuickEdit(company)}
                            title="Quick edit name, pitch, and URL"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            </svg>
                            <span>Quick Edit</span>
                          </button>
                          <Link
                            href={companyPath(company)}
                            className="ghost-btn"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ height: "36px", fontSize: "13px" }}
                          >
                            View ↗
                          </Link>
                          <Link
                            href={`/companies/${company.slug || company.id}/edit`}
                            className="hero-cta"
                            style={{
                              height: "36px",
                              fontSize: "13px",
                              padding: "0 16px",
                              marginTop: 0,
                            }}
                          >
                            Full Edit
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Custom Company URL / Handle Section */}
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "#64748b",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            Company URL:
                          </span>
                          <a
                            href={`/companies/${company.slug || company.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: "13px",
                              fontWeight: 500,
                              color: "#0284c7",
                              textDecoration: "underline",
                              wordBreak: "break-all",
                            }}
                            title="Open company page"
                          >
                            https://www.whyalligator.com/companies/{company.slug || company.id}
                          </a>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => handleCopyCompanyLink(company)}
                            className="ghost-btn"
                            style={{ height: "30px", fontSize: "12px", padding: "0 10px", cursor: "pointer", background: "#ffffff" }}
                          >
                            {copiedSlugId === company.id ? "✓ Copied!" : "Copy Link"}
                          </button>
                          {slugEditingCompanyId !== company.id ? (
                            <button
                              type="button"
                              onClick={() => startEditSlug(company)}
                              className="ghost-btn"
                              style={{ height: "30px", fontSize: "12px", padding: "0 10px", cursor: "pointer", background: "#ffffff" }}
                            >
                              Change Username
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {/* Inline Slug Editor */}
                      {slugEditingCompanyId === company.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSaveCompanySlug(company);
                          }}
                          style={{
                            marginTop: "4px",
                            paddingTop: "10px",
                            borderTop: "1px dashed #cbd5e1",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "12.5px", color: "#64748b", fontFamily: "monospace" }}>
                              whyalligator.com/companies/
                            </span>
                            <input
                              type="text"
                              value={slugInput}
                              onChange={(e) => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                              placeholder="username"
                              maxLength={50}
                              required
                              style={{
                                padding: "6px 10px",
                                fontSize: "13px",
                                border: slugAvailable === false ? "1.5px solid #dc2626" : slugAvailable === true ? "1.5px solid #16a34a" : "1px solid #cbd5e1",
                                borderRadius: "6px",
                                minWidth: "160px",
                                outline: "none",
                              }}
                            />
                            <button
                              type="submit"
                              disabled={slugSaving || slugAvailable === false || slugChecking}
                              className="hero-cta"
                              style={{ height: "32px", fontSize: "12px", padding: "0 12px", margin: 0 }}
                            >
                              {slugSaving ? "Saving..." : "Save URL"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditSlug}
                              className="ghost-btn"
                              style={{ height: "32px", fontSize: "12px", padding: "0 10px" }}
                            >
                              Cancel
                            </button>
                          </div>

                          <div style={{ fontSize: "12px", minHeight: "16px" }}>
                            {slugChecking ? (
                              <span style={{ color: "#64748b" }}>Checking handle availability...</span>
                            ) : slugAvailable === true ? (
                              <span style={{ color: "#16a34a", fontWeight: 500 }}>✓ Username available!</span>
                            ) : slugError ? (
                              <span style={{ color: "#dc2626", fontWeight: 500 }}>✗ {slugError}</span>
                            ) : null}
                          </div>
                        </form>
                      ) : null}
                    </div>

                    {/* Company meta pills */}
                    <div
                      className="pill-row"
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                      }}
                    >
                      <span className="pill pill-batch">{company.batch}</span>
                      <ActivityStatusBadge status={company.activity_status} />
                      {userEmail && company.email.toLowerCase() !== userEmail.toLowerCase() ? (
                        <span
                          className="pill"
                          style={{ background: "#fef3c7", color: "#b45309", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "5px" }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          <span>Partner Access</span>
                        </span>
                      ) : null}
                      {company.location ? (
                        <span className="pill">{company.location}</span>
                      ) : null}
                      {company.industries.slice(0, 3).map((tag) => (
                        <span className="pill" key={tag}>
                          {tag}
                        </span>
                      ))}
                      {company.jobs.length > 0 ? (
                        <span
                          className="pill"
                          style={{
                            background: "#dcfce7",
                            color: "#15803d",
                          }}
                        >
                          {company.jobs.length} open{" "}
                          {company.jobs.length === 1 ? "role" : "roles"}
                        </span>
                      ) : null}
                      <span
                        className="pill"
                        style={{ background: "#f0f9ff", color: "#0369a1" }}
                      >
                        {company.founders.length}{" "}
                        {company.founders.length === 1 ? "founder" : "founders"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}

        {/* JOBS TAB */}
        {activeTab === "jobs" ? (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ margin: 0 }}>
                Your Job Listings ({allJobs.length})
              </h2>
              {companies.length > 0 ? (
                <Link
                  href={`/companies/${companies[0].slug || companies[0].id}/edit`}
                  className="apply-btn"
                >
                  + Add / Edit Jobs
                </Link>
              ) : null}
            </div>

            {allJobs.length === 0 ? (
              <div
                className="form-card"
                style={{ textAlign: "center", padding: "48px 20px" }}
              >
                <p
                  style={{
                    fontSize: "16px",
                    color: "var(--muted)",
                    marginBottom: "20px",
                    lineHeight: 1.6,
                  }}
                >
                  No job listings yet. You can add open roles when editing your
                  startup listing.
                </p>
                {companies.length > 0 ? (
                  <Link
                    href={`/companies/${companies[0].slug || companies[0].id}/edit`}
                    className="hero-cta"
                  >
                    Add jobs to {companies[0].company_name}
                  </Link>
                ) : (
                  <Link href="/add" className="hero-cta">
                    List your startup first
                  </Link>
                )}
              </div>
            ) : (
              <div className="results-box jobs-board">
                {allJobs.map((job, idx) => (
                  <div
                    className="job-row"
                    key={`${job.company_slug}-${job.title}-${idx}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "12px",
                      padding: "16px 0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        className="company-logo-wrap"
                        style={{
                          width: "36px",
                          height: "36px",
                          flexShrink: 0,
                          padding: 0,
                        }}
                      >
                        {job.company_logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={job.company_logo}
                            alt=""
                            className="company-logo"
                            style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            className="company-logo fallback"
                            style={{
                              width: "36px",
                              height: "36px",
                              fontSize: "14px",
                              borderRadius: "8px",
                            }}
                          >
                            {job.company_name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <strong
                          style={{
                            fontSize: "15px",
                            display: "block",
                            wordBreak: "break-word",
                          }}
                        >
                          {job.title}
                        </strong>
                        <p
                          className="job-meta"
                          style={{
                            margin: "2px 0 0",
                            wordBreak: "break-word",
                          }}
                        >
                          {[
                            job.company_name,
                            job.location,
                            job.salary,
                            job.equity,
                            job.experience,
                          ]
                            .filter(Boolean)
                            .join("  ·  ")}
                        </p>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      {job.apply_url ? (
                        <a
                          className="ghost-btn"
                          href={job.apply_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ height: "32px", fontSize: "13px" }}
                        >
                          Apply Link ↗
                        </a>
                      ) : null}
                      <Link
                        href={`/companies/${job.company_slug}/edit`}
                        className="hero-cta"
                        style={{
                          height: "32px",
                          fontSize: "13px",
                          padding: "0 12px",
                          marginTop: 0,
                        }}
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Per-company breakdown */}
            {companies.length > 1 ? (
              <div style={{ marginTop: "32px" }}>
                <h3
                  style={{
                    fontSize: "16px",
                    marginBottom: "12px",
                    color: "var(--muted)",
                  }}
                >
                  Jobs by Company
                </h3>
                {companies.map((company) => (
                  <div key={company.id} style={{ marginBottom: "16px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <strong style={{ wordBreak: "break-word" }}>
                        {company.company_name}
                      </strong>
                      <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                        {company.jobs.length}{" "}
                        {company.jobs.length === 1 ? "job" : "jobs"}
                      </span>
                    </div>
                    {company.jobs.length === 0 ? (
                      <p
                        style={{
                          fontSize: "14px",
                          color: "var(--muted)",
                          paddingLeft: "8px",
                        }}
                      >
                        No jobs posted.{" "}
                        <Link
                          href={`/companies/${company.slug || company.id}/edit`}
                          style={{ textDecoration: "underline" }}
                        >
                          Add one →
                        </Link>
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </>
        ) : null}

        {/* UPVOTED STARTUPS TAB */}
        {activeTab === "upvoted" ? (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ margin: 0 }}>Startups You&apos;ve Upvoted ({upvotedCompanies.length})</h2>
              <Link href="/" className="ghost-btn" style={{ fontSize: "14px", height: "36px", padding: "0 16px", display: "inline-flex", alignItems: "center" }}>
                Browse All Startups →
              </Link>
            </div>

            {upvotedCompanies.length === 0 ? (
              <div
                className="form-card"
                style={{ textAlign: "center", padding: "48px 20px" }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "#ffedd5",
                    color: "#ea580c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </div>
                <h3 style={{ margin: "0 0 8px" }}>No Upvoted Startups Yet</h3>
                <p
                  style={{
                    fontSize: "15px",
                    color: "var(--muted)",
                    marginBottom: "20px",
                    maxWidth: "480px",
                    margin: "0 auto 20px",
                    lineHeight: 1.5,
                  }}
                >
                  Explore companies in the directory, visit their product websites to verify, and cast your upvote to help them reach the Top 10 rankings!
                </p>
                <Link href="/" className="hero-cta">
                  Explore Companies Now
                </Link>
              </div>
            ) : (
              <div className="results-box">
                {upvotedCompanies.map((company) => (
                  <div key={company.id} className="company-row" style={{ alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                    <div
                      className="company-logo-wrap"
                      style={{ width: "48px", flexBasis: "48px", flexShrink: 0, padding: 0 }}
                    >
                      {company.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={company.logo_url}
                          alt=""
                          className="company-logo"
                          style={{ width: "48px", height: "48px", borderRadius: "10px", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          className="company-logo fallback"
                          style={{ width: "48px", height: "48px", fontSize: "18px", borderRadius: "10px" }}
                        >
                          {company.company_name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                        <Link
                          href={companyPath(company)}
                          style={{ fontWeight: 600, fontSize: "16px", color: "inherit", textDecoration: "none" }}
                        >
                          {company.company_name}
                        </Link>
                        {company.batch ? <span className="pill pill-batch">{company.batch}</span> : null}
                        <ActivityStatusBadge status={company.activity_status} />
                        {company.location ? <span className="pill">{company.location}</span> : null}
                      </div>
                      <p
                        className="dash-startup-tagline"
                        title={(company.pitch || "").replace(/[\r\n\t]+/g, " ").trim()}
                      >
                        {(company.pitch || "").replace(/[\r\n\t]+/g, " ").trim()}
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                      <span className="pill pill-active" style={{ fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                        <span>{company.upvotes_count || 0} upvotes</span>
                      </span>
                      <Link
                        href={companyPath(company)}
                        className="ghost-btn"
                        style={{ height: "34px", padding: "0 12px", fontSize: "13px" }}
                      >
                        View Profile →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* NOTIFICATIONS TAB */}
        {activeTab === "notifications" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: "20px" }}>
                  Your Notifications {notifications.length > 0 ? `(${notifications.length})` : ""}
                </h2>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)" }}>
                  Real-time updates on upvotes, ranking milestones, replies, and community comments.
                </p>
              </div>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={handleMarkAllNotificationsRead}
                  className="ghost-btn"
                  style={{ height: "36px", fontSize: "13px", cursor: "pointer" }}
                >
                  ✓ Mark all as read
                </button>
              ) : null}
            </div>

            {notifications.length === 0 ? (
              <div className="form-card" style={{ textAlign: "center", padding: "48px 20px" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "#f3f4f6",
                    color: "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <h3 style={{ margin: "0 0 8px" }}>No notifications yet</h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--muted)",
                    maxWidth: "460px",
                    margin: "0 auto",
                    lineHeight: 1.6,
                  }}
                >
                  You&apos;ll be notified when users upvote your startup, reply to your comments, or when your startup crosses major milestones and enters the Top 3 rankings!
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {notifications.map((n) => {
                  const isMilestone = n.type === "milestone_100" || n.type === "top_3";
                  return (
                    <div
                      key={n.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "14px",
                        padding: "16px",
                        borderRadius: "12px",
                        background: !n.is_read
                          ? isMilestone
                            ? "#fffbeb"
                            : "#f0fdf4"
                          : "#ffffff",
                        border: !n.is_read
                          ? isMilestone
                            ? "1px solid #fde68a"
                            : "1px solid #bbf7d0"
                          : "1px solid #e5e7eb",
                        boxShadow: !n.is_read ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          background: isMilestone ? "#fef3c7" : "#f3f4f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "20px",
                          flexShrink: 0,
                        }}
                      >
                        <NotificationIcon type={n.type} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <strong style={{ fontSize: "15px", color: "#111827" }}>{n.title}</strong>
                          {!n.is_read ? (
                            <span
                              style={{
                                background: isMilestone ? "#d97706" : "#16a34a",
                                color: "#fff",
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: "6px",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}
                            >
                              New
                            </span>
                          ) : null}
                          <span style={{ fontSize: "12px", color: "var(--muted)", marginLeft: "auto" }}>
                            {formatTimeAgo(n.created_at)}
                          </span>
                        </div>

                        <p style={{ margin: "0 0 10px", fontSize: "14px", color: "#4b5563", lineHeight: 1.5 }}>
                          {n.message}
                        </p>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          {n.link ? (
                            <button
                              type="button"
                              onClick={() => handleMarkNotificationRead(n.id, n.link)}
                              className="hero-cta"
                              style={{ height: "30px", fontSize: "12px", padding: "0 12px", cursor: "pointer" }}
                            >
                              View Details →
                            </button>
                          ) : null}
                          {!n.is_read ? (
                            <button
                              type="button"
                              onClick={() => handleMarkNotificationRead(n.id)}
                              className="ghost-btn"
                              style={{ height: "30px", fontSize: "12px", padding: "0 10px", cursor: "pointer" }}
                            >
                              Mark as read
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {/* ACCOUNT & PARTNER SETTINGS TAB */}
        {activeTab === "settings" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Account Role & Permissions */}
            <div className="form-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <h2 style={{ fontSize: "18px", margin: "0 0 6px" }}>Account Type & Profile Role</h2>
                  <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>
                    Switch between Community Member and Founder permissions at any time.
                  </p>
                </div>
                <span
                  className="pill pill-batch"
                  style={{
                    fontSize: "13px",
                    padding: "6px 14px",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>Current:</span>
                  {userRole === "founder" ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                      </svg>
                      <span>Founder</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>Community Member</span>
                    </>
                  )}
                </span>
              </div>

              <div
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  lineHeight: 1.6,
                  color: "#4b5563",
                }}
              >
                {userRole === "founder" ? (
                  <>
                    <strong>Founder Role:</strong> You can manage and edit your listed startups, add job listings, grant partner permissions, and reply to community comments with the verified <strong>Founder</strong> badge. You can also upvote other community startups.
                  </>
                ) : (
                  <>
                    <strong>Community Member Role:</strong> You can browse the startup directory, cast verified upvotes to boost companies to the Top 10 list, leave comments and questions on company profiles.
                  </>
                )}
              </div>

              <button
                type="button"
                className="hero-cta"
                style={{ height: "38px", fontSize: "14px", padding: "0 20px" }}
                disabled={roleSwitching}
                onClick={() => handleSwitchRole(userRole === "founder" ? "user" : "founder")}
              >
                {roleSwitching
                  ? "Switching role..."
                  : userRole === "founder"
                  ? "Switch to Community Member Profile"
                  : "Switch to Founder Profile"}
              </button>
            </div>

            {/* Unique Username */}
            <div className="form-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "6px" }}>
                <div>
                  <h2 style={{ fontSize: "18px", margin: "0 0 6px" }}>Unique Username</h2>
                  <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>
                    Choose your unique username handle. Once claimed, it is permanently reserved for your account and appears on all comments, replies, and notifications.
                  </p>
                </div>
                {username ? (
                  <span
                    className="pill pill-batch"
                    style={{
                      fontSize: "13px",
                      padding: "6px 14px",
                      fontWeight: 600,
                      background: "#ecfdf5",
                      color: "#059669",
                      border: "1px solid #a7f3d0",
                    }}
                  >
                    @{username}
                  </span>
                ) : null}
              </div>

              {usernameMsg ? (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "8px", color: "#15803d", fontSize: "14px", margin: "14px 0" }}>
                  ✓ {usernameMsg}
                </div>
              ) : null}

              <form onSubmit={handleSaveUsername} style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "480px", marginTop: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px", color: "#374151" }}>
                    Username Handle
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: "12px",
                        color: "#9ca3af",
                        fontWeight: 600,
                        fontSize: "15px",
                        pointerEvents: "none",
                      }}
                    >
                      @
                    </span>
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, ""))}
                      placeholder="yourusername"
                      maxLength={25}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px 10px 28px",
                        fontSize: "14px",
                        border: usernameAvailable === false
                          ? "1px solid #f87171"
                          : usernameAvailable === true && usernameInput.trim().length >= 3
                          ? "1px solid #34d399"
                          : "1px solid #d1d5db",
                        borderRadius: "8px",
                        boxSizing: "border-box",
                        background: "#fff",
                      }}
                    />
                  </div>

                  {/* Real-time Status Notification */}
                  <div style={{ marginTop: "6px", fontSize: "12px", minHeight: "18px" }}>
                    {usernameChecking ? (
                      <span style={{ color: "#6b7280" }}>Checking availability...</span>
                    ) : usernameError ? (
                      <span style={{ color: "#dc2626", fontWeight: 500 }}>
                        ❌ {usernameError}
                      </span>
                    ) : usernameAvailable === true && usernameInput.trim().length >= 3 ? (
                      <span style={{ color: "#059669", fontWeight: 500 }}>
                        ✓ @{usernameInput.trim().toLowerCase()} is available!
                      </span>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>
                        3–25 characters, letters, numbers, and underscores only.
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="hero-cta"
                    style={{ height: "38px", fontSize: "14px", padding: "0 20px" }}
                    disabled={
                      usernameSaving ||
                      usernameChecking ||
                      usernameAvailable === false ||
                      usernameInput.trim().length < 3 ||
                      usernameInput.trim().toLowerCase() === username.toLowerCase()
                    }
                  >
                    {usernameSaving ? "Saving..." : username ? "Update Username" : "Claim Username"}
                  </button>
                </div>
              </form>
            </div>

            {/* Profile / Display Name */}
            <div className="form-card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "18px", margin: "0 0 6px" }}>Profile Information</h2>
              <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 16px" }}>
                Update how your name is displayed across your dashboard and founder profile.
              </p>

              {profileMsg ? (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "8px", color: "#15803d", fontSize: "14px", marginBottom: "14px" }}>
                  ✓ {profileMsg}
                </div>
              ) : null}
              {profileError ? (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "10px 14px", borderRadius: "8px", color: "#dc2626", fontSize: "14px", marginBottom: "14px" }}>
                  {profileError}
                </div>
              ) : null}

              <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "480px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px", color: "#374151" }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. Prajwal Shinde"
                    required
                    style={{ width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "8px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="hero-cta"
                    style={{ height: "38px", fontSize: "14px", padding: "0 18px", marginTop: "4px" }}
                    disabled={profileSaving}
                  >
                    {profileSaving ? "Saving..." : "Save Profile Name"}
                  </button>
                </div>
              </form>
            </div>

            {/* Email Address */}
            <div className="form-card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "18px", margin: "0 0 6px" }}>Account Email</h2>
              <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 16px" }}>
                Current email: <strong style={{ color: "#111827" }}>{userEmail}</strong>
              </p>

              {emailMsg ? (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "8px", color: "#15803d", fontSize: "14px", marginBottom: "14px" }}>
                  ✓ {emailMsg}
                </div>
              ) : null}
              {emailError ? (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "10px 14px", borderRadius: "8px", color: "#dc2626", fontSize: "14px", marginBottom: "14px" }}>
                  {emailError}
                </div>
              ) : null}

              <form onSubmit={handleUpdateEmail} style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "480px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px", color: "#374151" }}>
                    New Email Address
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="newemail@example.com"
                    required
                    style={{ width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "8px", boxSizing: "border-box" }}
                  />
                  <span style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px", display: "block" }}>
                    A confirmation link will be sent to both your current and new email address.
                  </span>
                </div>
                <div>
                  <button
                    type="submit"
                    className="hero-cta"
                    style={{ height: "38px", fontSize: "14px", padding: "0 18px", marginTop: "4px" }}
                    disabled={emailSaving}
                  >
                    {emailSaving ? "Sending..." : "Update Email"}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password */}
            <div className="form-card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "18px", margin: "0 0 6px" }}>Change Password</h2>
              <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 16px" }}>
                Ensure your account stays secure with a strong password.
              </p>

              {passwordMsg ? (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "8px", color: "#15803d", fontSize: "14px", marginBottom: "14px" }}>
                  ✓ {passwordMsg}
                </div>
              ) : null}
              {passwordError ? (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "10px 14px", borderRadius: "8px", color: "#dc2626", fontSize: "14px", marginBottom: "14px" }}>
                  {passwordError}
                </div>
              ) : null}

              <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "480px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px", color: "#374151" }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    minLength={6}
                    required
                    style={{ width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "8px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px", color: "#374151" }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    minLength={6}
                    required
                    style={{ width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "8px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="hero-cta"
                    style={{ height: "38px", fontSize: "14px", padding: "0 18px", marginTop: "4px" }}
                    disabled={passwordSaving}
                  >
                    {passwordSaving ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>

            {/* Co-Founders & Partner Access */}
            <div className="form-card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "18px", margin: "0 0 6px" }}>Co-Founders & Partner Access</h2>
              <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 16px" }}>
                Grant team members or partners access to edit company profiles and post jobs.
                Partners simply log in to WhyAlligator using their email address.
              </p>

              {partnerMsg ? (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "8px", color: "#15803d", fontSize: "14px", marginBottom: "14px" }}>
                  ✓ {partnerMsg}
                </div>
              ) : null}
              {partnerError ? (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "10px 14px", borderRadius: "8px", color: "#dc2626", fontSize: "14px", marginBottom: "14px" }}>
                  {partnerError}
                </div>
              ) : null}

              {companies.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "14px" }}>
                  You have not listed any startups yet. Once listed, you can assign partners here.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {companies.map((company) => {
                    const partners = Array.isArray(company.partner_emails) ? company.partner_emails : [];
                    return (
                      <div
                        key={company.id}
                        style={{
                          background: "#f9fafb",
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "16px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                          {company.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={company.logo_url} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: "#111", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
                              {company.company_name.charAt(0)}
                            </div>
                          )}
                          <strong style={{ fontSize: "15px", color: "#111827" }}>{company.company_name}</strong>
                          <span style={{ fontSize: "12px", color: "var(--muted)" }}>({partners.length} partners)</span>
                        </div>

                        {/* List current partners */}
                        {partners.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                            {partners.map((pEmail) => (
                              <span
                                key={pEmail}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  background: "#ffffff",
                                  border: "1px solid #d1d5db",
                                  borderRadius: "999px",
                                  padding: "4px 10px",
                                  fontSize: "13px",
                                  color: "#374151",
                                }}
                              >
                                {pEmail}
                                <button
                                  type="button"
                                  onClick={() => handleRemovePartner(company, pEmail)}
                                  disabled={partnerSavingId === company.id}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#9ca3af",
                                    fontSize: "13px",
                                    padding: "0 2px",
                                    lineHeight: 1,
                                  }}
                                  title={`Remove ${pEmail}`}
                                  aria-label={`Remove partner ${pEmail}`}
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 10px" }}>
                            No partners added yet for this startup.
                          </p>
                        )}

                        {/* Add partner input */}
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", maxWidth: "480px" }}>
                          <input
                            type="email"
                            value={partnerInputs[company.id] || ""}
                            onChange={(e) =>
                              setPartnerInputs((prev) => ({ ...prev, [company.id]: e.target.value }))
                            }
                            placeholder="partner@example.com"
                            style={{
                              flex: 1,
                              minWidth: "200px",
                              padding: "8px 12px",
                              fontSize: "13px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              background: "#fff",
                            }}
                          />
                          <button
                            type="button"
                            className="hero-cta"
                            onClick={() => handleAddPartner(company)}
                            disabled={partnerSavingId === company.id}
                            style={{
                              height: "36px",
                              fontSize: "13px",
                              padding: "0 14px",
                              marginTop: 0,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {partnerSavingId === company.id ? "Adding..." : "+ Add Partner"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Account Session / Log Out */}
            <div className="form-card" style={{ padding: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "18px", margin: "0 0 6px" }}>Log Out of Account</h2>
                  <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>
                    Securely sign out of your active WhyAlligator session on this device.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="ghost-btn"
                  style={{
                    height: "38px",
                    padding: "0 20px",
                    fontSize: "14px",
                    color: "#dc2626",
                    borderColor: "#fca5a5",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

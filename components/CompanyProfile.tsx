"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Company } from "@/lib/types";
import { createBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { ActivityStatusBadge } from "./ActivityStatusBadge";

function Logo({
  name,
  src,
  className,
}: {
  name: string;
  src: string | null;
  className: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={className} />
    );
  }
  return <div className={`${className} fallback`}>{name.slice(0, 1).toUpperCase()}</div>;
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="#111827"
        d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.59l-5.16-6.74L5.2 22H1.94l8.03-9.17L1.5 2h6.76l4.66 6.18L18.244 2Zm-1.16 18h1.81L7.01 3.91H5.07L17.084 20Z"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="#0a66c2"
        d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.53 1.53 0 0 0 0-3.06 1.53 1.53 0 0 0 0 3.06m1.45 9.74V9.93H5.01v8.57h2.9Z"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="#24292f" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  );
}

function CrunchbaseIcon() {
  return (
    <span style={{ fontWeight: 800, fontSize: "13px", color: "#0288d1", letterSpacing: "-0.5px", fontFamily: "sans-serif", lineHeight: 1 }}>
      cb
    </span>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#E1306C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="#1877F2" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="#FF0000" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="#5865F2" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

function SubstackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="#FF6719" aria-hidden="true">
      <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>
    </svg>
  );
}

function SocialPlatformIcon({ platform }: { platform: string }) {
  switch (platform.toLowerCase()) {
    case "github":
      return <GitHubIcon />;
    case "crunchbase":
      return <CrunchbaseIcon />;
    case "instagram":
      return <InstagramIcon />;
    case "facebook":
      return <FacebookIcon />;
    case "youtube":
      return <YouTubeIcon />;
    case "discord":
      return <DiscordIcon />;
    case "substack":
      return <SubstackIcon />;
    case "twitter":
    case "x":
      return <XIcon />;
    case "linkedin":
      return <LinkedInIcon />;
    default:
      return <LinkIcon />;
  }
}

import UpvoteModal from "@/components/UpvoteModal";
import CommentsSection from "@/components/CommentsSection";

export function CompanyProfile({ company }: { company: Company }) {
  const [tab, setTab] = useState<"company" | "jobs" | "discussion">("company");
  const [canEdit, setCanEdit] = useState(false);
  const [isOwnCompany, setIsOwnCompany] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [upvotesCount, setUpvotesCount] = useState<number>(company.upvotes_count || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  const [upvoteModalOpen, setUpvoteModalOpen] = useState(false);
  const jobs = company.jobs ?? [];

  useEffect(() => {
    const slug = company.slug || company.id;

    if (!hasSupabaseConfig()) {
      // Fetch public upvotes & rank
      fetch(`/api/companies/${slug}/upvote`)
        .then((r) => r.json())
        .then((data) => {
          if (data.upvotes_count !== undefined) setUpvotesCount(data.upvotes_count);
          if (data.rank !== undefined) setRank(data.rank);
        })
        .catch(() => {});
      return;
    }

    try {
      const supabase = createBrowserClient();
      supabase.auth.getSession().then(({ data }) => {
        const user = data.session?.user;
        const token = data.session?.access_token;

        if (user) {
          setIsLoggedIn(true);
          setCurrentUserEmail(user.email ?? null);
          const userEmail = (user.email ?? "").toLowerCase();
          const isPartner =
            Array.isArray(company.partner_emails) &&
            company.partner_emails.map((e) => e.toLowerCase()).includes(userEmail);

          if (
            company.user_id === user.id ||
            (user.email && company.email?.toLowerCase() === userEmail) ||
            isPartner
          ) {
            setCanEdit(true);
          }
        }

        // Fetch upvote status and rank
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        fetch(`/api/companies/${slug}/upvote`, { headers })
          .then((r) => r.json())
          .then((resData) => {
            if (resData.upvotes_count !== undefined) setUpvotesCount(resData.upvotes_count);
            if (resData.has_upvoted !== undefined) setHasUpvoted(resData.has_upvoted);
            if (resData.rank !== undefined) setRank(resData.rank);
            if (resData.is_own_company) setIsOwnCompany(true);
          })
          .catch(() => {});
      });
    } catch {
      // ignore
    }
  }, [company]);

  const isOwner = canEdit || isOwnCompany;

  return (
    <div className="profile-page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "28px",
        }}
      >
        <nav className="crumbs" style={{ margin: 0 }}>
          <Link href="/">Home</Link>
          <span>›</span>
          <Link href="/">Companies</Link>
          <span>›</span>
          <span>{company.company_name}</span>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {isOwner ? (
            <div
              className="company-upvote-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "8px",
                cursor: "default",
                background: "#f9fafb",
                borderColor: "#e5e7eb",
                opacity: 0.95,
              }}
              title="Your startup — Total community upvotes"
            >
              <span className="upvote-chevron" style={{ fontSize: "11px", color: "#f97316" }}>▲</span>
              <span className="upvote-num" style={{ color: "#374151" }}>
                {upvotesCount} {upvotesCount === 1 ? "Upvote" : "Upvotes"}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setUpvoteModalOpen(true)}
              className={`company-upvote-btn ${hasUpvoted ? "is-voted" : ""}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "8px",
                cursor: "pointer",
              }}
              title="Upvote this company"
            >
              <span className="upvote-chevron" style={{ fontSize: "11px" }}>▲</span>
              <span className="upvote-num">
                {hasUpvoted ? "Upvoted" : "Upvote"} {upvotesCount > 0 ? `(${upvotesCount})` : ""}
              </span>
            </button>
          )}

          {canEdit ? (
            <Link
              href={`/companies/${company.slug || company.id}/edit`}
              className="hero-cta"
              style={{ height: "36px", fontSize: "14px", padding: "0 18px", marginTop: 0 }}
            >
              Edit this startup
            </Link>
          ) : null}
        </div>
      </div>

      <div className="profile-grid">
        <div style={{ minWidth: 0 }}>
          <header className="profile-hero">
            <Logo
              name={company.company_name}
              src={company.logo_url}
              className="profile-logo"
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                <h1 style={{ wordBreak: "break-word", margin: 0 }}>{company.company_name}</h1>
                {rank === 1 ? (
                  <span className="pill pill-gold" title="Rank 1 by upvotes" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                      <path d="M4 22h16" />
                      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                    </svg>
                    <span>#1 Top Company</span>
                  </span>
                ) : rank === 2 ? (
                  <span className="pill pill-silver" title="Rank 2 by upvotes" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>#2 Top Company</span>
                  </span>
                ) : rank === 3 ? (
                  <span className="pill pill-bronze" title="Rank 3 by upvotes" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>#3 Top Company</span>
                  </span>
                ) : rank && rank <= 10 ? (
                  <span className="pill pill-top-10" title={`Rank #${rank} by upvotes`} style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="6" />
                      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                    </svg>
                    <span>#{rank} Top Company</span>
                  </span>
                ) : null}
              </div>
              <p className="profile-pitch" style={{ wordBreak: "break-word" }}>
                {company.pitch}
              </p>
              <div className="pill-row">
                <span className="pill pill-batch">{company.batch}</span>
                <ActivityStatusBadge status={company.activity_status} />
                {company.industries.map((tag) => (
                  <span className="pill" key={tag}>
                    {tag}
                  </span>
                ))}
                {company.location ? (
                  <span className="pill">{company.location}</span>
                ) : null}
              </div>
            </div>
          </header>

          <div className="profile-tabs">
            <button
              type="button"
              className={tab === "company" ? "is-on" : ""}
              onClick={() => setTab("company")}
            >
              Company
            </button>
            <button
              type="button"
              className={tab === "jobs" ? "is-on" : ""}
              onClick={() => setTab("jobs")}
            >
              Jobs {jobs.length ? <em>{jobs.length}</em> : null}
            </button>
            <button
              type="button"
              className={tab === "discussion" ? "is-on" : ""}
              onClick={() => setTab("discussion")}
            >
              Comments
            </button>
            <a
              className="profile-site"
              href={company.website_url}
              target="_blank"
              rel="noreferrer"
            >
              <LinkIcon />
              <span>{company.website_url}</span>
            </a>
          </div>

          {tab === "company" ? (
            <section>
              <p className="profile-about" style={{ wordBreak: "break-word" }}>
                {company.description}
              </p>

              {company.founders.length > 0 ? (
                <>
                  <h2>Active Founders</h2>
                  <div className="founder-list">
                    {company.founders.map((founder) => (
                      <article className="founder-card" key={founder.name}>
                        <Logo
                          name={founder.name}
                          src={founder.photo_url}
                          className="founder-photo"
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="founder-name-row" style={{ flexWrap: "wrap" }}>
                            <strong>{founder.name}</strong>
                            {founder.twitter_url ? (
                              <a
                                href={founder.twitter_url}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="X"
                              >
                                <XIcon />
                              </a>
                            ) : null}
                            {founder.linkedin_url ? (
                              <a
                                href={founder.linkedin_url}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="LinkedIn"
                              >
                                <LinkedInIcon />
                              </a>
                            ) : null}
                          </div>
                          <p className="founder-title">{founder.title}</p>
                          {founder.bio ? (
                            <p
                              className="founder-bio"
                              style={{
                                wordBreak: "break-word",
                                overflowWrap: "anywhere",
                              }}
                            >
                              {founder.bio}
                            </p>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              ) : null}

              {jobs.length > 0 ? (
                <div className="jobs-preview">
                  <div className="jobs-heading">
                    <h2>Jobs at {company.company_name}</h2>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => setTab("jobs")}
                    >
                      View all jobs ›
                    </button>
                  </div>
                  {jobs.map((job) => (
                    <JobRow key={job.title} job={job} />
                  ))}
                </div>
              ) : null}

              <div style={{ marginTop: "32px", borderTop: "1px solid var(--border)", paddingTop: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h2>Community Comments</h2>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => setTab("discussion")}
                  >
                    Open all comments ›
                  </button>
                </div>
                <CommentsSection
                  companySlug={company.slug || company.id}
                  companyName={company.company_name}
                  isLoggedIn={isLoggedIn}
                  currentUserEmail={currentUserEmail}
                />
              </div>
            </section>
          ) : tab === "jobs" ? (
            <section>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "28px",
                  alignItems: "start",
                }}
              >
                <div>
                  <div className="jobs-heading">
                    <h2>Jobs at {company.company_name}</h2>
                  </div>
                  {jobs.length === 0 ? (
                    <p className="profile-about">No jobs posted yet.</p>
                  ) : (
                    jobs.map((job) => <JobRow key={job.title} job={job} />)
                  )}
                </div>

                <div>
                  <div className="jobs-heading">
                    <h2>Comments & Q&A</h2>
                  </div>
                  <CommentsSection
                    companySlug={company.slug || company.id}
                    companyName={company.company_name}
                    isLoggedIn={isLoggedIn}
                    currentUserEmail={currentUserEmail}
                  />
                </div>
              </div>
            </section>
          ) : (
            <section>
              <div className="jobs-heading">
                <h2>Comments & Community</h2>
              </div>
              <CommentsSection
                companySlug={company.slug || company.id}
                companyName={company.company_name}
                isLoggedIn={isLoggedIn}
                currentUserEmail={currentUserEmail}
              />
            </section>
          )}
        </div>

        <aside className="profile-side">
          <div className="side-logo-wrap">
            <Logo
              name={company.company_name}
              src={company.logo_url}
              className="side-logo"
            />
          </div>
          <h2 className="side-company-name">
            {company.company_name}
          </h2>
          <dl className="side-meta">
            <div className="side-meta-row">
              <dt>Founded:</dt>
              <dd>{company.founded_year || "-"}</dd>
            </div>
            <div className="side-meta-row">
              <dt>Batch:</dt>
              <dd>{company.batch}</dd>
            </div>
            <div className="side-meta-row">
              <dt>Team Size:</dt>
              <dd>{company.team_size || "-"}</dd>
            </div>
            <div className="side-meta-row">
              <dt>Status:</dt>
              <dd>
                <ActivityStatusBadge status={company.activity_status} />
              </dd>
            </div>
            <div className="side-meta-row">
              <dt>Location:</dt>
              <dd>{company.location || "-"}</dd>
            </div>
          </dl>
          <div className="side-links">
            <a
              href={company.website_url}
              target="_blank"
              rel="noreferrer"
              className="side-link-btn"
              aria-label="Company website"
              title="Website"
            >
              <LinkIcon />
            </a>
            {company.linkedin_url ? (
              <a
                href={company.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="side-link-btn"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <LinkedInIcon />
              </a>
            ) : null}
            {company.twitter_url ? (
              <a
                href={company.twitter_url}
                target="_blank"
                rel="noreferrer"
                className="side-link-btn"
                aria-label="X"
                title="X (Twitter)"
              >
                <XIcon />
              </a>
            ) : null}
            {Array.isArray(company.extra_links)
              ? company.extra_links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="side-link-btn"
                    aria-label={link.label || link.platform}
                    title={link.label || link.platform}
                  >
                    <SocialPlatformIcon platform={link.platform} />
                  </a>
                ))
              : null}
          </div>
        </aside>
      </div>

      <UpvoteModal
        isOpen={upvoteModalOpen}
        onClose={() => setUpvoteModalOpen(false)}
        company={{
          id: company.id,
          slug: company.slug || company.id,
          company_name: company.company_name,
          website_url: company.website_url,
          upvotes_count: upvotesCount,
        }}
        hasUpvoted={hasUpvoted}
        isOwnCompany={canEdit}
        onUpvoteSuccess={(newCount, voted) => {
          setUpvotesCount(newCount);
          setHasUpvoted(voted);
          fetch(`/api/companies/${company.slug || company.id}/upvote`)
            .then((r) => r.json())
            .then((d) => {
              if (d.rank !== undefined) setRank(d.rank);
            })
            .catch(() => {});
        }}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}

function JobRow({
  job,
}: {
  job: Company["jobs"][number];
}) {
  const meta = [job.location, job.salary, job.equity, job.experience].filter(
    Boolean
  );
  return (
    <div className="job-row">
      <div style={{ minWidth: 0, flex: 1 }}>
        <a
          className="job-title"
          href={job.apply_url}
          target="_blank"
          rel="noreferrer"
          style={{ wordBreak: "break-word" }}
        >
          {job.title}
        </a>
        <p className="job-meta">{meta.join("  ·  ")}</p>
      </div>
      <a
        className="job-apply"
        href={job.apply_url}
        target="_blank"
        rel="noreferrer"
      >
        Apply Now ›
      </a>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Company } from "@/lib/types";
import { createBrowserClient, hasSupabaseConfig } from "@/lib/supabase";

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
        fill="currentColor"
        d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.59l-5.16-6.74L5.2 22H1.94l8.03-9.17L1.5 2h6.76l4.66 6.18L18.244 2Zm-1.16 18h1.81L7.01 3.91H5.07L17.084 20Z"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.37V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46C23.21 24 24 23.23 24 22.27V1.73C24 .77 23.21 0 22.23 0Z"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        d="M10 14a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L11 6M14 10a5 5 0 0 0-7.07 0L4.8 12.12a5 5 0 0 0 7.07 7.07L13 18"
      />
    </svg>
  );
}

export function CompanyProfile({ company }: { company: Company }) {
  const [tab, setTab] = useState<"company" | "jobs">("company");
  const [canEdit, setCanEdit] = useState(false);
  const jobs = company.jobs ?? [];

  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    try {
      const supabase = createBrowserClient();
      supabase.auth.getSession().then(({ data }) => {
        const user = data.session?.user;
        if (!user) return;
        if (
          company.user_id === user.id ||
          (user.email && company.email?.toLowerCase() === user.email.toLowerCase())
        ) {
          setCanEdit(true);
        }
      });
    } catch {
      // ignore
    }
  }, [company]);

  return (
    <div className="profile-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <nav className="crumbs" style={{ margin: 0 }}>
          <Link href="/">Home</Link>
          <span>›</span>
          <Link href="/">Companies</Link>
          <span>›</span>
          <span>{company.company_name}</span>
        </nav>
        {canEdit ? (
          <Link
            href={`/companies/${company.slug || company.id}/edit`}
            className="hero-cta"
            style={{ height: "36px", fontSize: "14px", padding: "0 18px" }}
          >
            Edit this startup
          </Link>
        ) : null}
      </div>

      <div className="profile-grid">
        <div>
          <header className="profile-hero">
            <Logo
              name={company.company_name}
              src={company.logo_url}
              className="profile-logo"
            />
            <div>
              <h1>{company.company_name}</h1>
              <p className="profile-pitch">{company.pitch}</p>
              <div className="pill-row">
                <span className="pill pill-batch">{company.batch}</span>
                <span className="pill pill-active">
                  <i /> {company.activity_status}
                </span>
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
            <a
              className="profile-site"
              href={company.website_url}
              target="_blank"
              rel="noreferrer"
            >
              {company.website_url.replace(/^https?:\/\//, "")}
            </a>
          </div>

          {tab === "company" ? (
            <section>
              <p className="profile-about">{company.description}</p>

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
                        <div>
                          <div className="founder-name-row">
                            <strong>{founder.name}</strong>
                            {founder.twitter_url ? (
                              <a href={founder.twitter_url} target="_blank" rel="noreferrer" aria-label="X">
                                <XIcon />
                              </a>
                            ) : null}
                            {founder.linkedin_url ? (
                              <a href={founder.linkedin_url} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                                <LinkedInIcon />
                              </a>
                            ) : null}
                          </div>
                          <p className="founder-title">{founder.title}</p>
                          {founder.bio ? <p className="founder-bio">{founder.bio}</p> : null}
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
                    <button type="button" className="text-link" onClick={() => setTab("jobs")}>
                      View all jobs ›
                    </button>
                  </div>
                  {jobs.map((job) => (
                    <JobRow key={job.title} job={job} />
                  ))}
                </div>
              ) : null}
            </section>
          ) : (
            <section>
              <div className="jobs-heading">
                <h2>Jobs at {company.company_name}</h2>
              </div>
              {jobs.length === 0 ? (
                <p className="profile-about">No jobs posted yet.</p>
              ) : (
                jobs.map((job) => <JobRow key={job.title} job={job} />)
              )}
            </section>
          )}
        </div>

        <aside className="profile-side">
          <div className="side-brand">
            <Logo name={company.company_name} src={company.logo_url} className="side-logo" />
            <div>
              <p className="side-kicker">THE Company</p>
              <p className="side-name">{company.company_name}</p>
            </div>
          </div>
          <dl className="side-meta">
            <div>
              <dt>Founded:</dt>
              <dd>{company.founded_year || "-"}</dd>
            </div>
            <div>
              <dt>Batch:</dt>
              <dd>{company.batch}</dd>
            </div>
            <div>
              <dt>Team Size:</dt>
              <dd>{company.team_size || "-"}</dd>
            </div>
            <div>
              <dt>Status:</dt>
              <dd>
                <span className="status-dot" /> {company.activity_status}
              </dd>
            </div>
            <div>
              <dt>Location:</dt>
              <dd>{company.location || "-"}</dd>
            </div>
            <div>
              <dt>Primary Partner:</dt>
              <dd>{company.primary_partner || "You"}</dd>
            </div>
          </dl>
          <div className="side-links">
            <a href={company.website_url} target="_blank" rel="noreferrer" aria-label="Company website">
              <LinkIcon />
            </a>
            {company.linkedin_url ? (
              <a href={company.linkedin_url} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <LinkedInIcon />
              </a>
            ) : null}
            {company.twitter_url ? (
              <a href={company.twitter_url} target="_blank" rel="noreferrer" aria-label="X">
                <XIcon />
              </a>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function JobRow({
  job,
}: {
  job: Company["jobs"][number];
}) {
  const meta = [job.location, job.salary, job.equity, job.experience].filter(Boolean);
  return (
    <div className="job-row">
      <div>
        <a className="job-title" href={job.apply_url} target="_blank" rel="noreferrer">
          {job.title}
        </a>
        <p className="job-meta">{meta.join("  ·  ")}</p>
      </div>
      <a className="job-apply" href={job.apply_url} target="_blank" rel="noreferrer">
        Apply Now ›
      </a>
    </div>
  );
}

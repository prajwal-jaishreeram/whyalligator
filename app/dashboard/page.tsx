"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import type { Company, Job } from "@/lib/types";
import { companyPath } from "@/lib/companies";

type DashboardTab = "startups" | "jobs";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeTab, setActiveTab] = useState<DashboardTab>("startups");

  // Inline quick-edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPitch, setEditPitch] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    if (!hasSupabaseConfig()) {
      setLoading(false);
      return;
    }
    const supabase = createBrowserClient();
    const { data: authData } = await supabase.auth.getSession();
    const user = authData.session?.user;
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setUserEmail(user.email ?? null);

    // Match by user_id OR email
    const { data, error } = await supabase
      .from("companies")
      .select(
        "id, slug, company_name, pitch, batch, location, logo_url, email, status, user_id, created_at, description, website_url, founded_year, team_size, activity_status, industries, linkedin_url, twitter_url, primary_partner, founders, jobs, hq_region, is_nonprofit, is_top_company"
      )
      .or(`user_id.eq.${user.id},email.ilike.${user.email}`)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCompanies(data as Company[]);
    }
    setLoading(false);
  }

  function startQuickEdit(company: Company) {
    setEditingId(company.id);
    setEditName(company.company_name);
    setEditPitch(company.pitch);
    setEditError(null);
    setEditSuccess(null);
  }

  function cancelQuickEdit() {
    setEditingId(null);
    setEditName("");
    setEditPitch("");
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

      if (trimmedName.length < 2) {
        throw new Error("Company name must be at least 2 characters.");
      }
      if (trimmedPitch.length < 4) {
        throw new Error("Pitch must be at least 4 characters.");
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
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to update.");
      }

      // Update local state
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === company.id
            ? { ...c, company_name: trimmedName, pitch: trimmedPitch }
            : c
        )
      );
      setEditSuccess(`"${trimmedName}" updated successfully!`);
      setEditingId(null);

      // Clear success after a few seconds
      setTimeout(() => setEditSuccess(null), 3500);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Error saving.");
    } finally {
      setEditSaving(false);
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
        <p>Loading your startups...</p>
      </main>
    );
  }

  return (
    <main>
      <section className="hero">
        <h1>Founder Dashboard</h1>
        <p className="hero-copy">
          Manage and edit your listed startups. Logged in as{" "}
          <strong style={{ wordBreak: "break-all" }}>{userEmail}</strong>
        </p>
      </section>

      <div className="page-width">
        {/* Dashboard Tabs & Actions */}
        <div
          className="profile-tabs"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
            marginBottom: "24px",
            paddingBottom: "8px",
          }}
        >
          <button
            type="button"
            className={activeTab === "startups" ? "is-on" : ""}
            onClick={() => setActiveTab("startups")}
          >
            Your Startups{" "}
            {companies.length > 0 ? <em>{companies.length}</em> : null}
          </button>
          <button
            type="button"
            className={activeTab === "jobs" ? "is-on" : ""}
            onClick={() => setActiveTab("jobs")}
          >
            Job Listings {allJobs.length > 0 ? <em>{allJobs.length}</em> : null}
          </button>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="ghost-btn"
              style={{
                height: "36px",
                fontSize: "13px",
                color: "#dc2626",
                borderColor: "#fca5a5",
                cursor: "pointer",
              }}
              onClick={handleSignOut}
            >
              Log out
            </button>
          </div>
        </div>

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
                + List another startup ($20)
              </Link>
            </div>

            {companies.length === 0 ? (
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
                  No startups found under <strong>{userEmail}</strong>. If you
                  paid for a listing with this email, it will appear here
                  automatically.
                </p>
                <Link href="/add" className="hero-cta">
                  List your startup now ($20)
                </Link>
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
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "16px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "14px",
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
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
                              style={{ width: "48px", height: "48px" }}
                            />
                          ) : (
                            <div
                              className="company-logo fallback"
                              style={{
                                width: "48px",
                                height: "48px",
                                fontSize: "18px",
                              }}
                            >
                              {company.company_name.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          {editingId === company.id ? (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                                width: "100%",
                              }}
                            >
                              <input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Company name"
                                maxLength={80}
                                style={{
                                  fontSize: "16px",
                                  fontWeight: 500,
                                  padding: "8px 12px",
                                  border: "1px solid #d1d5db",
                                  borderRadius: "6px",
                                  width: "100%",
                                  boxSizing: "border-box",
                                }}
                              />
                              <input
                                value={editPitch}
                                onChange={(e) => setEditPitch(e.target.value)}
                                placeholder="One-line pitch"
                                maxLength={140}
                                style={{
                                  fontSize: "14px",
                                  padding: "8px 12px",
                                  border: "1px solid #d1d5db",
                                  borderRadius: "6px",
                                  width: "100%",
                                  boxSizing: "border-box",
                                  color: "var(--muted)",
                                }}
                              />
                              {editError ? (
                                <span
                                  style={{
                                    fontSize: "13px",
                                    color: "#dc2626",
                                  }}
                                >
                                  {editError}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <>
                              <h3
                                style={{
                                  fontSize: "18px",
                                  margin: "0 0 4px",
                                  fontWeight: 500,
                                  wordBreak: "break-word",
                                }}
                              >
                                {company.company_name}
                              </h3>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: "14px",
                                  color: "var(--muted)",
                                  wordBreak: "break-word",
                                }}
                              >
                                {company.pitch}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        {editingId === company.id ? (
                          <>
                            <button
                              type="button"
                              className="hero-cta"
                              style={{
                                height: "36px",
                                fontSize: "14px",
                                padding: "0 16px",
                                marginTop: 0,
                              }}
                              onClick={() => saveQuickEdit(company)}
                              disabled={editSaving}
                            >
                              {editSaving ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              className="ghost-btn"
                              style={{ height: "36px", fontSize: "14px" }}
                              onClick={cancelQuickEdit}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="ghost-btn"
                              style={{ height: "36px", fontSize: "13px" }}
                              onClick={() => startQuickEdit(company)}
                              title="Quick edit name and pitch"
                            >
                              ✏️ Quick Edit
                            </button>
                            <Link
                              href={companyPath(company)}
                              className="ghost-btn"
                              target="_blank"
                              style={{ height: "36px", fontSize: "13px" }}
                            >
                              View ↗
                            </Link>
                            <Link
                              href={`/companies/${company.slug || company.id}/edit`}
                              className="hero-cta"
                              style={{
                                height: "36px",
                                fontSize: "14px",
                                padding: "0 16px",
                                marginTop: 0,
                              }}
                            >
                              Full Edit
                            </Link>
                          </>
                        )}
                      </div>
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
                            style={{ width: "36px", height: "36px" }}
                          />
                        ) : (
                          <div
                            className="company-logo fallback"
                            style={{
                              width: "36px",
                              height: "36px",
                              fontSize: "14px",
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
      </div>
    </main>
  );
}

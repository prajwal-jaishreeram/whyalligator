"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import type { Company, Founder, Job } from "@/lib/types";
import { HQ_REGIONS } from "@/lib/options";

export default function EditCompanyPage() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params.slug ?? "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [company, setCompany] = useState<Company | null>(null);
  const [pitch, setPitch] = useState("");
  const [description, setDescription] = useState("");
  const [founders, setFounders] = useState<Founder[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    async function loadCompany() {
      if (!hasSupabaseConfig() || !slug) return;
      const supabase = createBrowserClient();
      const { data: authData } = await supabase.auth.getSession();
      const user = authData.session?.user;
      if (!user) {
        window.location.href = `/login?redirect=/companies/${slug}/edit`;
        return;
      }

      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error || !data) {
        setError("Company not found or failed to load.");
        setLoading(false);
        return;
      }

      const isOwner =
        data.user_id === user.id ||
        data.email?.toLowerCase() === (user.email ?? "").toLowerCase();

      if (!isOwner) {
        setError("You do not have permission to edit this company.");
        setLoading(false);
        return;
      }

      setCompany(data as Company);
      setPitch(data.pitch || "");
      setDescription(data.description || "");
      setFounders(data.founders || []);
      setJobs(data.jobs || []);
      setLoading(false);
    }

    loadCompany();
  }, [slug]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setSuccess(false);

    try {
      const supabase = createBrowserClient();
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) throw new Error("Please log in to save changes.");

      const form = new FormData(e.currentTarget);
      const updatePayload = {
        company_name: String(form.get("company_name") ?? "").trim(),
        pitch,
        description,
        website_url: String(form.get("website_url") ?? "").trim(),
        location: String(form.get("location") ?? "").trim(),
        founded_year: String(form.get("founded_year") ?? "").trim(),
        team_size: String(form.get("team_size") ?? "").trim(),
        activity_status: String(form.get("activity_status") ?? "").trim(),
        hq_region: String(form.get("hq_region") ?? "").trim(),
        industries: String(form.get("industries") ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        linkedin_url: String(form.get("linkedin_url") ?? "").trim(),
        twitter_url: String(form.get("twitter_url") ?? "").trim(),
        primary_partner: String(form.get("primary_partner") ?? "").trim(),
        is_nonprofit: form.get("is_nonprofit") === "on",
        founders,
        jobs,
      };

      const res = await fetch(`/api/companies/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to update company.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/companies/${slug}`);
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="page-width" style={{ padding: "80px 0", textAlign: "center" }}>
        <p>Loading company data...</p>
      </main>
    );
  }

  if (error && !company) {
    return (
      <main className="page-width narrow" style={{ padding: "80px 0", textAlign: "center" }}>
        <h2>Access Denied</h2>
        <p style={{ color: "var(--muted)", margin: "16px 0 24px" }}>{error}</p>
        <Link href="/dashboard" className="hero-cta">
          Return to Dashboard
        </Link>
      </main>
    );
  }

  return (
    <main>
      <section className="hero">
        <h1>Edit {company?.company_name}</h1>
        <p className="hero-copy">
          Update your startup description, team, links, and jobs. Changes go live immediately.
        </p>
      </section>

      <div className="page-width form-wide">
        <div className="form-card">
          <form className="add-form" onSubmit={handleSubmit}>
            {error ? <p className="form-error">{error}</p> : null}
            {success ? (
              <p style={{ color: "#16a34a", fontSize: "15px", fontWeight: 500 }}>
                ✓ Changes saved successfully! Redirecting...
              </p>
            ) : null}

            <h2 className="form-section">Company Information</h2>

            <label>
              Company name
              <input
                name="company_name"
                defaultValue={company?.company_name}
                required
                maxLength={80}
              />
            </label>

            <label>
              One-line pitch
              <input
                name="pitch"
                required
                maxLength={140}
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
              />
              <span className="char-count">{pitch.length}/140</span>
            </label>

            <label>
              About the company
              <textarea
                name="description"
                required
                minLength={20}
                maxLength={2000}
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <span className="char-count">{description.length}/2000</span>
            </label>

            <div className="form-grid">
              <label>
                Website URL
                <input
                  name="website_url"
                  type="url"
                  defaultValue={company?.website_url}
                  required
                />
              </label>
              <label>
                Location
                <input
                  name="location"
                  defaultValue={company?.location}
                  required
                />
              </label>
            </div>

            <div className="form-grid">
              <label>
                Founded year
                <input
                  name="founded_year"
                  defaultValue={company?.founded_year}
                />
              </label>
              <label>
                Team size
                <input
                  name="team_size"
                  defaultValue={company?.team_size}
                />
              </label>
            </div>

            <div className="form-grid">
              <label>
                HQ Region
                <select name="hq_region" defaultValue={company?.hq_region || "Remote"}>
                  {HQ_REGIONS.map((region) => (
                    <option key={region}>{region}</option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select name="activity_status" defaultValue={company?.activity_status || "Active"}>
                  <option>Active</option>
                  <option>Stealth</option>
                  <option>Public</option>
                  <option>Acquired</option>
                </select>
              </label>
            </div>

            <label>
              Industries (comma-separated)
              <input
                name="industries"
                defaultValue={company?.industries?.join(", ")}
              />
            </label>

            <div className="form-grid">
              <label>
                Company LinkedIn
                <input
                  name="linkedin_url"
                  defaultValue={company?.linkedin_url}
                />
              </label>
              <label>
                Company X / Twitter
                <input
                  name="twitter_url"
                  defaultValue={company?.twitter_url}
                />
              </label>
            </div>

            <label className="form-check" style={{ marginTop: "8px" }}>
              <input
                name="is_nonprofit"
                type="checkbox"
                defaultChecked={company?.is_nonprofit}
              />
              This is a nonprofit
            </label>

            <h2 className="form-section">Active Founders</h2>
            {founders.map((founder, idx) => (
              <fieldset className="form-block" key={idx}>
                <legend>Founder {idx + 1}</legend>
                <label>
                  Name
                  <input
                    value={founder.name}
                    onChange={(e) => {
                      const copy = [...founders];
                      copy[idx].name = e.target.value;
                      setFounders(copy);
                    }}
                    required
                  />
                </label>
                <div className="form-grid">
                  <label>
                    Title
                    <input
                      value={founder.title}
                      onChange={(e) => {
                        const copy = [...founders];
                        copy[idx].title = e.target.value;
                        setFounders(copy);
                      }}
                    />
                  </label>
                  <label>
                    X / Twitter
                    <input
                      value={founder.twitter_url}
                      onChange={(e) => {
                        const copy = [...founders];
                        copy[idx].twitter_url = e.target.value;
                        setFounders(copy);
                      }}
                    />
                  </label>
                </div>
                <label>
                  Bio
                  <textarea
                    rows={2}
                    value={founder.bio}
                    onChange={(e) => {
                      const copy = [...founders];
                      copy[idx].bio = e.target.value;
                      setFounders(copy);
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="ghost-btn"
                  style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                  onClick={() => setFounders(founders.filter((_, i) => i !== idx))}
                >
                  Remove founder
                </button>
              </fieldset>
            ))}

            {founders.length < 4 ? (
              <button
                type="button"
                className="ghost-btn"
                onClick={() =>
                  setFounders([
                    ...founders,
                    {
                      name: "",
                      title: "Founder",
                      bio: "",
                      photo_url: null,
                      twitter_url: "",
                      linkedin_url: "",
                    },
                  ])
                }
              >
                + Add another founder
              </button>
            ) : null}

            <h2 className="form-section">Jobs & Hiring</h2>
            {jobs.map((job, idx) => (
              <fieldset className="form-block" key={idx}>
                <legend>Job {idx + 1}</legend>
                <label>
                  Job Title
                  <input
                    value={job.title}
                    onChange={(e) => {
                      const copy = [...jobs];
                      copy[idx].title = e.target.value;
                      setJobs(copy);
                    }}
                    required
                  />
                </label>
                <div className="form-grid">
                  <label>
                    Location
                    <input
                      value={job.location}
                      onChange={(e) => {
                        const copy = [...jobs];
                        copy[idx].location = e.target.value;
                        setJobs(copy);
                      }}
                    />
                  </label>
                  <label>
                    Salary / Compensation
                    <input
                      value={job.salary}
                      onChange={(e) => {
                        const copy = [...jobs];
                        copy[idx].salary = e.target.value;
                        setJobs(copy);
                      }}
                    />
                  </label>
                </div>
                <label>
                  Apply Link
                  <input
                    type="url"
                    value={job.apply_url}
                    onChange={(e) => {
                      const copy = [...jobs];
                      copy[idx].apply_url = e.target.value;
                      setJobs(copy);
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="ghost-btn"
                  style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                  onClick={() => setJobs(jobs.filter((_, i) => i !== idx))}
                >
                  Remove job
                </button>
              </fieldset>
            ))}

            {jobs.length < 6 ? (
              <button
                type="button"
                className="ghost-btn"
                onClick={() =>
                  setJobs([
                    ...jobs,
                    {
                      title: "",
                      location: "Remote",
                      salary: "",
                      equity: "",
                      experience: "",
                      apply_url: "",
                    },
                  ])
                }
              >
                + Add a job opening
              </button>
            ) : null}

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                type="submit"
                className="hero-cta"
                style={{ height: "44px", padding: "0 28px" }}
                disabled={saving}
              >
                {saving ? "Saving changes..." : "Save Changes"}
              </button>
              <Link
                href={`/companies/${slug}`}
                className="ghost-btn"
                style={{ height: "44px", display: "inline-flex", alignItems: "center" }}
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

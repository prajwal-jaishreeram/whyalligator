"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, useMemo } from "react";
import { createBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import type { Company, Founder, Job } from "@/lib/types";
import { HQ_REGIONS, INDUSTRY_TAXONOMY } from "@/lib/options";

function isValidUrl(str: string): boolean {
  if (!str.trim()) return false;
  try {
    const url = new URL(str.startsWith("http://") || str.startsWith("https://") ? str : `https://${str}`);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function EditCompanyPage() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params.slug ?? "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [company, setCompany] = useState<Company | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [pitch, setPitch] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [location, setLocation] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [hqRegion, setHqRegion] = useState("Remote");
  const [activityStatus, setActivityStatus] = useState("Active");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [isNonprofit, setIsNonprofit] = useState(false);

  // Industry taxonomy state
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [industriesOpen, setIndustriesOpen] = useState(false);
  const [industrySearch, setIndustrySearch] = useState("");

  const [founders, setFounders] = useState<Founder[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Filter taxonomy for search
  const filteredTaxonomy = useMemo(() => {
    const query = industrySearch.trim().toLowerCase();
    if (!query) return INDUSTRY_TAXONOMY;
    return INDUSTRY_TAXONOMY.map((parent) => {
      const parentMatches = parent.name.toLowerCase().includes(query);
      const matchingSubs = parent.subcategories?.filter((sub) =>
        sub.toLowerCase().includes(query)
      );
      if (parentMatches) return parent;
      if (matchingSubs && matchingSubs.length > 0) {
        return { ...parent, subcategories: matchingSubs };
      }
      return null;
    }).filter(Boolean) as typeof INDUSTRY_TAXONOMY;
  }, [industrySearch]);

  const toggleIndustry = (ind: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]
    );
  };

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
      setCompanyName(data.company_name || "");
      setPitch(data.pitch || "");
      setDescription(data.description || "");
      setWebsiteUrl(data.website_url || "");
      setLocation(data.location || "");
      setFoundedYear(data.founded_year || "");
      setTeamSize(data.team_size || "");
      setHqRegion(data.hq_region || "Remote");
      setActivityStatus(data.activity_status || "Active");
      setSelectedIndustries(Array.isArray(data.industries) ? data.industries : []);
      setLinkedinUrl(data.linkedin_url || "");
      setTwitterUrl(data.twitter_url || "");
      setIsNonprofit(Boolean(data.is_nonprofit));
      setFounders(data.founders || []);
      setJobs(data.jobs || []);
      setLoading(false);
    }

    loadCompany();
  }, [slug]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Compulsory field validation
    if (!companyName.trim() || companyName.trim().length < 2) {
      setError("Company name must be at least 2 characters.");
      return;
    }
    if (!pitch.trim() || pitch.length < 4) {
      setError("One-line pitch must be at least 4 characters.");
      return;
    }
    if (!description.trim() || description.length < 20) {
      setError("About the company must be at least 20 characters.");
      return;
    }
    if (!websiteUrl.trim() || !isValidUrl(websiteUrl)) {
      setError("Please enter a valid website URL (e.g. https://example.com).");
      return;
    }
    if (!location.trim() || location.trim().length < 2) {
      setError("Location is compulsory (at least 2 characters).");
      return;
    }
    if (!foundedYear || !/^\d{4}$/.test(foundedYear) || Number(foundedYear) < 1900 || Number(foundedYear) > 2030) {
      setError("Please enter a valid 4-digit founded year (1900-2030).");
      return;
    }
    if (!teamSize || parseInt(teamSize, 10) <= 0) {
      setError("Please enter a valid team size (at least 1).");
      return;
    }
    if (selectedIndustries.length === 0) {
      setError("Please select at least one industry.");
      return;
    }
    if (linkedinUrl && !isValidUrl(linkedinUrl)) {
      setError("Please enter a valid LinkedIn URL.");
      return;
    }
    if (twitterUrl && !isValidUrl(twitterUrl)) {
      setError("Please enter a valid Twitter URL.");
      return;
    }

    // Founder validation
    if (founders.length === 0) {
      setError("Please have at least one founder listed.");
      return;
    }
    for (let i = 0; i < founders.length; i++) {
      const f = founders[i];
      const num = i + 1;
      if (!f.name.trim() || f.name.trim().length < 2) {
        setError(`Founder #${num} must have a name (at least 2 characters).`);
        return;
      }
      if (!f.title.trim() || f.title.trim().length < 2) {
        setError(`Founder #${num} (${f.name}) title is compulsory (at least 2 characters).`);
        return;
      }
      if (!f.bio.trim() || f.bio.trim().length < 10) {
        setError(`Founder #${num} (${f.name}) bio is compulsory (at least 10 characters).`);
        return;
      }
      if (f.twitter_url && !isValidUrl(f.twitter_url)) {
        setError(`Founder #${num} (${f.name}) Twitter must be a valid URL.`);
        return;
      }
      if (f.linkedin_url && !isValidUrl(f.linkedin_url)) {
        setError(`Founder #${num} (${f.name}) LinkedIn must be a valid URL.`);
        return;
      }
    }

    // Job validation
    for (let i = 0; i < jobs.length; i++) {
      const j = jobs[i];
      const num = i + 1;
      if (!j.title.trim()) {
        setError(`Job #${num} needs a title.`);
        return;
      }
      if (!j.location.trim()) {
        setError(`Job #${num} (${j.title}) needs a location.`);
        return;
      }
      if (j.apply_url && !isValidUrl(j.apply_url)) {
        setError(`Job #${num} (${j.title}) needs a valid Apply URL.`);
        return;
      }
    }

    setSaving(true);
    setSuccess(false);

    try {
      const supabase = createBrowserClient();
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) throw new Error("Please log in to save changes.");

      const updatePayload = {
        company_name: companyName.trim(),
        pitch: pitch.trim(),
        description: description.trim(),
        website_url: websiteUrl.trim(),
        location: location.trim(),
        founded_year: foundedYear.trim(),
        team_size: teamSize.trim(),
        activity_status: activityStatus.trim(),
        hq_region: hqRegion.trim(),
        industries: selectedIndustries,
        linkedin_url: linkedinUrl.trim(),
        twitter_url: twitterUrl.trim(),
        primary_partner: company?.primary_partner || "You",
        is_nonprofit: isNonprofit,
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
          Update your startup description, team, links, and jobs. All changes go live immediately.
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
              <span>Company name <strong className="req">*</strong></span>
              <input
                name="company_name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                maxLength={80}
              />
            </label>

            <label>
              <span>One-line pitch <strong className="req">*</strong></span>
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
              <span>About the company <strong className="req">*</strong></span>
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
                <span>Website URL <strong className="req">*</strong></span>
                <input
                  name="website_url"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                />
              </label>
              <label>
                <span>Location <strong className="req">*</strong></span>
                <input
                  name="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="San Francisco, CA or Remote"
                  required
                />
              </label>
            </div>

            <div className="form-grid">
              <label>
                <span>Founded year <strong className="req">*</strong></span>
                <input
                  name="founded_year"
                  type="number"
                  min="1900"
                  max="2030"
                  value={foundedYear}
                  onChange={(e) => setFoundedYear(e.target.value)}
                  placeholder="2024"
                  required
                />
              </label>
              <label>
                <span>Team size <strong className="req">*</strong></span>
                <input
                  name="team_size"
                  type="number"
                  min="1"
                  max="100000"
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  placeholder="5"
                  required
                />
              </label>
            </div>

            <div className="form-grid">
              <label>
                <span>HQ Region <strong className="req">*</strong></span>
                <select
                  name="hq_region"
                  value={hqRegion}
                  onChange={(e) => setHqRegion(e.target.value)}
                  required
                >
                  {HQ_REGIONS.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Status <strong className="req">*</strong></span>
                <select
                  name="activity_status"
                  value={activityStatus}
                  onChange={(e) => setActivityStatus(e.target.value)}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Stealth">Stealth</option>
                  <option value="Public">Public</option>
                  <option value="Acquired">Acquired</option>
                </select>
              </label>
            </div>

            {/* INDUSTRIES SELECTOR */}
            <div>
              <label style={{ display: "block", marginBottom: "6px" }}>
                <span>Industries <strong className="req">*</strong> (select at least 1)</span>
              </label>

              {/* Selected Pills */}
              {selectedIndustries.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                  {selectedIndustries.map((ind) => (
                    <span
                      key={ind}
                      style={{
                        background: "#111",
                        color: "#fff",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        fontSize: "13px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {ind}
                      <button
                        type="button"
                        onClick={() => toggleIndustry(ind)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#fff",
                          cursor: "pointer",
                          padding: 0,
                          lineHeight: 1,
                          fontSize: "12px",
                        }}
                        aria-label={`Remove ${ind}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              {/* Dropdown toggle button */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setIndustriesOpen(!industriesOpen)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    textAlign: "left",
                    border: "1px solid #d4d4cd",
                    borderRadius: "6px",
                    background: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "14px",
                  }}
                >
                  <span>
                    {selectedIndustries.length > 0
                      ? `${selectedIndustries.length} selected — Click to edit industries...`
                      : "Click to select industries from taxonomy..."}
                  </span>
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    {industriesOpen ? "▲ Close" : "▼ Choose"}
                  </span>
                </button>

                {industriesOpen ? (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "#fff",
                      border: "1px solid #ccc",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      maxHeight: "320px",
                      overflowY: "auto",
                      zIndex: 30,
                      padding: "12px",
                      borderRadius: "8px",
                      marginTop: "4px",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Search industries (e.g. Fintech, AI, SaaS, Analytics)..."
                      value={industrySearch}
                      onChange={(e) => setIndustrySearch(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        fontSize: "13px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        marginBottom: "10px",
                        boxSizing: "border-box",
                      }}
                    />

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {filteredTaxonomy.map((parent) => (
                        <div key={parent.name} style={{ borderBottom: "1px solid #f0f0ea", paddingBottom: "8px" }}>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontWeight: 600,
                              fontSize: "14px",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedIndustries.includes(parent.name)}
                              onChange={() => toggleIndustry(parent.name)}
                            />
                            {parent.name}
                          </label>
                          {parent.subcategories && parent.subcategories.length > 0 ? (
                            <div
                              style={{
                                marginLeft: "24px",
                                marginTop: "6px",
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "6px",
                              }}
                            >
                              {parent.subcategories.map((sub) => {
                                const isSel = selectedIndustries.includes(sub);
                                return (
                                  <button
                                    key={sub}
                                    type="button"
                                    onClick={() => toggleIndustry(sub)}
                                    style={{
                                      background: isSel ? "#111" : "#f4f4f0",
                                      color: isSel ? "#fff" : "#333",
                                      border: `1px solid ${isSel ? "#111" : "#d8d8d0"}`,
                                      borderRadius: "999px",
                                      padding: "3px 10px",
                                      fontSize: "12px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {isSel ? "✓ " : "+ "}
                                    {sub}
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    <div style={{ textAlign: "right", marginTop: "10px" }}>
                      <button
                        type="button"
                        onClick={() => setIndustriesOpen(false)}
                        className="ghost-btn"
                        style={{ height: "30px", fontSize: "12px", padding: "0 12px" }}
                      >
                        Done selecting
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="form-grid">
              <label>
                <span>Company LinkedIn (URL)</span>
                <input
                  name="linkedin_url"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/company/acme"
                />
              </label>
              <label>
                <span>Company X / Twitter (URL)</span>
                <input
                  name="twitter_url"
                  type="url"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://x.com/acme"
                />
              </label>
            </div>

            <label className="form-check" style={{ marginTop: "8px" }}>
              <input
                name="is_nonprofit"
                type="checkbox"
                checked={isNonprofit}
                onChange={(e) => setIsNonprofit(e.target.checked)}
              />
              This is a registered nonprofit
            </label>

            <h2 className="form-section">Active Founders</h2>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: "-12px 0 16px" }}>
              Founder name, title, and bio are compulsory for each founder.
            </p>

            {founders.map((founder, idx) => (
              <fieldset className="form-block" key={idx}>
                <legend>Founder {idx + 1}</legend>
                <label>
                  <span>Name <strong className="req">*</strong></span>
                  <input
                    value={founder.name}
                    onChange={(e) => {
                      setFounders(founders.map((f, i) => (i === idx ? { ...f, name: e.target.value } : f)));
                    }}
                    required
                  />
                </label>
                <div className="form-grid">
                  <label>
                    <span>Title / Role <strong className="req">*</strong></span>
                    <input
                      value={founder.title}
                      placeholder="Co-founder & CEO"
                      onChange={(e) => {
                        setFounders(founders.map((f, i) => (i === idx ? { ...f, title: e.target.value } : f)));
                      }}
                      required
                    />
                  </label>
                  <label>
                    <span>X / Twitter (URL)</span>
                    <input
                      type="url"
                      placeholder="https://x.com/username"
                      value={founder.twitter_url}
                      onChange={(e) => {
                        setFounders(founders.map((f, i) => (i === idx ? { ...f, twitter_url: e.target.value } : f)));
                      }}
                    />
                  </label>
                </div>
                <label>
                  <span>LinkedIn (URL)</span>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={founder.linkedin_url}
                    onChange={(e) => {
                      setFounders(founders.map((f, i) => (i === idx ? { ...f, linkedin_url: e.target.value } : f)));
                    }}
                  />
                </label>
                <label>
                  <span>Bio & Background <strong className="req">*</strong> (min 10 characters)</span>
                  <textarea
                    rows={3}
                    value={founder.bio}
                    onChange={(e) => {
                      setFounders(founders.map((f, i) => (i === idx ? { ...f, bio: e.target.value } : f)));
                    }}
                    required
                    minLength={10}
                  />
                  <span className="char-count">{founder.bio?.length || 0} characters (min 10)</span>
                </label>
                {founders.length > 1 ? (
                  <button
                    type="button"
                    className="ghost-btn"
                    style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                    onClick={() => setFounders(founders.filter((_, i) => i !== idx))}
                  >
                    Remove founder
                  </button>
                ) : null}
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

            <h2 className="form-section">Jobs & Hiring (Optional)</h2>
            {jobs.map((job, idx) => (
              <fieldset className="form-block" key={idx}>
                <legend>Job {idx + 1}</legend>
                <label>
                  <span>Job Title <strong className="req">*</strong></span>
                  <input
                    value={job.title}
                    onChange={(e) => {
                      setJobs(jobs.map((j, i) => (i === idx ? { ...j, title: e.target.value } : j)));
                    }}
                    required
                  />
                </label>
                <div className="form-grid">
                  <label>
                    <span>Location <strong className="req">*</strong></span>
                    <input
                      value={job.location}
                      placeholder="Remote or City"
                      onChange={(e) => {
                        setJobs(jobs.map((j, i) => (i === idx ? { ...j, location: e.target.value } : j)));
                      }}
                      required
                    />
                  </label>
                  <label>
                    <span>Salary / Compensation</span>
                    <input
                      type="text"
                      placeholder="$120K - $180K"
                      value={job.salary}
                      onChange={(e) => {
                        setJobs(jobs.map((j, i) => (i === idx ? { ...j, salary: e.target.value } : j)));
                      }}
                    />
                  </label>
                </div>
                <div className="form-grid">
                  <label>
                    <span>Equity</span>
                    <input
                      type="text"
                      placeholder="0.5% - 2.0%"
                      value={job.equity}
                      onChange={(e) => {
                        setJobs(jobs.map((j, i) => (i === idx ? { ...j, equity: e.target.value } : j)));
                      }}
                    />
                  </label>
                  <label>
                    <span>Experience</span>
                    <input
                      type="text"
                      placeholder="3+ years"
                      value={job.experience}
                      onChange={(e) => {
                        setJobs(jobs.map((j, i) => (i === idx ? { ...j, experience: e.target.value } : j)));
                      }}
                    />
                  </label>
                </div>
                <label>
                  <span>Apply Link <strong className="req">*</strong></span>
                  <input
                    type="url"
                    placeholder="https://example.com/careers"
                    value={job.apply_url}
                    onChange={(e) => {
                      setJobs(jobs.map((j, i) => (i === idx ? { ...j, apply_url: e.target.value } : j)));
                    }}
                    required
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

            <div style={{ display: "flex", gap: "12px", marginTop: "24px", flexWrap: "wrap" }}>
              <button
                type="submit"
                className="hero-cta"
                style={{ height: "44px", padding: "0 28px", marginTop: 0 }}
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

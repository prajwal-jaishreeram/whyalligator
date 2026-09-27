"use client";

import Link from "next/link";
import { FormEvent, useRef, useState, useMemo } from "react";
import { HQ_REGIONS, INDUSTRY_TAXONOMY } from "@/lib/options";

type FounderDraft = {
  name: string;
  title: string;
  bio: string;
  twitter: string;
  linkedin: string;
  photoPreview?: string | null;
};

type JobDraft = {
  title: string;
  location: string;
  salary: string;
  equity: string;
  experience: string;
  apply_url: string;
};

const STEPS = [
  { id: "company", label: "Company" },
  { id: "founders", label: "Founders" },
  { id: "jobs", label: "Jobs" },
  { id: "submit", label: "Review & Submit" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const emptyFounder = (): FounderDraft => ({
  name: "",
  title: "",
  bio: "",
  twitter: "",
  linkedin: "",
  photoPreview: null,
});

const emptyJob = (): JobDraft => ({
  title: "",
  location: "",
  salary: "",
  equity: "",
  experience: "",
  apply_url: "",
});

function isValidUrl(str: string): boolean {
  if (!str.trim()) return false;
  try {
    const url = new URL(str.startsWith("http://") || str.startsWith("https://") ? str : `https://${str}`);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function AddStartupForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState<StepId>("company");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Company state
  const [companyName, setCompanyName] = useState("");
  const [pitch, setPitch] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [location, setLocation] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [hqRegion, setHqRegion] = useState("Remote");
  const [activityStatus, setActivityStatus] = useState("Active");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [isNonprofit, setIsNonprofit] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Industry selector state
  const [industriesOpen, setIndustriesOpen] = useState(false);
  const [industrySearch, setIndustrySearch] = useState("");

  // Founders state
  const [founders, setFounders] = useState<FounderDraft[]>([emptyFounder()]);
  const [expandedFounder, setExpandedFounder] = useState<number | null>(0);

  // Jobs state
  const [jobs, setJobs] = useState<JobDraft[]>([]);

  // Checkout / Submit state
  const [email, setEmail] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);

  // Filter industry taxonomy based on search
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

  function validateStep(step: StepId): boolean {
    setError(null);
    if (step === "company") {
      if (!companyName.trim() || companyName.trim().length < 2) {
        setError("Company name must be at least 2 characters.");
        return false;
      }
      if (!pitch.trim() || pitch.length < 4) {
        setError("Please enter a one-line pitch (at least 4 characters).");
        return false;
      }
      if (!description.trim() || description.length < 20) {
        setError("Please describe what your company does (at least 20 characters).");
        return false;
      }
      if (!websiteUrl.trim() || !isValidUrl(websiteUrl)) {
        setError("Please enter a valid website URL (e.g. https://example.com).");
        return false;
      }
      if (!location.trim() || location.trim().length < 2) {
        setError("Location is compulsory (at least 2 characters).");
        return false;
      }
      if (!foundedYear || !/^\d{4}$/.test(foundedYear) || Number(foundedYear) < 1900 || Number(foundedYear) > 2030) {
        setError("Please enter a valid 4-digit founded year (between 1900 and 2030).");
        return false;
      }
      if (!teamSize || parseInt(teamSize, 10) <= 0) {
        setError("Please enter a valid team size (at least 1).");
        return false;
      }
      if (!logoFile && !logoPreview) {
        setError("Company logo is compulsory. Please upload an image logo.");
        return false;
      }
      if (selectedIndustries.length === 0) {
        setError("Please select at least one industry for your company.");
        return false;
      }
      if (linkedinUrl && !isValidUrl(linkedinUrl)) {
        setError("Please enter a valid LinkedIn URL (e.g. https://linkedin.com/company/acme).");
        return false;
      }
      if (twitterUrl && !isValidUrl(twitterUrl)) {
        setError("Please enter a valid Twitter/X URL (e.g. https://x.com/acme).");
        return false;
      }
    } else if (step === "founders") {
      if (founders.length === 0) {
        setError("Please add at least one founder.");
        return false;
      }
      for (let i = 0; i < founders.length; i++) {
        const f = founders[i];
        const num = i + 1;
        if (!f.name.trim() || f.name.trim().length < 2) {
          setError(`Founder #${num} must have a name (at least 2 characters).`);
          setExpandedFounder(i);
          return false;
        }
        if (!f.title.trim() || f.title.trim().length < 2) {
          setError(`Founder #${num} (${f.name}) must have a title or role (e.g. Founder & CEO).`);
          setExpandedFounder(i);
          return false;
        }
        if (!f.bio.trim() || f.bio.trim().length < 10) {
          setError(`Founder #${num} (${f.name}) bio is compulsory (at least 10 characters).`);
          setExpandedFounder(i);
          return false;
        }
        if (f.twitter && !isValidUrl(f.twitter)) {
          setError(`Founder #${num} (${f.name}) Twitter must be a valid URL.`);
          setExpandedFounder(i);
          return false;
        }
        if (f.linkedin && !isValidUrl(f.linkedin)) {
          setError(`Founder #${num} (${f.name}) LinkedIn must be a valid URL.`);
          setExpandedFounder(i);
          return false;
        }
      }
    } else if (step === "jobs") {
      for (let i = 0; i < jobs.length; i++) {
        const j = jobs[i];
        const num = i + 1;
        if (!j.title.trim()) {
          setError(`Job #${num} needs a job title.`);
          return false;
        }
        if (!j.location.trim()) {
          setError(`Job #${num} (${j.title}) needs a location (e.g. Remote or San Francisco).`);
          return false;
        }
        if (j.apply_url && !isValidUrl(j.apply_url)) {
          setError(`Job #${num} (${j.title}) needs a valid Apply URL.`);
          return false;
        }
      }
    }
    return true;
  }

  function goToStep(step: StepId) {
    setError(null);
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNext() {
    if (!validateStep(currentStep)) return;
    if (stepIndex < STEPS.length - 1) {
      goToStep(STEPS[stepIndex + 1].id);
    }
  }

  function handleBack() {
    if (stepIndex > 0) {
      goToStep(STEPS[stepIndex - 1].id);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!validateStep("company") || !validateStep("founders") || !validateStep("jobs")) {
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please provide a valid founder email address.");
      return;
    }

    if (!agreedToTerms) {
      setError("Please check the box agreeing to the Terms of Use and Privacy Policy before submitting.");
      return;
    }

    setPending(true);
    const data = new FormData(event.currentTarget);
    data.set("founder_count", String(founders.length));
    data.set("job_count", String(jobs.length));
    data.set("industries", selectedIndustries.join(","));

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        body: data,
      });
      const payload = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Could not start checkout.");
      }
      window.location.href = payload.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(false);
    }
  }

  const toggleIndustry = (ind: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]
    );
  };

  const handleLogoChange = (file: File | undefined) => {
    if (file) {
      setLogoFile(file);
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    } else {
      setLogoFile(null);
      setLogoPreview(null);
    }
  };

  return (
    <form ref={formRef} className="yc-app-shell" onSubmit={onSubmit}>
      {/* Top Header Row */}
      {stepIndex > 0 ? (
        <div className="yc-top-bar">
          <button
            type="button"
            className="yc-top-back-btn"
            onClick={handleBack}
            aria-label="Back"
          >
            ‹ Back
          </button>
        </div>
      ) : null}

      {/* App Header for Mobile / Tablet */}
      <div className="yc-mobile-header">
        <div className="yc-mobile-meta">
          <span className="yc-tagline-sub">Alligator Application</span>
          <span className="yc-batch-tag">Newest First</span>
        </div>
        <div className="yc-mobile-stepper-wrap">
          <button
            type="button"
            className="yc-mobile-nav-arrow"
            onClick={() => {
              if (stepIndex > 0) goToStep(STEPS[stepIndex - 1].id);
            }}
            disabled={stepIndex === 0}
            aria-label="Previous step"
          >
            ‹
          </button>
          <div className="yc-steps-scroller">
            {STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                className={`yc-step-tab ${currentStep === s.id ? "is-active" : ""}`}
                onClick={() => {
                  if (validateStep(currentStep)) goToStep(s.id);
                }}
              >
                <span className="step-num">{idx + 1}</span>
                <span className="step-txt">{s.label}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="yc-mobile-nav-arrow"
            onClick={() => {
              if (stepIndex < STEPS.length - 1) {
                if (validateStep(currentStep)) goToStep(STEPS[stepIndex + 1].id);
              }
            }}
            disabled={stepIndex === STEPS.length - 1}
            aria-label="Next step"
          >
            ›
          </button>
        </div>
      </div>

      <div className="yc-app-body">
        {/* Left Vertical Navigation (Desktop) */}
        <aside className="yc-app-sidebar">
          <div className="yc-sidebar-brand">
            <h3 className="yc-sidebar-title">Alligator Application</h3>
            <span className="yc-sidebar-vintage">Batch Auto-Assigned</span>
          </div>
          <nav className="yc-sidebar-nav" aria-label="Application Steps">
            {STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`yc-sidebar-link ${currentStep === s.id ? "is-active" : ""}`}
                onClick={() => {
                  if (validateStep(currentStep)) goToStep(s.id);
                }}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Application Content Area */}
        <main className="yc-app-main">
          {error ? <div className="yc-error-banner">{error}</div> : null}

          {/* STEP 1: COMPANY */}
          <div className={`yc-step-content ${currentStep === "company" ? "is-visible" : "is-hidden"}`}>
            <h2 className="yc-section-title">Company</h2>

            <div className="yc-form-block">
              <label className="yc-field-label">
                <span>Company name <strong className="req">*</strong></span>
                <input
                  name="company_name"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  maxLength={80}
                  placeholder="Acme Corp"
                  autoComplete="organization"
                />
              </label>

              <label className="yc-field-label">
                <span>One-line pitch <strong className="req">*</strong></span>
                <input
                  name="pitch"
                  required
                  maxLength={140}
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  placeholder="Talk to your computer without talking"
                />
                <span className="char-count">{pitch.length}/140</span>
              </label>

              <label className="yc-field-label">
                <span>About the company <strong className="req">*</strong></span>
                <textarea
                  name="description"
                  required
                  minLength={20}
                  maxLength={2000}
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What you are building, who it is for, and why it exists."
                />
                <span className="char-count">{description.length}/2000</span>
              </label>

              <div className="yc-grid-2">
                <label className="yc-field-label">
                  <span>Website URL <strong className="req">*</strong></span>
                  <input
                    name="website_url"
                    type="url"
                    required
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    inputMode="url"
                  />
                </label>
                <label className="yc-field-label">
                  <span>Location <strong className="req">*</strong></span>
                  <input
                    name="location"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="San Francisco, CA or Remote"
                  />
                </label>
              </div>

              <div className="yc-grid-2">
                <label className="yc-field-label">
                  <span>Founded year <strong className="req">*</strong></span>
                  <input
                    name="founded_year"
                    type="number"
                    required
                    min="1900"
                    max="2030"
                    value={foundedYear}
                    onChange={(e) => setFoundedYear(e.target.value)}
                    placeholder="2024"
                  />
                </label>
                <label className="yc-field-label">
                  <span>Team size <strong className="req">*</strong></span>
                  <input
                    name="team_size"
                    type="number"
                    required
                    min="1"
                    max="100000"
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    placeholder="5"
                  />
                </label>
              </div>

              <div className="yc-grid-2">
                <label className="yc-field-label">
                  <span>HQ region <strong className="req">*</strong></span>
                  <select
                    name="hq_region"
                    required
                    value={hqRegion}
                    onChange={(e) => setHqRegion(e.target.value)}
                  >
                    {HQ_REGIONS.map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </label>
                <label className="yc-field-label">
                  <span>Status <strong className="req">*</strong></span>
                  <select
                    name="activity_status"
                    required
                    value={activityStatus}
                    onChange={(e) => setActivityStatus(e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Stealth">Stealth</option>
                    <option value="Public">Public</option>
                    <option value="Acquired">Acquired</option>
                  </select>
                </label>
              </div>

              {/* COMPANY LOGO WITH IMMEDIATE LIVE PREVIEW */}
              <div className="yc-field-label">
                <span>Company logo <strong className="req">*</strong></span>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "6px" }}>
                  {logoPreview ? (
                    <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        style={{
                          width: 64,
                          height: 64,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid #d4d4cd",
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 8,
                        background: "#e5e5dc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#666",
                        fontSize: "24px",
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {companyName ? companyName.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <input
                      ref={fileInputRef}
                      name="logo"
                      type="file"
                      accept="image/*"
                      style={{ display: "block", fontSize: "14px" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        handleLogoChange(file);
                      }}
                    />
                    <span className="yc-input-hint" style={{ marginTop: "4px", display: "block" }}>
                      PNG, JPG, WebP or GIF up to 2MB. Square or rounded recommended.
                    </span>
                  </div>
                </div>
              </div>

              {/* INDUSTRIES SELECTOR */}
              <div className="yc-field-label">
                <span>Industries <strong className="req">*</strong> (select at least 1)</span>
                <input type="hidden" name="industries" value={selectedIndustries.join(",")} />

                {/* Selected Pills */}
                {selectedIndustries.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      margin: "8px 0",
                    }}
                  >
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
                <div style={{ position: "relative", marginTop: "6px" }}>
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
                        ? `${selectedIndustries.length} selected — Click to add more...`
                        : "Click to choose industries from taxonomy..."}
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
                        placeholder="Search industries (e.g. Fintech, AI, SaaS, Payments)..."
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

              <div className="yc-grid-2">
                <label className="yc-field-label">
                  <span>Company LinkedIn (URL)</span>
                  <input
                    name="linkedin_url"
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/company/acme"
                    inputMode="url"
                  />
                </label>
                <label className="yc-field-label">
                  <span>Company X / Twitter (URL)</span>
                  <input
                    name="twitter_url"
                    type="url"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    placeholder="https://x.com/acme"
                    inputMode="url"
                  />
                </label>
              </div>

              <label className="yc-checkbox-row">
                <input
                  name="is_nonprofit"
                  type="checkbox"
                  checked={isNonprofit}
                  onChange={(e) => setIsNonprofit(e.target.checked)}
                />
                <span>This startup is a registered nonprofit (501(c)(3) or equivalent)</span>
              </label>
            </div>
          </div>

          {/* STEP 2: FOUNDERS */}
          <div className={`yc-step-content ${currentStep === "founders" ? "is-visible" : "is-hidden"}`}>
            <h2 className="yc-section-title">Founders</h2>
            <p className="yc-section-subtitle">
              Founder name, title, and bio are compulsory for every listed founder.
            </p>

            <div className="yc-founders-list">
              {founders.map((founder, index) => {
                const isComplete =
                  founder.name.trim().length >= 2 &&
                  founder.title.trim().length >= 2 &&
                  founder.bio.trim().length >= 10;
                const isExpanded = expandedFounder === index;

                return (
                  <div key={index} className="yc-founder-card">
                    <div
                      className="yc-founder-summary"
                      onClick={() => setExpandedFounder(isExpanded ? null : index)}
                    >
                      <div className="yc-founder-info">
                        <strong className="yc-founder-name">
                          {founder.name.trim() || `Founder ${index + 1}`}
                        </strong>
                        {isComplete ? (
                          <span className="yc-complete-badge">
                            <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
                              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                            </svg>
                            Complete
                          </span>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#dc2626" }}>
                            Incomplete (name, title, bio required)
                          </span>
                        )}
                      </div>
                      <div className="yc-founder-actions">
                        <button
                          type="button"
                          className="yc-text-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedFounder(isExpanded ? null : index);
                          }}
                        >
                          {isExpanded ? "Close" : "Edit details →"}
                        </button>
                        {founders.length > 1 ? (
                          <button
                            type="button"
                            className="yc-remove-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFounders(founders.filter((_, i) => i !== index));
                              if (expandedFounder === index) setExpandedFounder(0);
                            }}
                            title="Remove founder"
                          >
                            ✕
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {isExpanded ? (
                      <div className="yc-founder-body">
                        <label className="yc-field-label">
                          <span>Founder Name <strong className="req">*</strong></span>
                          <input
                            name={`founder_name_${index}`}
                            required
                            value={founder.name}
                            onChange={(e) =>
                              setFounders(updateAt(founders, index, { name: e.target.value }))
                            }
                            placeholder="Full name"
                          />
                        </label>

                        <label className="yc-field-label">
                          <span>Title / Role <strong className="req">*</strong></span>
                          <input
                            name={`founder_title_${index}`}
                            required
                            placeholder="Co-founder & CEO"
                            value={founder.title}
                            onChange={(e) =>
                              setFounders(updateAt(founders, index, { title: e.target.value }))
                            }
                          />
                        </label>

                        <label className="yc-field-label">
                          <span>Bio & Background <strong className="req">*</strong> (min 10 characters)</span>
                          <textarea
                            name={`founder_bio_${index}`}
                            required
                            minLength={10}
                            rows={3}
                            placeholder="Brief summary of background, previous experience, or domain expertise"
                            value={founder.bio}
                            onChange={(e) =>
                              setFounders(updateAt(founders, index, { bio: e.target.value }))
                            }
                          />
                          <span className="char-count">{founder.bio.length} characters (min 10)</span>
                        </label>

                        <label className="yc-field-label">
                          <span>Founder Photo (optional)</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
                            {founder.photoPreview ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={founder.photoPreview}
                                alt="Founder"
                                style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
                              />
                            ) : null}
                            <input
                              name={`founder_photo_${index}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const url = URL.createObjectURL(file);
                                  setFounders(updateAt(founders, index, { photoPreview: url }));
                                }
                              }}
                            />
                          </div>
                        </label>

                        <div className="yc-grid-2">
                          <label className="yc-field-label">
                            <span>X / Twitter (URL)</span>
                            <input
                              name={`founder_twitter_${index}`}
                              type="url"
                              placeholder="https://x.com/username"
                              value={founder.twitter}
                              onChange={(e) =>
                                setFounders(updateAt(founders, index, { twitter: e.target.value }))
                              }
                            />
                          </label>
                          <label className="yc-field-label">
                            <span>LinkedIn (URL)</span>
                            <input
                              name={`founder_linkedin_${index}`}
                              type="url"
                              placeholder="https://linkedin.com/in/username"
                              value={founder.linkedin}
                              onChange={(e) =>
                                setFounders(updateAt(founders, index, { linkedin: e.target.value }))
                              }
                            />
                          </label>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {founders.length < 4 ? (
                <button
                  type="button"
                  className="yc-add-btn"
                  onClick={() => {
                    const next = [...founders, emptyFounder()];
                    setFounders(next);
                    setExpandedFounder(next.length - 1);
                  }}
                >
                  + Add another founder
                </button>
              ) : null}
            </div>
          </div>

          {/* STEP 3: JOBS (OPTIONAL) */}
          <div className={`yc-step-content ${currentStep === "jobs" ? "is-visible" : "is-hidden"}`}>
            <h2 className="yc-section-title">Hiring & Open Roles (Optional)</h2>
            <p className="yc-section-subtitle">
              Open roles appear on your company profile and on the WhyAlligator Jobs Board.
            </p>

            <div className="yc-jobs-list">
              {jobs.map((job, index) => (
                <div className="yc-job-card" key={index}>
                  <div className="yc-job-header">
                    <strong>Role {index + 1}: {job.title || "Untitled"}</strong>
                    <button
                      type="button"
                      className="yc-remove-btn"
                      onClick={() => setJobs(jobs.filter((_, i) => i !== index))}
                    >
                      ✕ Remove
                    </button>
                  </div>
                  <label className="yc-field-label">
                    <span>Job Title <strong className="req">*</strong></span>
                    <input
                      name={`job_title_${index}`}
                      required
                      value={job.title}
                      placeholder="Founding Full-Stack Engineer"
                      onChange={(e) => setJobs(updateAt(jobs, index, { title: e.target.value }))}
                    />
                  </label>
                  <div className="yc-grid-2">
                    <label className="yc-field-label">
                      <span>Location <strong className="req">*</strong></span>
                      <input
                        name={`job_location_${index}`}
                        required
                        placeholder="San Francisco or Remote"
                        value={job.location}
                        onChange={(e) => setJobs(updateAt(jobs, index, { location: e.target.value }))}
                      />
                    </label>
                    <label className="yc-field-label">
                      <span>Salary</span>
                      <input
                        name={`job_salary_${index}`}
                        type="text"
                        placeholder="$150K - $200K"
                        value={job.salary}
                        onChange={(e) => setJobs(updateAt(jobs, index, { salary: e.target.value }))}
                      />
                    </label>
                  </div>
                  <div className="yc-grid-2">
                    <label className="yc-field-label">
                      <span>Equity</span>
                      <input
                        name={`job_equity_${index}`}
                        type="text"
                        placeholder="0.5% - 2.0%"
                        value={job.equity}
                        onChange={(e) => setJobs(updateAt(jobs, index, { equity: e.target.value }))}
                      />
                    </label>
                    <label className="yc-field-label">
                      <span>Experience</span>
                      <input
                        name={`job_experience_${index}`}
                        type="text"
                        placeholder="3+ years"
                        value={job.experience}
                        onChange={(e) => setJobs(updateAt(jobs, index, { experience: e.target.value }))}
                      />
                    </label>
                  </div>
                  <label className="yc-field-label">
                    <span>Apply URL <strong className="req">*</strong></span>
                    <input
                      name={`job_apply_url_${index}`}
                      type="url"
                      required
                      placeholder="https://example.com/careers"
                      value={job.apply_url}
                      onChange={(e) => setJobs(updateAt(jobs, index, { apply_url: e.target.value }))}
                    />
                  </label>
                </div>
              ))}

              {jobs.length < 6 ? (
                <button
                  type="button"
                  className="yc-add-btn"
                  onClick={() => setJobs([...jobs, emptyJob()])}
                >
                  + Add an open role
                </button>
              ) : null}
            </div>
          </div>

          {/* STEP 4: REVIEW & SUBMIT */}
          <div className={`yc-step-content ${currentStep === "submit" ? "is-visible" : "is-hidden"}`}>
            <h2 className="yc-section-title">Review & Submit</h2>
            <p className="yc-section-subtitle">
              Here is how your startup will appear on WhyAlligator once payment clears ($20 flat, one-time).
            </p>

            {/* LIVE CARD PREVIEW */}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "15px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#666", margin: "0 0 10px" }}>
                Directory Card Preview
              </h3>
              <div
                className="company-row"
                style={{
                  background: "#fff",
                  border: "1px solid #d4d4cd",
                  borderRadius: "8px",
                  padding: "16px",
                  pointerEvents: "none",
                }}
              >
                <div className="company-logo-wrap" style={{ width: 64, flexBasis: 64, padding: 0 }}>
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoPreview}
                      alt="Preview logo"
                      className="company-logo"
                      style={{ width: 64, height: 64, objectFit: "cover", borderRadius: "10px" }}
                    />
                  ) : (
                    <div
                      className="company-logo fallback"
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "10px",
                        fontSize: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {companyName ? companyName.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                </div>
                <div className="company-copy" style={{ minWidth: 0, flex: 1, paddingLeft: "16px" }}>
                  <div className="company-titleline" style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                    <span className="company-name" style={{ fontSize: "18px", fontWeight: 600 }}>
                      {companyName || "Your Company Name"}
                    </span>
                    {location ? (
                      <span className="company-location" style={{ fontSize: "14px", color: "#666" }}>
                        {location}
                      </span>
                    ) : null}
                  </div>
                  <p className="company-pitch" style={{ margin: "4px 0 10px", color: "#333", fontSize: "14px" }}>
                    {pitch || "Your one-line pitch will appear here."}
                  </p>
                  <div className="pill-row" style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <span className="pill pill-batch">Auto-Calculated Batch</span>
                    <span className="pill pill-active"><i /> {activityStatus}</span>
                    {selectedIndustries.slice(0, 4).map((tag) => (
                      <span className="pill" key={tag}>{tag}</span>
                    ))}
                    {jobs.length > 0 ? (
                      <span className="pill" style={{ background: "#dcfce7", color: "#15803d" }}>
                        {jobs.length} hiring
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* DETAILED SUMMARY */}
            <div className="yc-review-box">
              <h3 className="yc-review-title">Application Summary</h3>
              <div className="yc-review-row">
                <span className="yc-review-label">Website:</span>
                <span>{websiteUrl || "Not provided"}</span>
              </div>
              <div className="yc-review-row">
                <span className="yc-review-label">Location:</span>
                <span>{location || "Not provided"}</span>
              </div>
              <div className="yc-review-row">
                <span className="yc-review-label">Founded:</span>
                <span>{foundedYear || "Not provided"}</span>
              </div>
              <div className="yc-review-row">
                <span className="yc-review-label">Team Size:</span>
                <span>{teamSize || "Not provided"}</span>
              </div>
              <div className="yc-review-row">
                <span className="yc-review-label">HQ Region:</span>
                <span>{hqRegion}</span>
              </div>
              <div className="yc-review-row">
                <span className="yc-review-label">Industries:</span>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {selectedIndustries.map((ind) => (
                    <span key={ind} style={{ background: "#eee", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>
                      {ind}
                    </span>
                  ))}
                </div>
              </div>
              <div className="yc-review-row">
                <span className="yc-review-label">Founders:</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {founders.filter((f) => f.name.trim()).map((f, i) => (
                    <span key={i}>
                      <strong>{f.name}</strong> — {f.title}
                    </span>
                  ))}
                </div>
              </div>
              {jobs.length > 0 ? (
                <div className="yc-review-row">
                  <span className="yc-review-label">Open Roles:</span>
                  <span>{jobs.length} listed ({jobs.map((j) => j.title).join(", ")})</span>
                </div>
              ) : null}
            </div>

            {/* EMAIL AND TERMS */}
            <div className="yc-form-block" style={{ marginTop: 24 }}>
              <label className="yc-field-label">
                <span>Founder Email (for listing management & receipt) <strong className="req">*</strong></span>
                <input
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="founder@example.com"
                  autoComplete="email"
                />
                <span className="yc-input-hint">
                  You can use this email to log in and manage your startup anytime.
                </span>
              </label>

              {/* Required Terms & Conditions Checkbox */}
              <div className="yc-terms-box">
                <label className="yc-terms-label">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    required
                  />
                  <span>
                    I agree to the{" "}
                    <Link href="/terms" target="_blank" className="yc-terms-link">
                      Terms of Use
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" target="_blank" className="yc-terms-link">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              </div>

              <p className="yc-fineprint">
                Flat $20, one time. No recurring charges. Your startup page goes live immediately once payment clears. Newest first, no ranking.
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <footer className="yc-sticky-bottom-bar">
        <div className="yc-bottom-bar-inner">
          <div className="yc-bottom-left">
            {stepIndex > 0 ? (
              <button
                type="button"
                className="yc-back-btn"
                onClick={handleBack}
              >
                ‹ Back
              </button>
            ) : null}
          </div>

          <div className="yc-bottom-right">
            {currentStep !== "submit" ? (
              <button
                type="button"
                className="yc-next-btn"
                onClick={handleNext}
              >
                Next step ›
              </button>
            ) : (
              <button
                type="submit"
                className="yc-submit-btn"
                disabled={pending || !agreedToTerms}
              >
                {pending ? "Preparing checkout…" : "Submit & Pay $20"}
              </button>
            )}
          </div>
        </div>
      </footer>
    </form>
  );
}

function updateAt<T>(list: T[], index: number, patch: Partial<T>): T[] {
  return list.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

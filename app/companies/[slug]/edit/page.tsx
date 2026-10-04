"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, useMemo } from "react";
import { createBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import type { Company, Founder, Job, SocialLink } from "@/lib/types";
import {
  HQ_REGIONS,
  INDUSTRY_TAXONOMY,
  getRegionForCountry,
  formatLocation,
  parseLocation,
} from "@/lib/options";
import CountryPicker from "@/components/CountryPicker";
import SocialLinksEditor from "@/components/SocialLinksEditor";
import { ActivityStatusBadge } from "@/components/ActivityStatusBadge";
import { processSquareImage } from "@/lib/image-processing";

const STEPS = [
  { id: "all", label: "All Sections" },
  { id: "company", label: "Company" },
  { id: "founders", label: "Founders" },
  { id: "jobs", label: "Jobs" },
  { id: "links", label: "Links & Team" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

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

  const [currentStep, setCurrentStep] = useState<StepId>("all");
  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [company, setCompany] = useState<Company | null>(null);
  const [initialCompanyName, setInitialCompanyName] = useState("");
  const [initialWebsiteUrl, setInitialWebsiteUrl] = useState("");
  const [showResetWarningModal, setShowResetWarningModal] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [pitch, setPitch] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [hqRegion, setHqRegion] = useState("Remote");
  const [activityStatus, setActivityStatus] = useState("Active");

  const handleCountryChange = (selectedCountry: string) => {
    setCountry(selectedCountry);
    const newLoc = formatLocation(address, selectedCountry);
    setLocation(newLoc);

    const inferredRegion = getRegionForCountry(selectedCountry);
    if (inferredRegion) {
      setHqRegion(inferredRegion);
    }
  };

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    const newLoc = formatLocation(newAddress, country);
    setLocation(newLoc);
  };

  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [extraLinks, setExtraLinks] = useState<SocialLink[]>([]);
  const [isNonprofit, setIsNonprofit] = useState(false);
  const [partnerEmails, setPartnerEmails] = useState("");

  // Industry taxonomy state
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [industriesOpen, setIndustriesOpen] = useState(false);
  const [industrySearch, setIndustrySearch] = useState("");

  const [founders, setFounders] = useState<Founder[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [uploadingFounderIndex, setUploadingFounderIndex] = useState<number | null>(null);

  function goToStep(step: StepId) {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleFounderPhotoUpload(file: File, index: number) {
    if (file.size > 5 * 1024 * 1024) {
      alert("Founder photo must be 5MB or smaller.");
      return;
    }
    setUploadingFounderIndex(index);
    try {
      const processed = await processSquareImage(file, 400, "cover");
      const supabase = createBrowserClient();
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) throw new Error("Please log in to upload photos.");

      const formData = new FormData();
      formData.append("file", processed);
      formData.append("folder", "founders");

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const resData = await res.json();
      if (!res.ok || !resData.publicUrl) {
        throw new Error(resData.error || "Failed to upload photo.");
      }

      setFounders((prev) =>
        prev.map((f, i) => (i === index ? { ...f, photo_url: resData.publicUrl } : f))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setUploadingFounderIndex(null);
    }
  }

  async function handleLogoUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      alert("Company logo must be 5MB or smaller.");
      return;
    }
    setUploadingLogo(true);
    try {
      const processed = await processSquareImage(file, 512, "contain_auto");
      const supabase = createBrowserClient();
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) throw new Error("Please log in to upload logos.");

      const formData = new FormData();
      formData.append("file", processed);
      formData.append("folder", "logos");

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const resData = await res.json();
      if (!res.ok || !resData.publicUrl) {
        throw new Error(resData.error || "Failed to upload logo.");
      }

      setLogoUrl(resData.publicUrl);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload logo.");
    } finally {
      setUploadingLogo(false);
    }
  }

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
    setSelectedIndustries((prev) => {
      if (prev.includes(ind)) {
        return prev.filter((i) => i !== ind);
      }
      if (prev.length >= 3) {
        setError("You can select up to 3 industries.");
        return prev;
      }
      setError(null);
      return [...prev, ind];
    });
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

      const userEmail = (user.email ?? "").toLowerCase();
      const partnerEmailsList: string[] = Array.isArray(data.partner_emails)
        ? data.partner_emails.map((e: unknown) => String(e).toLowerCase())
        : [];
      const hasAccess =
        data.user_id === user.id ||
        data.email?.toLowerCase() === userEmail ||
        partnerEmailsList.includes(userEmail);

      if (!hasAccess) {
        setError("You do not have permission to edit this company.");
        setLoading(false);
        return;
      }

      setCompany(data as Company);
      setCompanyName(data.company_name || "");
      setInitialCompanyName(data.company_name || "");
      setLogoUrl(data.logo_url || null);
      setPartnerEmails(partnerEmailsList.join(", "));
      setPitch(data.pitch || "");
      setDescription(data.description || "");
      setWebsiteUrl(data.website_url || "");
      setInitialWebsiteUrl(data.website_url || "");
      setLocation(data.location || "");
      const parsedLoc = parseLocation(data.location || "");
      setCountry(parsedLoc.country);
      setAddress(parsedLoc.address);
      setFoundedYear(data.founded_year || "");
      setTeamSize(data.team_size || "");
      setHqRegion(data.hq_region || "Remote");
      setActivityStatus(data.activity_status || "Active");
      setSelectedIndustries(Array.isArray(data.industries) ? data.industries : []);
      setLinkedinUrl(data.linkedin_url || "");
      setTwitterUrl(data.twitter_url || "");
      setExtraLinks(Array.isArray(data.extra_links) ? data.extra_links : []);
      setIsNonprofit(Boolean(data.is_nonprofit));
      setFounders(data.founders || []);
      setJobs(data.jobs || []);
      setLoading(false);
    }

    loadCompany();
  }, [slug]);

  async function handleSubmit(e?: FormEvent<HTMLFormElement>, confirmedReset = false) {
    if (e) e.preventDefault();
    setError(null);

    const upvotesCount = Number(company?.upvotes_count) || 0;
    const cleanUrl = (u: string) =>
      u.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
    const isNameChanged =
      Boolean(initialCompanyName) &&
      companyName.trim().toLowerCase() !== initialCompanyName.trim().toLowerCase();
    const isUrlChanged =
      Boolean(initialWebsiteUrl) &&
      cleanUrl(websiteUrl) !== cleanUrl(initialWebsiteUrl);
    const willTriggerReset = upvotesCount >= 25 && (isNameChanged || isUrlChanged);

    if (willTriggerReset && !confirmedReset) {
      setShowResetWarningModal(true);
      return;
    }

    // Basic Company validation
    if (!companyName.trim() || companyName.trim().length < 2) {
      if (currentStep !== "all") goToStep("company");
      setError("Company name must be at least 2 characters.");
      return;
    }
    if (!pitch.trim() || pitch.trim().length < 3) {
      if (currentStep !== "all") goToStep("company");
      setError("One-line pitch must be at least 3 characters.");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      if (currentStep !== "all") goToStep("company");
      setError("About the company must be at least 10 characters.");
      return;
    }
    if (!websiteUrl.trim() || !isValidUrl(websiteUrl)) {
      if (currentStep !== "all") goToStep("company");
      setError("Please enter a valid website URL (e.g. https://example.com).");
      return;
    }
    if (selectedIndustries.length === 0) {
      if (currentStep !== "all") goToStep("company");
      setError("Please select at least one industry for your company.");
      return;
    }
    if (selectedIndustries.length > 3) {
      if (currentStep !== "all") goToStep("company");
      setError("You can select at most 3 industries.");
      return;
    }

    // Clean up empty founders: keep only founders with non-empty name
    const cleanedFounders = founders
      .filter((f) => f.name.trim() !== "")
      .map((f) => ({
        ...f,
        name: f.name.trim(),
        title: f.title.trim() || "Founder",
        bio: f.bio.trim(),
      }));

    for (let i = 0; i < cleanedFounders.length; i++) {
      const f = cleanedFounders[i];
      const num = i + 1;
      if (f.twitter_url && !isValidUrl(f.twitter_url)) {
        if (currentStep !== "all") goToStep("founders");
        setError(`Founder #${num} (${f.name}) Twitter must be a valid URL.`);
        return;
      }
      if (f.linkedin_url && !isValidUrl(f.linkedin_url)) {
        if (currentStep !== "all") goToStep("founders");
        setError(`Founder #${num} (${f.name}) LinkedIn must be a valid URL.`);
        return;
      }
    }

    // Clean up empty jobs: keep only jobs with non-empty title
    const cleanedJobs = jobs
      .filter((j) => j.title.trim() !== "")
      .map((j) => ({
        ...j,
        title: j.title.trim(),
        location: j.location.trim() || "Remote",
      }));

    for (let i = 0; i < cleanedJobs.length; i++) {
      const j = cleanedJobs[i];
      const num = i + 1;
      if (j.apply_url && !isValidUrl(j.apply_url)) {
        if (currentStep !== "all") goToStep("jobs");
        setError(`Job #${num} (${j.title}) Apply URL must be a valid URL.`);
        return;
      }
    }

    // Links validation
    if (linkedinUrl && !isValidUrl(linkedinUrl)) {
      if (currentStep !== "all") goToStep("links");
      setError("Please enter a valid LinkedIn URL.");
      return;
    }
    if (twitterUrl && !isValidUrl(twitterUrl)) {
      if (currentStep !== "all") goToStep("links");
      setError("Please enter a valid Twitter URL.");
      return;
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
        logo_url: logoUrl,
        pitch: pitch.trim(),
        description: description.trim(),
        website_url: websiteUrl.trim(),
        location: (formatLocation(address, country) || location).trim(),
        founded_year: foundedYear.trim(),
        team_size: teamSize.trim(),
        activity_status: activityStatus.trim(),
        hq_region: hqRegion.trim(),
        industries: selectedIndustries,
        linkedin_url: linkedinUrl.trim(),
        twitter_url: twitterUrl.trim(),
        primary_partner: company?.primary_partner || "You",
        is_nonprofit: isNonprofit,
        partner_emails: partnerEmails
          .split(/[\s,]+/)
          .map((e) => e.trim().toLowerCase())
          .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
        founders: cleanedFounders,
        jobs: cleanedJobs,
        extra_links: extraLinks,
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
      }, 1500);
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
    <main className="yc-add-page">
      <div className="yc-page-width">
        <div className="yc-app-shell">
          {/* Top Bar with Back Link */}
          <div className="yc-top-bar" style={{ padding: "16px 20px 0" }}>
            <Link href={`/companies/${slug}`} className="yc-top-back-btn">
              ← Back to {companyName || "Startup"}
            </Link>
          </div>

          {/* Mobile Stepper Header */}
          <div className="yc-mobile-header">
            <div className="yc-mobile-meta" style={{ padding: "0 20px" }}>
              <span className="yc-tagline-sub">{companyName}</span>
              <span className="yc-batch-tag">Edit Mode</span>
            </div>
            <div className="yc-mobile-stepper-wrap" style={{ padding: "0 20px" }}>
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
                    onClick={() => goToStep(s.id)}
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
                  if (stepIndex < STEPS.length - 1) goToStep(STEPS[stepIndex + 1].id);
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
                <h3 className="yc-sidebar-title">{companyName || "Startup"}</h3>
                <span className="yc-sidebar-vintage">Editing Listing</span>
              </div>
              <nav className="yc-sidebar-nav" aria-label="Edit Sections">
                {STEPS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`yc-sidebar-link ${currentStep === s.id ? "is-active" : ""}`}
                    onClick={() => goToStep(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </nav>
              <div style={{ marginTop: "24px" }}>
                <button
                  type="submit"
                  form="edit-company-form"
                  className="yc-btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </aside>

            {/* Main Application Content Area */}
            <main className="yc-app-main">
              {error ? (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "12px 16px", borderRadius: "8px", color: "#dc2626", fontSize: "14px", marginBottom: "16px" }}>
                  {error}
                </div>
              ) : null}
              {success ? (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 16px", borderRadius: "8px", color: "#15803d", fontSize: "14px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>✓ Changes saved successfully! Redirecting...</span>
                  <Link href={`/companies/${slug}`} style={{ textDecoration: "underline", fontWeight: 600, color: "#15803d" }}>
                    View Listing Now ↗
                  </Link>
                </div>
              ) : null}

              <form id="edit-company-form" onSubmit={handleSubmit} noValidate>
                {/* STEP 1: COMPANY */}
                {(currentStep === "company" || currentStep === "all") && (
              <div className="yc-card">
                <div className="yc-section-head">
                  <h2 className="yc-section-title">Company Profile</h2>
                  <p className="yc-section-desc">
                    Tell investors and early adopters what your startup does.
                  </p>
                </div>

                {/* 25+ Upvotes Rule Notice */}
                {(Number(company?.upvotes_count) || 0) >= 25 ? (
                  <div
                    style={{
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      color: "#92400e",
                      fontSize: "13px",
                      lineHeight: "1.5",
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                      marginBottom: "16px",
                    }}
                  >
                    <span style={{ fontSize: "18px", flexShrink: 0 }}>⚠️</span>
                    <div>
                      <strong>25+ Upvotes Locked Fields ({Number(company?.upvotes_count) || 0} upvotes):</strong> Modifying your <strong>Company Name</strong> or <strong>Website URL</strong> after reaching 25 upvotes will immediately reset your <strong>upvotes, comments, and rank back to zero</strong>. All other fields can be updated safely.
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      color: "#166534",
                      fontSize: "13px",
                      lineHeight: "1.5",
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                      marginBottom: "16px",
                    }}
                  >
                    <span style={{ fontSize: "18px", flexShrink: 0 }}>💡</span>
                    <div>
                      <strong>Important Rule ({Number(company?.upvotes_count) || 0}/25 upvotes):</strong> Please make sure your <strong>Company Name</strong> and <strong>Website URL</strong> are accurate before reaching 25 upvotes. After reaching 25 upvotes, changing either will permanently reset your upvotes, comments, and ranking back to zero.
                    </div>
                  </div>
                )}

                <div className="yc-field-group">
                  <label className="yc-field-label">
                    <span>Company Name <strong className="yc-req">*</strong></span>
                    <input
                      name="company_name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      maxLength={80}
                    />
                    {(Number(company?.upvotes_count) || 0) >= 25 && companyName.trim().toLowerCase() !== (initialCompanyName || "").trim().toLowerCase() && (
                      <span style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px", display: "block", fontWeight: 500 }}>
                        ⚠️ Warning: Changing company name will reset upvotes, comments, and rank to 0!
                      </span>
                    )}
                  </label>

                  <div className="yc-field-label">
                    <span>Company Logo <strong className="yc-req">*</strong></span>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "6px" }}>
                      <div
                        style={{
                          width: 68,
                          height: 68,
                          borderRadius: 14,
                          overflow: "hidden",
                          backgroundColor: "#fff",
                          border: "1px solid rgba(0,0,0,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        }}
                      >
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontSize: "26px", fontWeight: 700, color: "#666" }}>
                            {companyName ? companyName.charAt(0).toUpperCase() : "?"}
                          </span>
                        )}
                      </div>
                      <label
                        style={{
                          cursor: uploadingLogo ? "wait" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 16px",
                          fontSize: "13px",
                          fontWeight: 500,
                          borderRadius: "6px",
                          background: "#fff",
                          border: "1px solid #d1d5db",
                          color: "#1e293b",
                        }}
                      >
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          style={{ display: "none" }}
                          disabled={uploadingLogo}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleLogoUpload(file);
                          }}
                        />
                        {uploadingLogo ? "Uploading..." : logoUrl ? "Change logo" : "Upload logo"}
                      </label>
                    </div>
                  </div>

                  <label className="yc-field-label">
                    <span>One-line pitch <strong className="yc-req">*</strong></span>
                    <input
                      name="pitch"
                      required
                      maxLength={140}
                      value={pitch}
                      onChange={(e) => setPitch(e.target.value)}
                    />
                    <span className="yc-char-count">{pitch.length}/140</span>
                  </label>

                  <label className="yc-field-label">
                    <span>About the company <strong className="yc-req">*</strong></span>
                    <textarea
                      name="description"
                      required
                      minLength={20}
                      maxLength={2000}
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    <span className="yc-char-count">{description.length}/2000</span>
                  </label>

                  <div className="yc-grid-2">
                    <label className="yc-field-label">
                      <span>Website URL <strong className="yc-req">*</strong></span>
                      <input
                        name="website_url"
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://example.com"
                        required
                      />
                      {(Number(company?.upvotes_count) || 0) >= 25 &&
                        websiteUrl.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "") !==
                        (initialWebsiteUrl || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "") && (
                        <span style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px", display: "block", fontWeight: 500 }}>
                          ⚠️ Warning: Changing website URL will reset upvotes, comments, and rank to 0!
                        </span>
                      )}
                    </label>
                    <div className="yc-field-label">
                      <span>Country <strong className="yc-req">*</strong></span>
                      <CountryPicker
                        id="edit-field-country"
                        name="country"
                        value={country}
                        onChange={handleCountryChange}
                      />
                    </div>
                  </div>

                  <div className="yc-grid-2">
                    <label className="yc-field-label">
                      <span>Address / City (Optional)</span>
                      <input
                        name="address"
                        value={address}
                        onChange={(e) => handleAddressChange(e.target.value)}
                        placeholder="e.g. San Francisco, CA or Bengaluru"
                      />
                    </label>
                    <label className="yc-field-label">
                      <span>HQ Region <strong className="yc-req">*</strong></span>
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
                  </div>

                  <div className="yc-grid-2">
                    <label className="yc-field-label">
                      <span>Founded year <strong className="yc-req">*</strong></span>
                      <input
                        name="founded_year"
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        value={foundedYear}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, "").slice(0, 4);
                          setFoundedYear(cleaned);
                        }}
                        placeholder="2024"
                        required
                      />
                    </label>
                    <label className="yc-field-label">
                      <span>Team size <strong className="yc-req">*</strong></span>
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

                  <div className="yc-grid-2">
                    <label className="yc-field-label">
                      <span>Status <strong className="yc-req">*</strong></span>
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
                      <div style={{ marginTop: "6px" }}>
                        <ActivityStatusBadge status={activityStatus} />
                      </div>
                    </label>

                    <div className="yc-field-label">
                      <span>Industries <strong className="yc-req">*</strong> (select 1 to 3)</span>
                      <div style={{ position: "relative" }}>
                        <button
                          type="button"
                          onClick={() => setIndustriesOpen(!industriesOpen)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 14px",
                            border: "1px solid #d4d4cd",
                            borderRadius: "4px",
                            background: "#fff",
                            cursor: "pointer",
                            fontSize: "14px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {selectedIndustries.length > 0
                              ? selectedIndustries.join(", ")
                              : "Select industries..."}
                          </span>
                          <span>{industriesOpen ? "▲" : "▼"}</span>
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
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              maxHeight: "260px",
                              overflowY: "auto",
                              zIndex: 30,
                              padding: "12px",
                              borderRadius: "8px",
                              marginTop: "4px",
                            }}
                          >
                            <input
                              type="text"
                              placeholder="Search industries (e.g. Fintech, AI, SaaS)..."
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
                                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
                                    <input
                                      type="checkbox"
                                      checked={selectedIndustries.includes(parent.name)}
                                      onChange={() => toggleIndustry(parent.name)}
                                    />
                                    {parent.name}
                                  </label>
                                  {parent.subcategories && parent.subcategories.length > 0 ? (
                                    <div style={{ marginLeft: "24px", marginTop: "6px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
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
                  </div>
                </div>

                {currentStep !== "all" && (
                  <div className="yc-bottom-actions">
                    <div></div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <button type="submit" className="yc-btn-primary" disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button type="button" className="yc-btn-secondary" onClick={() => goToStep("founders")}>
                        Next: Founders →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: FOUNDERS */}
            {(currentStep === "founders" || currentStep === "all") && (
              <div className="yc-card">
                <div className="yc-section-head">
                  <h2 className="yc-section-title">Active Founders</h2>
                  <p className="yc-section-desc">
                    Add profiles, photos, titles, and backgrounds for each co-founder.
                  </p>
                </div>

                {founders.map((founder, idx) => (
                  <div className="yc-box" key={idx} style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <strong style={{ fontSize: "16px" }}>Founder {idx + 1}</strong>
                      {founders.length > 1 ? (
                        <button
                          type="button"
                          className="ghost-btn"
                          style={{ color: "#dc2626", borderColor: "#fca5a5", height: "30px", fontSize: "12px" }}
                          onClick={() => setFounders(founders.filter((_, i) => i !== idx))}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>

                    <div className="yc-field-group">
                      <label className="yc-field-label">
                        <span>Name <strong className="yc-req">*</strong></span>
                        <input
                          value={founder.name}
                          onChange={(e) => {
                            setFounders(founders.map((f, i) => (i === idx ? { ...f, name: e.target.value } : f)));
                          }}
                          required
                        />
                      </label>

                      <div className="yc-field-label">
                        <span>Profile Photo (Optional)</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "6px" }}>
                          <div
                            style={{
                              width: 60,
                              height: 60,
                              borderRadius: "50%",
                              overflow: "hidden",
                              backgroundColor: "#f1f5f9",
                              border: "1.5px solid #d1d5db",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {founder.photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={founder.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <svg style={{ width: 26, height: 26, color: "#94a3b8" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                            )}
                          </div>

                          <label
                            style={{
                              cursor: uploadingFounderIndex === idx ? "wait" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "6px 14px",
                              fontSize: "13px",
                              fontWeight: 500,
                              borderRadius: "6px",
                              backgroundColor: "#fff",
                              border: "1px solid #d1d5db",
                              color: "#1e293b",
                            }}
                          >
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/webp"
                              style={{ display: "none" }}
                              disabled={uploadingFounderIndex === idx}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFounderPhotoUpload(file, idx);
                              }}
                            />
                            {uploadingFounderIndex === idx ? "Uploading..." : founder.photo_url ? "Change photo" : "Upload photo"}
                          </label>
                        </div>
                      </div>

                      <div className="yc-grid-2">
                        <label className="yc-field-label">
                          <span>Title / Role <strong className="yc-req">*</strong></span>
                          <input
                            value={founder.title}
                            placeholder="Co-founder & CEO"
                            onChange={(e) => {
                              setFounders(founders.map((f, i) => (i === idx ? { ...f, title: e.target.value } : f)));
                            }}
                            required
                          />
                        </label>
                        <label className="yc-field-label">
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

                      <label className="yc-field-label">
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

                      <label className="yc-field-label">
                        <span>Bio & Background <strong className="yc-req">*</strong> (min 10 chars)</span>
                        <textarea
                          rows={3}
                          value={founder.bio}
                          onChange={(e) => {
                            setFounders(founders.map((f, i) => (i === idx ? { ...f, bio: e.target.value } : f)));
                          }}
                          required
                          minLength={10}
                        />
                      </label>
                    </div>
                  </div>
                ))}

                {founders.length < 4 ? (
                  <button
                    type="button"
                    className="yc-btn-secondary"
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
                    style={{ marginBottom: "20px" }}
                  >
                    + Add another founder
                  </button>
                ) : null}

                {currentStep !== "all" && (
                  <div className="yc-bottom-actions">
                    <button type="button" className="yc-btn-secondary" onClick={() => goToStep("company")}>
                      ← Back to Company
                    </button>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <button type="submit" className="yc-btn-primary" disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button type="button" className="yc-btn-secondary" onClick={() => goToStep("jobs")}>
                        Next: Jobs →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: JOBS */}
            {(currentStep === "jobs" || currentStep === "all") && (
              <div className="yc-card">
                <div className="yc-section-head">
                  <h2 className="yc-section-title">Open Job Roles (Optional)</h2>
                  <p className="yc-section-desc">
                    Hiring? Showcase open roles on the directory and startup jobs board.
                  </p>
                </div>

                {jobs.map((job, idx) => (
                  <div className="yc-box" key={idx} style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <strong style={{ fontSize: "16px" }}>Job Role {idx + 1}</strong>
                      <button
                        type="button"
                        className="ghost-btn"
                        style={{ color: "#dc2626", borderColor: "#fca5a5", height: "30px", fontSize: "12px" }}
                        onClick={() => setJobs(jobs.filter((_, i) => i !== idx))}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="yc-field-group">
                      <label className="yc-field-label">
                        <span>Job Title <strong className="yc-req">*</strong></span>
                        <input
                          value={job.title}
                          placeholder="e.g. Founding Fullstack Engineer"
                          onChange={(e) => {
                            setJobs(jobs.map((j, i) => (i === idx ? { ...j, title: e.target.value } : j)));
                          }}
                          required
                        />
                      </label>

                      <div className="yc-grid-2">
                        <label className="yc-field-label">
                          <span>Location <strong className="yc-req">*</strong></span>
                          <input
                            value={job.location}
                            placeholder="Remote or San Francisco, CA"
                            onChange={(e) => {
                              setJobs(jobs.map((j, i) => (i === idx ? { ...j, location: e.target.value } : j)));
                            }}
                            required
                          />
                        </label>
                        <label className="yc-field-label">
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

                      <div className="yc-grid-2">
                        <label className="yc-field-label">
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
                        <label className="yc-field-label">
                          <span>Experience Level</span>
                          <input
                            type="text"
                            placeholder="Mid-Senior (3+ yrs)"
                            value={job.experience}
                            onChange={(e) => {
                              setJobs(jobs.map((j, i) => (i === idx ? { ...j, experience: e.target.value } : j)));
                            }}
                          />
                        </label>
                      </div>

                      <label className="yc-field-label">
                        <span>Apply URL</span>
                        <input
                          type="url"
                          placeholder="https://company.com/careers/role or mailto:jobs@company.com"
                          value={job.apply_url}
                          onChange={(e) => {
                            setJobs(jobs.map((j, i) => (i === idx ? { ...j, apply_url: e.target.value } : j)));
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ))}

                {jobs.length < 6 ? (
                  <button
                    type="button"
                    className="yc-btn-secondary"
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
                    style={{ marginBottom: "20px" }}
                  >
                    + Add a job opening
                  </button>
                ) : null}

                {currentStep !== "all" && (
                  <div className="yc-bottom-actions">
                    <button type="button" className="yc-btn-secondary" onClick={() => goToStep("founders")}>
                      ← Back to Founders
                    </button>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <button type="submit" className="yc-btn-primary" disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button type="button" className="yc-btn-secondary" onClick={() => goToStep("links")}>
                        Next: Links & Team →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: LINKS & TEAM */}
            {(currentStep === "links" || currentStep === "all") && (
              <div className="yc-card">
                <div className="yc-section-head">
                  <h2 className="yc-section-title">Links, Socials & Team Access</h2>
                  <p className="yc-section-desc">
                    Social profiles, partner access emails, and nonprofit status.
                  </p>
                </div>

                <div className="yc-field-group">
                  <div className="yc-grid-2">
                    <label className="yc-field-label">
                      <span>Company LinkedIn (URL)</span>
                      <input
                        name="linkedin_url"
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/company/acme"
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
                      />
                    </label>
                  </div>

                  <SocialLinksEditor links={extraLinks} onChange={setExtraLinks} />

                  <label className="yc-checkbox-row">
                    <input
                      name="is_nonprofit"
                      type="checkbox"
                      checked={isNonprofit}
                      onChange={(e) => setIsNonprofit(e.target.checked)}
                    />
                    <span>This startup is a registered nonprofit (501(c)(3) or equivalent)</span>
                  </label>

                  <label className="yc-field-label" style={{ marginTop: "12px" }}>
                    <span>Partner / Co-founder Emails (Optional)</span>
                    <input
                      name="partner_emails"
                      value={partnerEmails}
                      onChange={(e) => setPartnerEmails(e.target.value)}
                      placeholder="partner1@example.com, partner2@example.com"
                    />
                    <span style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px", display: "block" }}>
                      Add comma-separated emails. Anyone listed here can log into WhyAlligator with their account to access and edit this listing.
                    </span>
                  </label>
                </div>

                {currentStep !== "all" && (
                  <div className="yc-bottom-actions">
                    <button type="button" className="yc-btn-secondary" onClick={() => goToStep("jobs")}>
                      ← Back to Jobs
                    </button>
                    <button type="submit" className="yc-btn-primary" disabled={saving}>
                      {saving ? "Saving changes..." : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {currentStep === "all" && (
              <div className="yc-bottom-actions" style={{ justifyContent: "center", marginTop: "32px", padding: "24px 0" }}>
                <button
                  type="submit"
                  className="yc-btn-primary"
                  style={{ minWidth: "240px", fontSize: "16px", padding: "12px 32px" }}
                  disabled={saving}
                >
                  {saving ? "Saving changes..." : "Save All Changes"}
                </button>
              </div>
            )}
          </form>
        </main>
      </div>
    </div>
  </div>

  {/* 25+ Upvotes Reset Confirmation Modal */}
  {showResetWarningModal && (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={() => setShowResetWarningModal(false)}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          maxWidth: "480px",
          width: "100%",
          padding: "24px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
          textAlign: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "#fee2e2",
            color: "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            margin: "0 auto 16px",
          }}
        >
          ⚠️
        </div>
        <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
          Warning: 25+ Upvotes Reset
        </h3>
        <p style={{ fontSize: "14px", color: "#4b5563", lineHeight: 1.5, margin: "0 0 16px" }}>
          Your startup currently has <strong>{Number(company?.upvotes_count) || 0} upvotes</strong>.
        </p>
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "12px 14px",
            color: "#991b1b",
            fontSize: "13px",
            lineHeight: 1.5,
            marginBottom: "20px",
            textAlign: "left",
          }}
        >
          Because your startup reached 25 upvotes, saving changes to your <strong>Company Name</strong> or <strong>Website URL</strong> will permanently reset:
          <ul style={{ margin: "8px 0 0", paddingLeft: "20px" }}>
            <li><strong>Upvotes:</strong> will be reset back to 0</li>
            <li><strong>Comments:</strong> will be deleted / reset back to 0</li>
            <li><strong>Rank:</strong> will drop back to zero</li>
          </ul>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={() => {
              setCompanyName(initialCompanyName);
              setWebsiteUrl(initialWebsiteUrl);
              setShowResetWarningModal(false);
            }}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: "#f3f4f6",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Cancel &amp; Keep Original
          </button>
          <button
            type="button"
            onClick={() => {
              setShowResetWarningModal(false);
              handleSubmit(undefined, true);
            }}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: "#dc2626",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Yes, Reset &amp; Save
          </button>
        </div>
      </div>
    </div>
  )}
</main>
  );
}

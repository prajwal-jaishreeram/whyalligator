"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";

type FounderDraft = {
  name: string;
  title: string;
  bio: string;
  twitter: string;
  linkedin: string;
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
});

const emptyJob = (): JobDraft => ({
  title: "",
  location: "",
  salary: "",
  equity: "",
  experience: "",
  apply_url: "",
});

export function AddStartupForm() {
  const formRef = useRef<HTMLFormElement>(null);
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
  const [batch, setBatch] = useState("");
  const [activityStatus, setActivityStatus] = useState("Active");
  const [industries, setIndustries] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [isNonprofit, setIsNonprofit] = useState(false);

  // Founders state
  const [founders, setFounders] = useState<FounderDraft[]>([emptyFounder()]);
  const [expandedFounder, setExpandedFounder] = useState<number | null>(0);

  // Jobs state
  const [jobs, setJobs] = useState<JobDraft[]>([]);

  // Checkout / Submit state
  const [email, setEmail] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);

  function validateStep(step: StepId): boolean {
    setError(null);
    if (step === "company") {
      if (!companyName.trim()) {
        setError("Please enter your company name.");
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
      if (!websiteUrl.trim()) {
        setError("Please enter your company website URL.");
        return false;
      }
    } else if (step === "founders") {
      const first = founders[0];
      if (!first || !first.name.trim()) {
        setError("Please add at least one founder name.");
        return false;
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

    if (!agreedToTerms) {
      setError("Please check the box agreeing to the Terms of Use and Privacy Policy before submitting.");
      return;
    }

    if (!email.trim()) {
      setError("Please provide a founder email address.");
      return;
    }

    if (!companyName.trim()) {
      setError("Please provide a company name in the Company step.");
      goToStep("company");
      return;
    }

    setPending(true);
    const data = new FormData(event.currentTarget);
    data.set("founder_count", String(founders.length));
    data.set("job_count", String(jobs.length));

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

  return (
    <form ref={formRef} className="yc-app-shell" onSubmit={onSubmit}>
      {/* Top Header Row - Back button only visible when stepIndex > 0 */}
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
          <span className="yc-batch-tag">Winter 2026</span>
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
            <span className="yc-sidebar-vintage">Winter 2026</span>
          </div>
          <nav className="yc-sidebar-nav" aria-label="Application Steps">
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
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    inputMode="url"
                  />
                </label>
                <label className="yc-field-label">
                  <span>Location</span>
                  <input
                    name="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="San Francisco, CA or Remote"
                  />
                </label>
              </div>

              <div className="yc-grid-2">
                <label className="yc-field-label">
                  <span>Founded year</span>
                  <input
                    name="founded_year"
                    value={foundedYear}
                    onChange={(e) => setFoundedYear(e.target.value)}
                    placeholder="2026"
                  />
                </label>
                <label className="yc-field-label">
                  <span>Team size</span>
                  <input
                    name="team_size"
                    type="number"
                    min="1"
                    max="10000"
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    placeholder="3"
                  />
                </label>
              </div>

              <div className="yc-grid-2">
                <label className="yc-field-label">
                  <span>HQ region</span>
                  <select
                    name="hq_region"
                    value={hqRegion}
                    onChange={(e) => setHqRegion(e.target.value)}
                  >
                    <option>Americas / Canada</option>
                    <option>Europe</option>
                    <option>South Asia</option>
                    <option>Southeast Asia</option>
                    <option>East Asia</option>
                    <option>Middle East and North Africa</option>
                    <option>Latin America</option>
                    <option>Africa</option>
                    <option>Oceania</option>
                    <option>Remote</option>
                  </select>
                </label>
                <label className="yc-field-label">
                  <span>Status</span>
                  <select
                    name="activity_status"
                    value={activityStatus}
                    onChange={(e) => setActivityStatus(e.target.value)}
                  >
                    <option>Active</option>
                    <option>Stealth</option>
                    <option>Public</option>
                    <option>Acquired</option>
                  </select>
                </label>
              </div>

              <div className="yc-grid-2">
                <label className="yc-field-label">
                  <span>Batch / vintage</span>
                  <input
                    name="batch"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    placeholder="Batch 1 (auto-calculated if blank)"
                  />
                </label>
                <label className="yc-field-label">
                  <span>Company logo <strong className="req">*</strong></span>
                  <input name="logo" type="file" accept="image/*" />
                </label>
              </div>

              <label className="yc-field-label">
                <span>Industries</span>
                <input
                  name="industries"
                  value={industries}
                  onChange={(e) => setIndustries(e.target.value)}
                  placeholder="AI, B2B, SaaS, Fintech"
                />
                <span className="char-count">Comma-separated, matching directory filter taxonomy</span>
              </label>

              <div className="yc-grid-2">
                <label className="yc-field-label">
                  <span>Company LinkedIn</span>
                  <input
                    name="linkedin_url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/company/..."
                  />
                </label>
                <label className="yc-field-label">
                  <span>Company X / Twitter</span>
                  <input
                    name="twitter_url"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    placeholder="https://x.com/..."
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

            <div className="yc-founders-list">
              {founders.map((founder, index) => {
                const isComplete = founder.name.trim().length > 0;
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
                            Profile complete
                          </span>
                        ) : null}
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
                          {isExpanded ? "Close" : "Edit profile →"}
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
                            value={founder.name}
                            onChange={(e) =>
                              setFounders(updateAt(founders, index, { name: e.target.value }))
                            }
                            placeholder="Full name"
                          />
                        </label>

                        <label className="yc-field-label">
                          <span>Title / Role</span>
                          <input
                            name={`founder_title_${index}`}
                            placeholder="Founder / CEO"
                            value={founder.title}
                            onChange={(e) =>
                              setFounders(updateAt(founders, index, { title: e.target.value }))
                            }
                          />
                        </label>

                        <label className="yc-field-label">
                          <span>Bio & Background</span>
                          <textarea
                            name={`founder_bio_${index}`}
                            rows={3}
                            placeholder="Brief summary of background, previous startups, or school"
                            value={founder.bio}
                            onChange={(e) =>
                              setFounders(updateAt(founders, index, { bio: e.target.value }))
                            }
                          />
                        </label>

                        <label className="yc-field-label">
                          <span>Founder Photo</span>
                          <input name={`founder_photo_${index}`} type="file" accept="image/*" />
                        </label>

                        <div className="yc-grid-2">
                          <label className="yc-field-label">
                            <span>X / Twitter</span>
                            <input
                              name={`founder_twitter_${index}`}
                              placeholder="https://x.com/username"
                              value={founder.twitter}
                              onChange={(e) =>
                                setFounders(updateAt(founders, index, { twitter: e.target.value }))
                              }
                            />
                          </label>
                          <label className="yc-field-label">
                            <span>LinkedIn</span>
                            <input
                              name={`founder_linkedin_${index}`}
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
                  + Add a co-founder
                </button>
              ) : null}
            </div>
          </div>

          {/* STEP 3: JOBS (OPTIONAL) */}
          <div className={`yc-step-content ${currentStep === "jobs" ? "is-visible" : "is-hidden"}`}>
            <h2 className="yc-section-title">Hiring & Open Roles (Optional)</h2>
            <p className="yc-section-subtitle">
              Open roles will appear on your profile card and the WhyAlligator Jobs Board.
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
                    <span>Job Title</span>
                    <input
                      name={`job_title_${index}`}
                      value={job.title}
                      placeholder="Founding Full-Stack Engineer"
                      onChange={(e) => setJobs(updateAt(jobs, index, { title: e.target.value }))}
                    />
                  </label>
                  <div className="yc-grid-2">
                    <label className="yc-field-label">
                      <span>Location</span>
                      <input
                        name={`job_location_${index}`}
                        placeholder="San Francisco or Remote"
                        value={job.location}
                        onChange={(e) => setJobs(updateAt(jobs, index, { location: e.target.value }))}
                      />
                    </label>
                    <label className="yc-field-label">
                      <span>Salary</span>
                      <input
                        name={`job_salary_${index}`}
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
                        placeholder="0.5% - 2.0%"
                        value={job.equity}
                        onChange={(e) => setJobs(updateAt(jobs, index, { equity: e.target.value }))}
                      />
                    </label>
                    <label className="yc-field-label">
                      <span>Experience</span>
                      <input
                        name={`job_experience_${index}`}
                        placeholder="3+ years"
                        value={job.experience}
                        onChange={(e) => setJobs(updateAt(jobs, index, { experience: e.target.value }))}
                      />
                    </label>
                  </div>
                  <label className="yc-field-label">
                    <span>Apply URL</span>
                    <input
                      name={`job_apply_url_${index}`}
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
                  + Add a job role
                </button>
              ) : null}
            </div>
          </div>

          {/* STEP 4: REVIEW & SUBMIT */}
          <div className={`yc-step-content ${currentStep === "submit" ? "is-visible" : "is-hidden"}`}>
            <h2 className="yc-section-title">Review & Submit</h2>
            <p className="yc-section-subtitle">
              Your company listing will go live immediately on WhyAlligator once payment of $20 clears.
            </p>

            <div className="yc-review-box">
              <h3 className="yc-review-title">Application Summary</h3>
              <div className="yc-review-row">
                <span className="yc-review-label">Company:</span>
                <strong>{companyName || "Not provided (please fill in Company step)"}</strong>
              </div>
              <div className="yc-review-row">
                <span className="yc-review-label">Pitch:</span>
                <span>{pitch || "Not provided"}</span>
              </div>
              <div className="yc-review-row">
                <span className="yc-review-label">Website:</span>
                <span>{websiteUrl || "Not provided"}</span>
              </div>
              <div className="yc-review-row">
                <span className="yc-review-label">Location:</span>
                <span>{location || "Not provided"}</span>
              </div>
              <div className="yc-review-row">
                <span className="yc-review-label">Founders:</span>
                <span>{founders.filter((f) => f.name.trim()).map((f) => f.name).join(", ") || "1 founder"}</span>
              </div>
              {jobs.length > 0 ? (
                <div className="yc-review-row">
                  <span className="yc-review-label">Jobs:</span>
                  <span>{jobs.length} listed</span>
                </div>
              ) : null}
            </div>

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
                  You can use this email to log in and edit your startup listing anytime.
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
                Flat $20, one time. No recurring charges. Your startup page goes live as soon as Stripe clears. Newest first, no ranking.
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
            <button
              type="button"
              className="yc-save-btn"
              onClick={() => {
                alert("Draft saved locally.");
              }}
            >
              Save changes
            </button>

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
                {pending ? "Preparing checkout…" : "Submit application"}
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



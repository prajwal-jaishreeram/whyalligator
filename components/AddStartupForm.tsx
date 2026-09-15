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

  // Form fields state
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
  const [primaryPartner, setPrimaryPartner] = useState("");
  const [email, setEmail] = useState("");

  const [founders, setFounders] = useState<FounderDraft[]>([emptyFounder()]);
  const [expandedFounder, setExpandedFounder] = useState<number | null>(0);
  const [techWorkNotes, setTechWorkNotes] = useState("");
  const [lookingForCofounder, setLookingForCofounder] = useState("No");

  const [jobs, setJobs] = useState<JobDraft[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);

  function validateStep(step: StepId): boolean {
    setError(null);
    if (step === "company") {
      if (!companyName.trim()) {
        setError("Please enter a company name.");
        return false;
      }
      if (!pitch.trim() || pitch.length < 4) {
        setError("Please enter a one-line pitch (at least 4 characters).");
        return false;
      }
      if (!description.trim() || description.length < 20) {
        setError("Please enter an about description (at least 20 characters).");
        return false;
      }
      if (!websiteUrl.trim()) {
        setError("Please enter your website URL.");
        return false;
      }
      if (!location.trim()) {
        setError("Please enter your company location.");
        return false;
      }
    } else if (step === "founders") {
      const firstFounder = founders[0];
      if (!firstFounder || !firstFounder.name.trim()) {
        setError("Please provide at least one founder's name.");
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
      {/* App Header Bar for Mobile */}
      <div className="yc-mobile-header">
        <div className="yc-mobile-meta">
          <span className="yc-tagline-sub">WhyAlligator Application</span>
          <span className="yc-batch-tag">Winter 2026</span>
        </div>
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
      </div>

      <div className="yc-app-body">
        {/* Left Vertical Stepper (Desktop) */}
        <aside className="yc-app-sidebar">
          <div className="yc-sidebar-brand">
            <h3 className="yc-sidebar-title">YC Application</h3>
            <span className="yc-sidebar-vintage">Winter 2026</span>
          </div>
          <nav className="yc-sidebar-nav" aria-label="Form Steps">
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

        {/* Main Step Content */}
        <main className="yc-app-main">
          {error ? <div className="yc-error-banner">{error}</div> : null}

          {/* STEP 1: COMPANY */}
          <div className={`yc-step-section ${currentStep === "company" ? "is-visible" : "is-hidden"}`}>
            <h2 className="yc-section-heading">Company</h2>
            <div className="yc-field-group">
              <label>
                Company name <span className="req">*</span>
                <input
                  name="company_name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  maxLength={80}
                  placeholder="Acme Corp"
                  autoComplete="organization"
                />
              </label>

              <label>
                One-line pitch <span className="req">*</span>
                <input
                  name="pitch"
                  maxLength={140}
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  placeholder="Talk to your computer without talking"
                />
                <span className="char-count">{pitch.length}/140</span>
              </label>

              <label>
                About the company <span className="req">*</span>
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
                <label>
                  Website URL <span className="req">*</span>
                  <input
                    name="website_url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    inputMode="url"
                  />
                </label>
                <label>
                  Location <span className="req">*</span>
                  <input
                    name="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="San Francisco, CA, USA"
                  />
                </label>
              </div>

              <div className="yc-grid-2">
                <label>
                  Founded
                  <input
                    name="founded_year"
                    value={foundedYear}
                    onChange={(e) => setFoundedYear(e.target.value)}
                    placeholder="2026"
                  />
                </label>
                <label>
                  Team size
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
                <label>
                  HQ region
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
                <label>
                  Batch / vintage
                  <input
                    name="batch"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    placeholder="Batch 1 (auto-calculated if blank)"
                  />
                </label>
              </div>

              <div className="yc-grid-2">
                <label>
                  Status
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
                <label>
                  Primary partner
                  <input
                    name="primary_partner"
                    value={primaryPartner}
                    onChange={(e) => setPrimaryPartner(e.target.value)}
                    placeholder="Leave blank and we will put You"
                  />
                </label>
              </div>

              <label>
                Industries
                <input
                  name="industries"
                  value={industries}
                  onChange={(e) => setIndustries(e.target.value)}
                  placeholder="AI, B2B, SaaS, Fintech"
                />
                <span className="char-count">Comma-separated, matching directory filters</span>
              </label>

              <label>
                Company logo <span className="req">*</span>
                <input name="logo" type="file" accept="image/*" />
                <span className="char-count">PNG, JPG, SVG, or WEBP (square works best)</span>
              </label>

              <div className="yc-grid-2">
                <label>
                  Company LinkedIn
                  <input
                    name="linkedin_url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/company/..."
                  />
                </label>
                <label>
                  Company X / Twitter
                  <input
                    name="twitter_url"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    placeholder="https://x.com/..."
                  />
                </label>
              </div>

              <label className="yc-checkbox-card">
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
          <div className={`yc-step-section ${currentStep === "founders" ? "is-visible" : "is-hidden"}`}>
            <h2 className="yc-section-heading">Founders</h2>

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
                            className="yc-remove-founder-btn"
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
                        <label>
                          Founder Name <span className="req">*</span>
                          <input
                            name={`founder_name_${index}`}
                            value={founder.name}
                            onChange={(e) =>
                              setFounders(updateAt(founders, index, { name: e.target.value }))
                            }
                            placeholder="Full name"
                          />
                        </label>
                        <label>
                          Title / Role
                          <input
                            name={`founder_title_${index}`}
                            placeholder="Founder / CEO"
                            value={founder.title}
                            onChange={(e) =>
                              setFounders(updateAt(founders, index, { title: e.target.value }))
                            }
                          />
                        </label>
                        <label>
                          Bio & Background
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
                        <label>
                          Founder Photo
                          <input name={`founder_photo_${index}`} type="file" accept="image/*" />
                        </label>
                        <div className="yc-grid-2">
                          <label>
                            X / Twitter
                            <input
                              name={`founder_twitter_${index}`}
                              placeholder="https://x.com/username"
                              value={founder.twitter}
                              onChange={(e) =>
                                setFounders(updateAt(founders, index, { twitter: e.target.value }))
                              }
                            />
                          </label>
                          <label>
                            LinkedIn
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
                  className="yc-add-founder-btn"
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

            <div className="yc-question-group">
              <label>
                Who writes code, or does other technical work on your product? Was any of it done by a non-founder? Please explain.
                <textarea
                  rows={4}
                  value={techWorkNotes}
                  onChange={(e) => setTechWorkNotes(e.target.value)}
                  placeholder="We write 100% of our code in-house..."
                />
              </label>

              <label>
                Are you looking for a cofounder?
                <select
                  value={lookingForCofounder}
                  onChange={(e) => setLookingForCofounder(e.target.value)}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="Maybe">Maybe</option>
                </select>
              </label>
            </div>
          </div>

          {/* STEP 3: JOBS (OPTIONAL) */}
          <div className={`yc-step-section ${currentStep === "jobs" ? "is-visible" : "is-hidden"}`}>
            <h2 className="yc-section-heading">Jobs (Optional)</h2>
            <p className="yc-section-desc">
              List any open roles at your company. They will appear on both your company page and the WhyAlligator Jobs board.
            </p>

            <div className="yc-jobs-list">
              {jobs.map((job, index) => (
                <div className="yc-job-card" key={index}>
                  <div className="yc-job-card-header">
                    <strong>Job {index + 1}: {job.title || "Untitled Role"}</strong>
                    <button
                      type="button"
                      className="yc-remove-job-btn"
                      onClick={() => setJobs(jobs.filter((_, i) => i !== index))}
                    >
                      ✕ Remove
                    </button>
                  </div>
                  <label>
                    Job Title <span className="req">*</span>
                    <input
                      name={`job_title_${index}`}
                      value={job.title}
                      placeholder="Founding Full-Stack Engineer"
                      onChange={(e) => setJobs(updateAt(jobs, index, { title: e.target.value }))}
                    />
                  </label>
                  <div className="yc-grid-2">
                    <label>
                      Location
                      <input
                        name={`job_location_${index}`}
                        placeholder="San Francisco, CA or Remote"
                        value={job.location}
                        onChange={(e) => setJobs(updateAt(jobs, index, { location: e.target.value }))}
                      />
                    </label>
                    <label>
                      Salary
                      <input
                        name={`job_salary_${index}`}
                        placeholder="$150K - $200K"
                        value={job.salary}
                        onChange={(e) => setJobs(updateAt(jobs, index, { salary: e.target.value }))}
                      />
                    </label>
                  </div>
                  <div className="yc-grid-2">
                    <label>
                      Equity
                      <input
                        name={`job_equity_${index}`}
                        placeholder="0.5% - 2.0%"
                        value={job.equity}
                        onChange={(e) => setJobs(updateAt(jobs, index, { equity: e.target.value }))}
                      />
                    </label>
                    <label>
                      Experience
                      <input
                        name={`job_experience_${index}`}
                        placeholder="3+ years"
                        value={job.experience}
                        onChange={(e) => setJobs(updateAt(jobs, index, { experience: e.target.value }))}
                      />
                    </label>
                  </div>
                  <label>
                    Application URL
                    <input
                      name={`job_apply_url_${index}`}
                      placeholder="https://example.com/careers or mailto:founders@example.com"
                      value={job.apply_url}
                      onChange={(e) => setJobs(updateAt(jobs, index, { apply_url: e.target.value }))}
                    />
                  </label>
                </div>
              ))}

              {jobs.length < 6 ? (
                <button
                  type="button"
                  className="yc-add-founder-btn"
                  onClick={() => setJobs([...jobs, emptyJob()])}
                >
                  + Add a job role
                </button>
              ) : null}
            </div>
          </div>

          {/* STEP 4: REVIEW & SUBMIT */}
          <div className={`yc-step-section ${currentStep === "submit" ? "is-visible" : "is-hidden"}`}>
            <h2 className="yc-section-heading">Review & Submit</h2>
            <p className="yc-section-desc">
              Your company listing will go live immediately once payment of $20 clears.
            </p>

            <div className="yc-review-card">
              <h3 className="yc-review-title">Application Summary</h3>
              <div className="yc-review-row">
                <span className="yc-review-label">Company:</span>
                <strong>{companyName || "Not provided"}</strong>
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
                <span className="yc-review-label">Founders:</span>
                <span>{founders.filter((f) => f.name.trim()).map((f) => f.name).join(", ") || "1 founder"}</span>
              </div>
              {jobs.length > 0 ? (
                <div className="yc-review-row">
                  <span className="yc-review-label">Jobs Listed:</span>
                  <span>{jobs.length} open position{jobs.length > 1 ? "s" : ""}</span>
                </div>
              ) : null}
            </div>

            <div className="yc-checkout-fields">
              <label>
                Founder Email (for listing management & receipt) <span className="req">*</span>
                <input
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="founder@example.com"
                  autoComplete="email"
                />
                <span className="char-count">
                  Use this email to sign in and edit your startup listing anytime.
                </span>
              </label>

              {/* Mandatory Terms & Conditions Checkbox */}
              <div className="yc-terms-box">
                <label className="yc-terms-checkbox">
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
                Flat $20, one time. Your startup goes live in the directory as soon as Stripe clears. Newest first, no ranking.
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
            ) : (
              <span />
            )}
          </div>

          <div className="yc-bottom-right">
            {currentStep !== "submit" ? (
              <>
                <button
                  type="button"
                  className="yc-save-btn"
                  onClick={() => {
                    setError(null);
                    alert("Draft saved locally.");
                  }}
                >
                  Save changes
                </button>
                <button
                  type="button"
                  className="yc-next-btn"
                  onClick={handleNext}
                >
                  Next step ›
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="yc-save-btn"
                  onClick={() => {
                    alert("Draft saved locally.");
                  }}
                >
                  Save changes
                </button>
                <button
                  type="submit"
                  className="yc-submit-btn"
                  disabled={pending || !agreedToTerms}
                >
                  {pending ? "Preparing checkout…" : "Submit application"}
                </button>
              </>
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


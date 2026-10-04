"use client";

import Link from "next/link";
import { FormEvent, useRef, useState, useMemo, useEffect } from "react";
import {
  HQ_REGIONS,
  INDUSTRY_TAXONOMY,
  COUNTRY_LIST,
  getRegionForCountry,
  formatLocation,
  parseLocation,
} from "@/lib/options";
import { createBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import type { SocialLink } from "@/lib/types";
import { processSquareImage } from "@/lib/image-processing";
import CountryPicker from "./CountryPicker";
import SocialLinksEditor from "./SocialLinksEditor";
import { ActivityStatusBadge } from "./ActivityStatusBadge";

function PasswordRequirement({
  met,
  label,
}: {
  met: boolean;
  label: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "12px",
        color: met ? "#16a34a" : "#6b7280",
      }}
    >
      <span style={{ fontSize: "13px" }}>{met ? "✓" : "○"}</span>
      <span>{label}</span>
    </div>
  );
}

const DRAFT_STORAGE_KEY = "whyalligator_listing_draft_v1";

function dataUrlToFile(dataUrl: string, filename: string): File | null {
  try {
    const parts = dataUrl.split(",");
    if (parts.length < 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch {
    return null;
  }
}

type FounderDraft = {
  name: string;
  title: string;
  bio: string;
  twitter: string;
  linkedin: string;
  photoPreview?: string | null;
  photoFile?: File | null;
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
  photoFile: null,
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

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="yc-field-error-msg" role="alert">
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}

export function AddStartupForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState<StepId>("company");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  function clearFieldError(key: string) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  // Company state
  const [companyName, setCompanyName] = useState("");
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
    if (fieldErrors.country) clearFieldError("country");
    if (fieldErrors.location) clearFieldError("location");

    // Automatically select the HQ Region
    const inferredRegion = getRegionForCountry(selectedCountry);
    if (inferredRegion) {
      setHqRegion(inferredRegion);
    }
  };

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    const newLoc = formatLocation(newAddress, country);
    setLocation(newLoc);
    if (fieldErrors.location) clearFieldError("location");
  };
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [extraLinks, setExtraLinks] = useState<SocialLink[]>([]);
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
  const [partnerEmails, setPartnerEmails] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [restoredNotice, setRestoredNotice] = useState(false);

  // Authentication & session state
  const [loggedInUser, setLoggedInUser] = useState<{ id: string; email: string } | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Inline auth for unauthenticated users
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Verification / OTP state
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);

  // Password strength checks
  const hasMinLength = authPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(authPassword);
  const hasLowercase = /[a-z]/.test(authPassword);
  const hasNumber = /[0-9]/.test(authPassword);
  const passwordsMatch = authPassword === authConfirmPassword && authConfirmPassword.length > 0;
  const passwordStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  // Supabase session listener on mount
  useEffect(() => {
    if (!hasSupabaseConfig()) {
      setAuthChecking(false);
      return;
    }
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u?.email) {
        setLoggedInUser({ id: u.id, email: u.email });
        setEmail(u.email);
        setAuthToken(data.session?.access_token ?? null);
      }
      setAuthChecking(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      if (u?.email) {
        setLoggedInUser({ id: u.id, email: u.email });
        setEmail(u.email);
        setAuthToken(session?.access_token ?? null);
        setVerifyingEmail(false);
      } else {
        setLoggedInUser(null);
        setAuthToken(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Restore draft from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        if (parsed.companyName) setCompanyName(parsed.companyName);
        if (parsed.pitch) setPitch(parsed.pitch);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.websiteUrl) setWebsiteUrl(parsed.websiteUrl);
        if (parsed.country) setCountry(parsed.country);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.location) {
          setLocation(parsed.location);
          if (!parsed.country) {
            const detected = parseLocation(parsed.location);
            if (detected.country) setCountry(detected.country);
            if (detected.address) setAddress(detected.address);
          }
        }
        if (parsed.foundedYear) setFoundedYear(String(parsed.foundedYear).slice(0, 4));
        if (parsed.teamSize) setTeamSize(String(parsed.teamSize));
        if (parsed.hqRegion) setHqRegion(parsed.hqRegion);
        if (parsed.activityStatus) setActivityStatus(parsed.activityStatus);
        if (Array.isArray(parsed.selectedIndustries)) setSelectedIndustries(parsed.selectedIndustries);
        if (parsed.linkedinUrl) setLinkedinUrl(parsed.linkedinUrl);
        if (parsed.twitterUrl) setTwitterUrl(parsed.twitterUrl);
        if (Array.isArray(parsed.extraLinks)) setExtraLinks(parsed.extraLinks);
        if (typeof parsed.isNonprofit === "boolean") setIsNonprofit(parsed.isNonprofit);
        if (Array.isArray(parsed.founders) && parsed.founders.length > 0) setFounders(parsed.founders);
        if (Array.isArray(parsed.jobs)) setJobs(parsed.jobs);
        if (parsed.email && !loggedInUser) setEmail(parsed.email);
        if (parsed.partnerEmails) setPartnerEmails(parsed.partnerEmails);
        if (parsed.agreedToTerms) setAgreedToTerms(parsed.agreedToTerms);
        if (parsed.logoPreview) setLogoPreview(parsed.logoPreview);
        setRestoredNotice(true);
      }
    } catch (err) {
      console.error("Failed to restore draft:", err);
    }
  }, [loggedInUser]);

  // Auto-save form draft to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (!companyName && !pitch && !description && !email) return;
        const draft = {
          companyName,
          pitch,
          description,
          websiteUrl,
          country,
          address,
          location,
          foundedYear,
          teamSize,
          hqRegion,
          activityStatus,
          selectedIndustries,
          linkedinUrl,
          twitterUrl,
          extraLinks,
          isNonprofit,
          founders,
          jobs,
          email,
          partnerEmails,
          agreedToTerms,
          logoPreview: logoPreview && logoPreview.startsWith("data:") ? logoPreview : undefined,
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } catch {
        // Ignore storage quota errors
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [
    companyName,
    pitch,
    description,
    websiteUrl,
    country,
    address,
    location,
    foundedYear,
    teamSize,
    hqRegion,
    activityStatus,
    selectedIndustries,
    linkedinUrl,
    twitterUrl,
    extraLinks,
    isNonprofit,
    founders,
    jobs,
    email,
    partnerEmails,
    agreedToTerms,
    logoPreview,
  ]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
    setCompanyName("");
    setPitch("");
    setDescription("");
    setWebsiteUrl("");
    setCountry("");
    setAddress("");
    setLocation("");
    setFoundedYear("");
    setTeamSize("");
    setHqRegion("Remote");
    setActivityStatus("Active");
    setSelectedIndustries([]);
    setLinkedinUrl("");
    setTwitterUrl("");
    setExtraLinks([]);
    setIsNonprofit(false);
    setLogoFile(null);
    setLogoPreview(null);
    setFounders([emptyFounder()]);
    setJobs([]);
    if (!loggedInUser) setEmail("");
    setPartnerEmails("");
    setAgreedToTerms(false);
    setRestoredNotice(false);
    setError(null);
  };

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

  function scrollToElement(el: HTMLElement) {
    const header = document.querySelector(".site-header") as HTMLElement | null;
    const headerHeight = header ? header.offsetHeight : 64;
    const rect = el.getBoundingClientRect();
    const absoluteTop = window.scrollY + rect.top;
    const targetY = Math.max(0, absoluteTop - headerHeight - 24);

    window.scrollTo({
      top: targetY,
      behavior: "smooth",
    });

    setTimeout(() => {
      try {
        el.focus?.({ preventScroll: true });
      } catch {
        // ignore
      }
    }, 200);
  }

  function scrollToErrorField(step: StepId, selector: string) {
    if (currentStep !== step) {
      setCurrentStep(step);
      setTimeout(() => {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el) {
          scrollToElement(el);
        }
      }, 140);
    } else {
      setTimeout(() => {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el) {
          scrollToElement(el);
        }
      }, 60);
    }
  }

  function validateStep(step: StepId): boolean {
    const errors: Record<string, string> = {};
    let firstErrorSelector = "";

    if (step === "company") {
      if (!companyName.trim() || companyName.trim().length < 2) {
        errors.company_name = "Company name must be at least 2 characters.";
        if (!firstErrorSelector) firstErrorSelector = 'input[name="company_name"]';
      }
      if (!pitch.trim() || pitch.length < 4) {
        errors.pitch = "Please enter a one-line pitch (at least 4 characters).";
        if (!firstErrorSelector) firstErrorSelector = 'input[name="pitch"]';
      }
      if (!description.trim() || description.length < 20) {
        errors.description = "Please describe what your company does (at least 20 characters).";
        if (!firstErrorSelector) firstErrorSelector = 'textarea[name="description"]';
      }
      if (!websiteUrl.trim() || !isValidUrl(websiteUrl)) {
        errors.website_url = "Please enter a valid website URL (e.g. https://example.com).";
        if (!firstErrorSelector) firstErrorSelector = 'input[name="website_url"]';
      }
      if (!country.trim()) {
        errors.country = "Please select a country (or Remote).";
        if (!firstErrorSelector) firstErrorSelector = '#field-country';
      }
      const yr = Number(foundedYear);
      const maxYear = new Date().getFullYear() + 2;
      if (!foundedYear || !/^\d{4}$/.test(foundedYear) || yr < 1800 || yr > maxYear) {
        errors.founded_year = "Please enter a valid 4-digit founded year (e.g. 2024).";
        if (!firstErrorSelector) firstErrorSelector = 'input[name="founded_year"]';
      }
      if (!teamSize || parseInt(teamSize, 10) <= 0) {
        errors.team_size = "Please enter a valid team size (at least 1).";
        if (!firstErrorSelector) firstErrorSelector = 'input[name="team_size"]';
      }
      if (!logoFile && !logoPreview) {
        errors.logo = "Company logo is compulsory. Please upload an image logo.";
        if (!firstErrorSelector) firstErrorSelector = '#logo-field-wrap';
      }
      if (selectedIndustries.length === 0) {
        errors.industries = "Please select at least one industry for your company.";
        if (!firstErrorSelector) firstErrorSelector = '#industries-field-wrap';
      } else if (selectedIndustries.length > 3) {
        errors.industries = "You can select at most 3 industries.";
        if (!firstErrorSelector) firstErrorSelector = '#industries-field-wrap';
      }
      if (linkedinUrl && !isValidUrl(linkedinUrl)) {
        errors.linkedin_url = "Please enter a valid LinkedIn URL.";
        if (!firstErrorSelector) firstErrorSelector = 'input[name="linkedin_url"]';
      }
      if (twitterUrl && !isValidUrl(twitterUrl)) {
        errors.twitter_url = "Please enter a valid Twitter/X URL.";
        if (!firstErrorSelector) firstErrorSelector = 'input[name="twitter_url"]';
      }
    } else if (step === "founders") {
      if (founders.length === 0) {
        errors.founder_general = "Please add at least one founder.";
        if (!firstErrorSelector) firstErrorSelector = '.yc-founders-list';
      }
      for (let i = 0; i < founders.length; i++) {
        const f = founders[i];
        const num = i + 1;
        if (!f.name.trim() || f.name.trim().length < 2) {
          errors[`founder_name_${i}`] = `Founder #${num} must have a name (at least 2 characters).`;
          if (!firstErrorSelector) {
            setExpandedFounder(i);
            firstErrorSelector = `input[name="founder_name_${i}"]`;
          }
        }
        if (!f.title.trim() || f.title.trim().length < 2) {
          errors[`founder_title_${i}`] = `Founder #${num} needs a title or role (e.g. Founder & CEO).`;
          if (!firstErrorSelector) {
            setExpandedFounder(i);
            firstErrorSelector = `input[name="founder_title_${i}"]`;
          }
        }
        if (!f.bio.trim() || f.bio.trim().length < 10) {
          errors[`founder_bio_${i}`] = `Founder #${num} bio is compulsory (at least 10 characters).`;
          if (!firstErrorSelector) {
            setExpandedFounder(i);
            firstErrorSelector = `textarea[name="founder_bio_${i}"]`;
          }
        }
        if (f.twitter && !isValidUrl(f.twitter)) {
          errors[`founder_twitter_${i}`] = `Founder #${num} Twitter must be a valid URL.`;
          if (!firstErrorSelector) {
            setExpandedFounder(i);
            firstErrorSelector = `input[name="founder_twitter_${i}"]`;
          }
        }
        if (f.linkedin && !isValidUrl(f.linkedin)) {
          errors[`founder_linkedin_${i}`] = `Founder #${num} LinkedIn must be a valid URL.`;
          if (!firstErrorSelector) {
            setExpandedFounder(i);
            firstErrorSelector = `input[name="founder_linkedin_${i}"]`;
          }
        }
      }
    } else if (step === "jobs") {
      for (let i = 0; i < jobs.length; i++) {
        const j = jobs[i];
        const num = i + 1;
        if (!j.title.trim()) {
          errors[`job_title_${i}`] = `Job #${num} needs a job title.`;
          if (!firstErrorSelector) firstErrorSelector = `input[name="job_title_${i}"]`;
        }
        if (!j.location.trim()) {
          errors[`job_location_${i}`] = `Job #${num} needs a location (e.g. Remote or San Francisco).`;
          if (!firstErrorSelector) firstErrorSelector = `input[name="job_location_${i}"]`;
        }
        if (j.apply_url && !isValidUrl(j.apply_url)) {
          errors[`job_apply_url_${i}`] = `Job #${num} needs a valid Apply URL.`;
          if (!firstErrorSelector) firstErrorSelector = `input[name="job_apply_url_${i}"]`;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(null);
      if (firstErrorSelector) {
        scrollToErrorField(step, firstErrorSelector);
      }
      return false;
    }

    setFieldErrors({});
    setError(null);
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

  async function executeCheckout(
    formElement: HTMLFormElement,
    userId: string | null,
    userEmail: string,
    token: string | null
  ) {
    setPending(true);
    setError(null);

    const data = new FormData(formElement);
    const finalLocation = formatLocation(address, country);
    data.set("location", finalLocation);
    data.set("hq_region", hqRegion);
    data.set("founder_count", String(founders.length));
    data.set("job_count", String(jobs.length));
    data.set("industries", JSON.stringify(selectedIndustries));
    data.set("email", userEmail);
    if (userId) data.set("user_id", userId);
    if (partnerEmails.trim()) data.set("partner_emails", partnerEmails.trim());
    data.set("extra_links", JSON.stringify(extraLinks));

    // Ensure logo file is included even if restored from localStorage draft
    const formLogo = data.get("logo");
    if ((!formLogo || !(formLogo instanceof File) || formLogo.size === 0) && logoPreview && logoPreview.startsWith("data:")) {
      const restoredLogo = dataUrlToFile(logoPreview, "logo.png");
      if (restoredLogo) {
        data.set("logo", restoredLogo);
      }
    }

    // Ensure founder photos are included
    founders.forEach((f, idx) => {
      if (f.photoFile) {
        data.set(`founder_photo_${idx}`, f.photoFile);
      } else {
        const photoField = data.get(`founder_photo_${idx}`);
        if ((!photoField || !(photoField instanceof File) || photoField.size === 0) && f.photoPreview && f.photoPreview.startsWith("data:")) {
          const restoredPhoto = dataUrlToFile(f.photoPreview, `founder_${idx}.png`);
          if (restoredPhoto) {
            data.set(`founder_photo_${idx}`, restoredPhoto);
          }
        }
      }
    });

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers,
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setAuthNotice(null);

    if (!validateStep("company") || !validateStep("founders") || !validateStep("jobs")) {
      return;
    }

    if (!agreedToTerms) {
      setFieldErrors((prev) => ({
        ...prev,
        terms: "Please check the box agreeing to the Terms of Use and Privacy Policy before submitting.",
      }));
      scrollToErrorField("submit", "#field-wrap-terms");
      return;
    }

    // If user is currently in OTP verification stage, trigger OTP verify instead
    if (verifyingEmail) {
      await handleVerifyOtp();
      return;
    }

    let currentUserId = loggedInUser?.id || null;
    let currentUserEmail = (loggedInUser?.email || email).trim();
    let currentToken = authToken;

    // IF NOT LOGGED IN: Authenticate the user first!
    if (!loggedInUser) {
      if (!currentUserEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentUserEmail)) {
        setFieldErrors((prev) => ({
          ...prev,
          email: "Please enter a valid founder email address.",
        }));
        scrollToErrorField("submit", 'input[name="email"]');
        return;
      }

      if (!authPassword || authPassword.length < 6) {
        setFieldErrors((prev) => ({
          ...prev,
          auth_password: "Please enter your password to secure and manage your listing.",
        }));
        scrollToErrorField("submit", 'input[name="auth_password"]');
        return;
      }

      if (authMode === "signup") {
        if (!passwordStrong) {
          setFieldErrors((prev) => ({
            ...prev,
            auth_password: "Password must be at least 8 characters with an uppercase letter, lowercase letter, and number.",
          }));
          scrollToErrorField("submit", 'input[name="auth_password"]');
          return;
        }
        if (authPassword !== authConfirmPassword) {
          setFieldErrors((prev) => ({
            ...prev,
            auth_confirm_password: "Passwords do not match.",
          }));
          scrollToErrorField("submit", 'input[name="auth_confirm_password"]');
          return;
        }
      }

      setPending(true);
      const supabase = createBrowserClient();

      try {
        if (authMode === "signup") {
          const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
            email: currentUserEmail,
            password: authPassword,
          });

          if (signUpErr) {
            if (
              signUpErr.message.toLowerCase().includes("already registered") ||
              signUpErr.message.toLowerCase().includes("already exists")
            ) {
              setAuthMode("login");
              setError("An account with this email already exists. Please enter your password to log in and continue.");
              setPending(false);
              return;
            }
            throw signUpErr;
          }

          if (signUpData.session) {
            // Immediate session
            const u = signUpData.user!;
            setLoggedInUser({ id: u.id, email: u.email! });
            currentUserId = u.id;
            currentUserEmail = u.email!;
            currentToken = signUpData.session.access_token;
            setAuthToken(currentToken);
          } else if (signUpData.user) {
            // Needs verification (OTP code sent by Supabase)
            setVerifyingEmail(true);
            setAuthNotice(`A 6-digit verification code was sent to ${currentUserEmail}. Please enter it below to verify your account and continue.`);
            setPending(false);
            return;
          }
        } else {
          // Login mode
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: currentUserEmail,
            password: authPassword,
          });
          if (signInErr) throw signInErr;
          if (signInData.user && signInData.session) {
            setLoggedInUser({ id: signInData.user.id, email: signInData.user.email! });
            currentUserId = signInData.user.id;
            currentUserEmail = signInData.user.email!;
            currentToken = signInData.session.access_token;
            setAuthToken(currentToken);
          }
        }
      } catch (authErr: unknown) {
        setError(authErr instanceof Error ? authErr.message : "Authentication error.");
        setPending(false);
        return;
      }
    }

    await executeCheckout(event.currentTarget, currentUserId, currentUserEmail, currentToken);
  }

  async function handleVerifyOtp() {
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setError("Please enter the 6-digit verification code from your email.");
      return;
    }
    setOtpVerifying(true);
    setPending(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const currentUserEmail = email.trim();
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: currentUserEmail,
        token: otpCode.trim(),
        type: "signup",
      });

      if (verifyErr) {
        throw verifyErr;
      }

      let userId = data.user?.id || null;
      let token = data.session?.access_token || null;

      if (!token && authPassword) {
        // Sign in to get session token if verifyOtp didn't return one directly
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: currentUserEmail,
          password: authPassword,
        });
        if (signInData.user && signInData.session) {
          userId = signInData.user.id;
          token = signInData.session.access_token;
        }
      }

      if (userId) {
        setLoggedInUser({ id: userId, email: currentUserEmail });
        setAuthToken(token);
        setVerifyingEmail(false);
        setAuthNotice("✓ Email verified successfully! Redirecting to payment...");

        if (formRef.current) {
          await executeCheckout(formRef.current, userId, currentUserEmail, token);
          return;
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed. Please check the code.");
      setPending(false);
      setOtpVerifying(false);
    }
  }

  async function handleResendCode() {
    setError(null);
    try {
      const supabase = createBrowserClient();
      const { error: resendErr } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      });
      if (resendErr) throw resendErr;
      setAuthNotice(`A fresh verification code was sent to ${email.trim()}.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    }
  }

  const toggleIndustry = (ind: string) => {
    setSelectedIndustries((prev) => {
      if (prev.includes(ind)) {
        clearFieldError("industries");
        return prev.filter((i) => i !== ind);
      }
      if (prev.length >= 3) {
        setFieldErrors((curr) => ({
          ...curr,
          industries: "Maximum 3 industries allowed. Remove one before adding another.",
        }));
        return prev;
      }
      clearFieldError("industries");
      return [...prev, ind];
    });
  };

  const handleLogoChange = async (file: File | undefined) => {
    clearFieldError("logo");
    if (file) {
      const processed = await processSquareImage(file, 512, "contain_auto");
      setLogoFile(processed);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          setLogoPreview(result);
        }
      };
      reader.readAsDataURL(processed);
    } else {
      setLogoFile(null);
      setLogoPreview(null);
    }
  };

  return (
    <form ref={formRef} className="yc-app-shell" onSubmit={onSubmit}>
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
          {restoredNotice ? (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                padding: "10px 14px",
                borderRadius: "6px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "13px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span>
                ✓ <strong>Application details restored:</strong> Your previous inputs were preserved so you don&apos;t have to re-enter anything.
              </span>
              <button
                type="button"
                onClick={clearDraft}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#dc2626",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: "12px",
                  padding: 0,
                }}
              >
                Clear form &amp; start over
              </button>
            </div>
          ) : null}

          {error ? <div className="yc-error-banner">{error}</div> : null}

          {/* STEP 1: COMPANY */}
          <div className={`yc-step-content ${currentStep === "company" ? "is-visible" : "is-hidden"}`}>
            <h2 className="yc-section-title">Company</h2>

            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#166534",
                fontSize: "13px",
                lineHeight: "1.5",
                display: "flex",
                gap: "8px",
                alignItems: "flex-start",
                marginBottom: "16px",
              }}
            >
              <span style={{ fontSize: "16px", flexShrink: 0 }}>💡</span>
              <div>
                <strong>Pro Tip:</strong> Please verify your <strong>Company Name</strong> and <strong>Website URL</strong> carefully. Once your startup reaches 25 upvotes, modifying either field will permanently reset your upvotes, comments, and ranking back to zero.
              </div>
            </div>

            <div className="yc-form-block">
              <label className="yc-field-label">
                <span>Company name <strong className="req">*</strong></span>
                <input
                  name="company_name"
                  required
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    if (fieldErrors.company_name) clearFieldError("company_name");
                  }}
                  className={fieldErrors.company_name ? "is-invalid" : ""}
                  maxLength={80}
                  placeholder="Acme Corp"
                  autoComplete="organization"
                />
                <FieldError message={fieldErrors.company_name} />
              </label>

              <label className="yc-field-label">
                <span>One-line pitch <strong className="req">*</strong></span>
                <input
                  name="pitch"
                  required
                  maxLength={140}
                  value={pitch}
                  onChange={(e) => {
                    setPitch(e.target.value);
                    if (fieldErrors.pitch) clearFieldError("pitch");
                  }}
                  className={fieldErrors.pitch ? "is-invalid" : ""}
                  placeholder="Talk to your computer without talking"
                />
                <span className="char-count">{pitch.length}/140</span>
                <FieldError message={fieldErrors.pitch} />
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
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (fieldErrors.description) clearFieldError("description");
                  }}
                  className={fieldErrors.description ? "is-invalid" : ""}
                  placeholder="What you are building, who it is for, and why it exists."
                />
                <span className="char-count">{description.length}/2000</span>
                <FieldError message={fieldErrors.description} />
              </label>

              <label className="yc-field-label">
                <span>Website URL <strong className="req">*</strong></span>
                <input
                  name="website_url"
                  type="url"
                  required
                  value={websiteUrl}
                  onChange={(e) => {
                    setWebsiteUrl(e.target.value);
                    if (fieldErrors.website_url) clearFieldError("website_url");
                  }}
                  className={fieldErrors.website_url ? "is-invalid" : ""}
                  placeholder="https://example.com"
                  inputMode="url"
                />
                <FieldError message={fieldErrors.website_url} />
              </label>

              <input type="hidden" name="location" value={formatLocation(address, country)} />
              <div className="yc-grid-2">
                <div className="yc-field-label">
                  <span>Country <strong className="req">*</strong></span>
                  <CountryPicker
                    id="field-country"
                    name="country"
                    value={country}
                    onChange={handleCountryChange}
                    hasError={Boolean(fieldErrors.country)}
                  />
                  <FieldError message={fieldErrors.country} />
                </div>
                <label className="yc-field-label">
                  <span>Address / City <em style={{ fontSize: "12px", color: "var(--muted)", fontWeight: "normal" }}>(Optional)</em></span>
                  <input
                    name="address"
                    value={address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    placeholder="e.g. San Francisco, CA or Bengaluru"
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
                  <span style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px", display: "block" }}>
                    Auto-selected from Country. You can also adjust manually.
                  </span>
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
                  <div style={{ marginTop: "6px" }}>
                    <ActivityStatusBadge status={activityStatus} />
                  </div>
                </label>
              </div>

              <div className="yc-grid-2">
                <label className="yc-field-label">
                  <span>Founded year <strong className="req">*</strong></span>
                  <input
                    name="founded_year"
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={4}
                    value={foundedYear}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setFoundedYear(cleaned);
                      if (fieldErrors.founded_year) clearFieldError("founded_year");
                    }}
                    className={fieldErrors.founded_year ? "is-invalid" : ""}
                    placeholder="2024"
                  />
                  <FieldError message={fieldErrors.founded_year} />
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
                    onChange={(e) => {
                      setTeamSize(e.target.value);
                      if (fieldErrors.team_size) clearFieldError("team_size");
                    }}
                    className={fieldErrors.team_size ? "is-invalid" : ""}
                    placeholder="5"
                  />
                  <FieldError message={fieldErrors.team_size} />
                </label>
              </div>

              {/* COMPANY LOGO WITH IMMEDIATE LIVE PREVIEW */}
              <div id="logo-field-wrap" className={`yc-field-label ${fieldErrors.logo ? "is-invalid" : ""}`} style={{ borderRadius: "8px", padding: fieldErrors.logo ? "10px" : "0" }}>
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
                <FieldError message={fieldErrors.logo} />
              </div>

              {/* INDUSTRIES SELECTOR */}
              <div id="industries-field-wrap" className={`yc-field-label ${fieldErrors.industries ? "is-invalid" : ""}`} style={{ borderRadius: "8px", padding: fieldErrors.industries ? "10px" : "0" }}>
                <span>Industries <strong className="req">*</strong> (select 1 to 3)</span>
                <input type="hidden" name="industries" value={JSON.stringify(selectedIndustries)} />
                <FieldError message={fieldErrors.industries} />

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
                            onChange={(e) => {
                              setFounders(updateAt(founders, index, { name: e.target.value }));
                              if (fieldErrors[`founder_name_${index}`]) clearFieldError(`founder_name_${index}`);
                            }}
                            className={fieldErrors[`founder_name_${index}`] ? "is-invalid" : ""}
                            placeholder="Full name"
                          />
                          <FieldError message={fieldErrors[`founder_name_${index}`]} />
                        </label>

                        <label className="yc-field-label">
                          <span>Title / Role <strong className="req">*</strong></span>
                          <input
                            name={`founder_title_${index}`}
                            required
                            placeholder="Co-founder & CEO"
                            value={founder.title}
                            onChange={(e) => {
                              setFounders(updateAt(founders, index, { title: e.target.value }));
                              if (fieldErrors[`founder_title_${index}`]) clearFieldError(`founder_title_${index}`);
                            }}
                            className={fieldErrors[`founder_title_${index}`] ? "is-invalid" : ""}
                          />
                          <FieldError message={fieldErrors[`founder_title_${index}`]} />
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
                            onChange={(e) => {
                              setFounders(updateAt(founders, index, { bio: e.target.value }));
                              if (fieldErrors[`founder_bio_${index}`]) clearFieldError(`founder_bio_${index}`);
                            }}
                            className={fieldErrors[`founder_bio_${index}`] ? "is-invalid" : ""}
                          />
                          <span className="char-count">{founder.bio.length} characters (min 10)</span>
                          <FieldError message={fieldErrors[`founder_bio_${index}`]} />
                        </label>

                        <div className="yc-field-label">
                          <span>Founder Profile Photo (optional)</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px" }}>
                            <div
                              style={{
                                position: "relative",
                                width: 64,
                                height: 64,
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
                              {founder.photoPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={founder.photoPreview}
                                  alt={founder.name || "Founder photo"}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                <svg
                                  style={{ width: 28, height: 28, color: "#94a3b8" }}
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                              )}
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <label
                                  style={{
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "6px 14px",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    borderRadius: "6px",
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #d1d5db",
                                    color: "#1e293b",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                  }}
                                >
                                  <input
                                    name={`founder_photo_${index}`}
                                    type="file"
                                    accept="image/png, image/jpeg, image/webp"
                                    style={{ display: "none" }}
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      if (file.size > 5 * 1024 * 1024) {
                                        alert("Founder photo must be 5MB or smaller.");
                                        return;
                                      }
                                      const processed = await processSquareImage(file, 400, "cover");
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        const res = ev.target?.result;
                                        if (typeof res === "string") {
                                          setFounders(
                                            updateAt(founders, index, {
                                              photoPreview: res,
                                              photoFile: processed,
                                            })
                                          );
                                        }
                                      };
                                      reader.readAsDataURL(processed);
                                    }}
                                  />
                                  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                  </svg>
                                  {founder.photoPreview ? "Change photo" : "Upload photo"}
                                </label>

                                {founder.photoPreview && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFounders(
                                        updateAt(founders, index, {
                                          photoPreview: null,
                                          photoFile: null,
                                        })
                                      );
                                    }}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      fontSize: "12px",
                                      color: "#dc2626",
                                      cursor: "pointer",
                                      padding: "4px 8px",
                                    }}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              <span style={{ fontSize: "11px", color: "var(--muted, #64748b)" }}>
                                JPG, PNG or WebP up to 2MB. Square avatar recommended.
                              </span>
                            </div>
                          </div>
                        </div>

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
                      onChange={(e) => {
                        setJobs(updateAt(jobs, index, { title: e.target.value }));
                        if (fieldErrors[`job_title_${index}`]) clearFieldError(`job_title_${index}`);
                      }}
                      className={fieldErrors[`job_title_${index}`] ? "is-invalid" : ""}
                    />
                    <FieldError message={fieldErrors[`job_title_${index}`]} />
                  </label>
                  <div className="yc-grid-2">
                    <label className="yc-field-label">
                      <span>Location <strong className="req">*</strong></span>
                      <input
                        name={`job_location_${index}`}
                        required
                        placeholder="San Francisco or Remote"
                        value={job.location}
                        onChange={(e) => {
                          setJobs(updateAt(jobs, index, { location: e.target.value }));
                          if (fieldErrors[`job_location_${index}`]) clearFieldError(`job_location_${index}`);
                        }}
                        className={fieldErrors[`job_location_${index}`] ? "is-invalid" : ""}
                      />
                      <FieldError message={fieldErrors[`job_location_${index}`]} />
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
                      onChange={(e) => {
                        setJobs(updateAt(jobs, index, { apply_url: e.target.value }));
                        if (fieldErrors[`job_apply_url_${index}`]) clearFieldError(`job_apply_url_${index}`);
                      }}
                      className={fieldErrors[`job_apply_url_${index}`] ? "is-invalid" : ""}
                    />
                    <FieldError message={fieldErrors[`job_apply_url_${index}`]} />
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
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {founders.filter((f) => f.name.trim()).map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {f.photoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.photoPreview}
                          alt=""
                          style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: "1px solid #d1d5db" }}
                        />
                      ) : null}
                      <span><strong>{f.name}</strong> — {f.title}</span>
                    </div>
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

            {/* FOUNDER ACCOUNT & CO-FOUNDER EMAILS */}
            <div className="yc-form-block" style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 14px", color: "var(--ink)" }}>
                Founder Account & Listing Access
              </h3>

              {loggedInUser ? (
                /* 1. USER IS ALREADY LOGGED IN */
                <div style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "18px" }}>👤</span>
                          <strong style={{ fontSize: "15px", color: "#166534" }}>{loggedInUser.email}</strong>
                          <span
                            style={{
                              background: "#dcfce7",
                              color: "#15803d",
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "999px",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}
                          >
                            Listing Owner
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", color: "#15803d" }}>
                          This startup listing will automatically be attached to your account. You can manage and edit it anytime from your dashboard.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const supabase = createBrowserClient();
                          await supabase.auth.signOut();
                          setLoggedInUser(null);
                          setAuthToken(null);
                          setEmail("");
                        }}
                        style={{
                          background: "#fff",
                          border: "1px solid #d1d5db",
                          color: "#4b5563",
                          fontSize: "12px",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        Switch account
                      </button>
                    </div>
                  </div>
                  <input type="hidden" name="email" value={loggedInUser.email} />
                  <input type="hidden" name="user_id" value={loggedInUser.id} />

                  <label className="yc-field-label">
                    <span>Partner / Co-founder Emails (Optional)</span>
                    <input
                      name="partner_emails"
                      type="text"
                      value={partnerEmails}
                      onChange={(e) => setPartnerEmails(e.target.value)}
                      placeholder="co-founder1@example.com, partner2@example.com"
                    />
                    <span className="yc-input-hint">
                      Add partner emails (comma-separated). Both you and your partners will be able to log in with your respective emails to access, manage, and edit this startup listing from your dashboard.
                    </span>
                  </label>
                </div>
              ) : verifyingEmail ? (
                /* 2. EMAIL VERIFICATION / OTP STAGE */
                <div
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "8px",
                    padding: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "20px" }}>📬</span>
                    <h4 style={{ margin: 0, fontSize: "16px", color: "#1e40af", fontWeight: 600 }}>
                      Verify your email to continue
                    </h4>
                  </div>
                  <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#1e40af", lineHeight: 1.5 }}>
                    We sent a 6-digit confirmation code to <strong>{email.trim()}</strong>. Enter it below to verify your account and proceed directly to payment:
                  </p>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      style={{
                        width: "160px",
                        fontSize: "20px",
                        fontWeight: 700,
                        letterSpacing: "4px",
                        textAlign: "center",
                        padding: "8px 12px",
                        border: "2px solid #3b82f6",
                        borderRadius: "6px",
                      }}
                    />
                    <button
                      type="button"
                      className="hero-cta"
                      onClick={handleVerifyOtp}
                      disabled={otpVerifying || otpCode.length < 6}
                      style={{ height: "42px", padding: "0 20px", marginTop: 0 }}
                    >
                      {otpVerifying ? "Verifying..." : "Verify & Continue ›"}
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#2563eb" }}>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      style={{ background: "none", border: "none", padding: 0, color: "#2563eb", cursor: "pointer", textDecoration: "underline" }}
                    >
                      Resend code
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => setVerifyingEmail(false)}
                      style={{ background: "none", border: "none", padding: 0, color: "#6b7280", cursor: "pointer", textDecoration: "underline" }}
                    >
                      Use a different email / password
                    </button>
                  </div>
                </div>
              ) : (
                /* 3. BRAND NEW OR GUEST USER: INLINE ACCOUNT CREATION */
                <div style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      background: "#fafafa",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "1px solid #e5e7eb", paddingBottom: "10px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("signup");
                          setError(null);
                        }}
                        style={{
                          background: authMode === "signup" ? "#111" : "transparent",
                          color: authMode === "signup" ? "#fff" : "#4b5563",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Create New Account
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("login");
                          setError(null);
                        }}
                        style={{
                          background: authMode === "login" ? "#111" : "transparent",
                          color: authMode === "login" ? "#fff" : "#4b5563",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Already have an account? Log in
                      </button>
                    </div>

                    <label className="yc-field-label">
                      <span>Founder Email <strong className="req">*</strong></span>
                      <input
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErrors.email) clearFieldError("email");
                        }}
                        className={fieldErrors.email ? "is-invalid" : ""}
                        placeholder="founder@example.com"
                        autoComplete="email"
                      />
                      <span className="yc-input-hint">
                        Your account will be created under this email so you can manage your listing anytime.
                      </span>
                      <FieldError message={fieldErrors.email} />
                    </label>

                    <label className="yc-field-label" style={{ marginTop: "12px" }}>
                      <span>Password <strong className="req">*</strong></span>
                      <input
                        name="auth_password"
                        type="password"
                        required
                        value={authPassword}
                        onChange={(e) => {
                          setAuthPassword(e.target.value);
                          if (fieldErrors.auth_password) clearFieldError("auth_password");
                        }}
                        className={fieldErrors.auth_password ? "is-invalid" : ""}
                        placeholder="••••••••"
                        autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                      />
                      <FieldError message={fieldErrors.auth_password} />
                    </label>

                    {authMode === "signup" && authPassword.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          marginTop: "6px",
                          marginBottom: "12px",
                        }}
                      >
                        <PasswordRequirement met={hasMinLength} label="At least 8 characters" />
                        <PasswordRequirement met={hasUppercase} label="One uppercase letter" />
                        <PasswordRequirement met={hasLowercase} label="One lowercase letter" />
                        <PasswordRequirement met={hasNumber} label="One number" />
                      </div>
                    ) : null}

                    {authMode === "signup" ? (
                      <label className="yc-field-label" style={{ marginTop: "12px" }}>
                        <span>Confirm Password <strong className="req">*</strong></span>
                        <input
                          name="auth_confirm_password"
                          type="password"
                          required
                          value={authConfirmPassword}
                          onChange={(e) => {
                            setAuthConfirmPassword(e.target.value);
                            if (fieldErrors.auth_confirm_password) clearFieldError("auth_confirm_password");
                          }}
                          className={fieldErrors.auth_confirm_password ? "is-invalid" : ""}
                          placeholder="••••••••"
                          autoComplete="new-password"
                        />
                        <FieldError message={fieldErrors.auth_confirm_password} />
                        {authConfirmPassword.length > 0 ? (
                          <span
                            style={{
                              fontSize: "12px",
                              color: passwordsMatch ? "#16a34a" : "#dc2626",
                              marginTop: "4px",
                              display: "block",
                            }}
                          >
                            {passwordsMatch ? "✓ Passwords match" : "✕ Passwords do not match"}
                          </span>
                        ) : null}
                      </label>
                    ) : null}

                    <label className="yc-field-label" style={{ marginTop: "16px" }}>
                      <span>Partner / Co-founder Emails (Optional)</span>
                      <input
                        name="partner_emails"
                        type="text"
                        value={partnerEmails}
                        onChange={(e) => setPartnerEmails(e.target.value)}
                        placeholder="partner1@example.com, partner2@example.com"
                      />
                      <span className="yc-input-hint">
                        Add partner emails (comma-separated). Partners can also log in to access and edit this listing from their own accounts.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {authNotice ? (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    color: "#166534",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    marginBottom: "14px",
                  }}
                >
                  {authNotice}
                </div>
              ) : null}

              {/* Required Terms & Conditions Checkbox */}
              <div id="field-wrap-terms" className={`yc-terms-box ${fieldErrors.terms ? "is-invalid" : ""}`}>
                <label className="yc-terms-label">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked);
                      if (fieldErrors.terms) clearFieldError("terms");
                    }}
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
                <FieldError message={fieldErrors.terms} />
              </div>

              <div
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1e40af",
                  padding: "14px 16px",
                  borderRadius: "8px",
                  margin: "12px 0 16px",
                  fontSize: "13px",
                  lineHeight: "1.6",
                }}
              >
                <strong>🧪 Test Mode Payment Instructions:</strong>
                <div style={{ marginTop: "6px" }}>
                  Dodo detected your location as <strong>India (INR ₹)</strong>. In test mode, you must use designated test credentials:
                  <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                    <li>
                      <strong>Indian Card (Visa):</strong>{" "}
                      <code style={{ background: "#dbeafe", padding: "1px 6px", borderRadius: "3px" }}>4576 2389 1277 1450</code>{" "}
                      (Expiry: <code>06/32</code>, CVV: <code>123</code>)
                    </li>
                    <li>
                      <strong>Indian Card (Mastercard):</strong>{" "}
                      <code style={{ background: "#dbeafe", padding: "1px 6px", borderRadius: "3px" }}>5409 1626 6938 1034</code>{" "}
                      (Expiry: <code>06/32</code>, CVV: <code>123</code>)
                    </li>
                    <li>
                      <strong>UPI:</strong> Enter VPA <code>success@upi</code>
                    </li>
                    <li>
                      <strong>US / Global Card:</strong>{" "}
                      <code style={{ background: "#dbeafe", padding: "1px 6px", borderRadius: "3px" }}>4242 4242 4242 4242</code>{" "}
                      (requires changing Billing Country to <em>United States</em> on the checkout screen)
                    </li>
                  </ul>
                  <span style={{ fontSize: "12px", color: "#1d4ed8", display: "block", marginTop: "6px" }}>
                    ⚠️ <em>Entering random card numbers or real debit/credit cards in test mode will be rejected by the payment gateway.</em>
                  </span>
                </div>
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
            ) : verifyingEmail ? (
              <button
                type="button"
                className="yc-submit-btn"
                onClick={handleVerifyOtp}
                disabled={otpVerifying || otpCode.length < 6 || !agreedToTerms}
              >
                {otpVerifying ? "Verifying…" : "Verify & Pay $20"}
              </button>
            ) : (
              <button
                type="submit"
                className="yc-submit-btn"
                disabled={
                  pending ||
                  !agreedToTerms ||
                  (!loggedInUser && authMode === "signup" && (!passwordStrong || !passwordsMatch))
                }
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

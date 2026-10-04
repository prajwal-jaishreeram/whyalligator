"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Company } from "@/lib/types";
import { companyAnchor } from "@/lib/companies";
import { INDUSTRY_TAXONOMY, REGION_TAXONOMY, type TaxonomyItem } from "@/lib/options";
import {
  companyIndustrySet,
  companyRegionSet,
  matchesFilters,
  teamSize,
  type DirectoryFilters,
  type FacetKey,
} from "@/lib/filters";
import { CompanyCard } from "./CompanyCard";
import UpvoteModal from "./UpvoteModal";
import { createBrowserClient, hasSupabaseConfig } from "@/lib/supabase";

type SortKey = "top_voted" | "newest" | "oldest" | "name";

const lower = (value: string) => value.trim().toLowerCase();

const PLACEHOLDER_CLAIM_SPOTS = [
  {
    spot: 1,
    name: "Your Brand",
    pitch: "Be the #1 startup listed on WhyAlligator. Claim this spot to get discovered by founders and investors.",
    location: "Your City / Remote",
    industries: ["AI", "B2B"],
    badgeClass: "pill pill-gold",
    badgeLabel: "#1 Spot Available",
  },
  {
    spot: 2,
    name: "Your Brand",
    pitch: "Showcase your product, find your first 1,000 users, and collect upvotes from the community.",
    location: "Your City / Remote",
    industries: ["SaaS", "Engineering"],
    badgeClass: "pill pill-silver",
    badgeLabel: "#2 Spot Available",
  },
  {
    spot: 3,
    name: "Your Brand",
    pitch: "Launch your project to the other 99%. Claim your permanent listing and climb the leaderboard.",
    location: "Your City / Remote",
    industries: ["Consumer", "Fintech"],
    badgeClass: "pill pill-bronze",
    badgeLabel: "#3 Spot Available",
  },
  {
    spot: 4,
    name: "Your Brand",
    pitch: "Get verified backlinks, organic traffic, and community validation. Add your startup in 2 minutes.",
    location: "Your City / Remote",
    industries: ["Productivity", "Developer Tools"],
    badgeClass: "pill pill-top-10",
    badgeLabel: "#4 Spot Available",
  },
  {
    spot: 5,
    name: "Your Brand",
    pitch: "Put your startup on the front page of the other 99%. Gain direct SEO authority and founder eyeballs.",
    location: "Your City / Remote",
    industries: ["Fintech", "Design"],
    badgeClass: "pill pill-top-10",
    badgeLabel: "#5 Spot Available",
  },
  {
    spot: 6,
    name: "Your Brand",
    pitch: "Show your project to thousands of indie hackers, builders, and active early adopters worldwide.",
    location: "Your City / Remote",
    industries: ["B2B", "SaaS"],
    badgeClass: "pill pill-top-10",
    badgeLabel: "#6 Spot Available",
  },
  {
    spot: 7,
    name: "Your Brand",
    pitch: "Permanent directory listing with dofollow backlink, real-time upvotes, and customer inquiries.",
    location: "Your City / Remote",
    industries: ["AI", "Analytics"],
    badgeClass: "pill pill-top-10",
    badgeLabel: "#7 Spot Available",
  },
  {
    spot: 8,
    name: "Your Brand",
    pitch: "Join the alternative directory for startups building the real future. Secure your batch placement.",
    location: "Your City / Remote",
    industries: ["Developer Tools", "Open Source"],
    badgeClass: "pill pill-top-10",
    badgeLabel: "#8 Spot Available",
  },
  {
    spot: 9,
    name: "Your Brand",
    pitch: "Boost your search engine visibility and stand out amongst ambitious global founders.",
    location: "Your City / Remote",
    industries: ["E-commerce", "Operations"],
    badgeClass: "pill pill-top-10",
    badgeLabel: "#9 Spot Available",
  },
  {
    spot: 10,
    name: "Your Brand",
    pitch: "Lock in your early Batch 1 positioning before the directory fills up to 3,000 startups.",
    location: "Your City / Remote",
    industries: ["Security", "Infrastructure"],
    badgeClass: "pill pill-top-10",
    badgeLabel: "#10 Spot Available",
  },
];

export function DirectoryClient({ companies }: { companies: Company[] }) {
  const [companyList, setCompanyList] = useState<Company[]>(companies);
  const [query, setQuery] = useState("");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [hiringOnly, setHiringOnly] = useState(false);
  const [nonprofitOnly, setNonprofitOnly] = useState(false);
  const [topCompaniesOnly, setTopCompaniesOnly] = useState(false);
  const [batches, setBatches] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("top_voted");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [batchFilterOpen, setBatchFilterOpen] = useState(true);
  const [industryFilterOpen, setIndustryFilterOpen] = useState(true);
  const [regionFilterOpen, setRegionFilterOpen] = useState(true);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [userUpvoteIds, setUserUpvoteIds] = useState<Set<string>>(new Set());
  const [upvoteModalCompany, setUpvoteModalCompany] = useState<Company | null>(null);

  const isOwnCompany = (comp: Company) => {
    if (!currentUserId && !currentUserEmail) return false;
    const emailClean = (currentUserEmail || "").toLowerCase();
    return Boolean(
      (comp.user_id && comp.user_id === currentUserId) ||
      (comp.email && comp.email.toLowerCase() === emailClean) ||
      (Array.isArray(comp.partner_emails) &&
        comp.partner_emails.map((e) => e.toLowerCase()).includes(emailClean))
    );
  };

  useEffect(() => {
    setCompanyList(companies);
  }, [companies]);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    try {
      const supabase = createBrowserClient();

      // Fetch live upvote counts directly from Supabase
      supabase
        .from("companies")
        .select("id, upvotes_count")
        .then(({ data: upvoteData }) => {
          if (Array.isArray(upvoteData)) {
            const countMap = new Map(
              upvoteData.map((item) => [item.id, Number(item.upvotes_count) || 0])
            );
            setCompanyList((prev) =>
              prev.map((c) => {
                const live = countMap.get(c.id);
                return live !== undefined ? { ...c, upvotes_count: live } : c;
              })
            );
          }
        });

      // Subscribe to real-time company updates
      const channel = supabase
        .channel("realtime-companies-upvotes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "companies" },
          (payload: any) => {
            if (payload?.new && payload.new.id) {
              const updatedId = payload.new.id;
              const newCount = Number(payload.new.upvotes_count) || 0;
              setCompanyList((prev) =>
                prev.map((c) => (c.id === updatedId ? { ...c, upvotes_count: newCount } : c))
              );
            }
          }
        )
        .subscribe();

      supabase.auth.getUser().then(({ data: userData, error: userErr }) => {
        const user = userData?.user;
        if (userErr || !user) {
          setIsLoggedIn(false);
          setCurrentUserId(null);
          setCurrentUserEmail(null);
          setUserUpvoteIds(new Set());
          return;
        }
        supabase.auth.getSession().then(({ data }) => {
          const token = data.session?.access_token;
          if (token) {
            setIsLoggedIn(true);
            setCurrentUserId(user.id);
            setCurrentUserEmail(user.email ?? null);
            fetch("/api/user/upvotes", {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((r) => r.json())
              .then((res) => {
                if (Array.isArray(res.upvoted_company_ids)) {
                  setUserUpvoteIds(new Set(res.upvoted_company_ids));
                }
              })
              .catch(() => {});
          }
        });
      });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // ignore
    }
  }, []);

  const maxTeam = useMemo(() => {
    const sizes = companies.map(teamSize);
    return Math.max(100, ...sizes, 1);
  }, [companies]);
  const [minSize, setMinSize] = useState(1);
  const [maxSize, setMaxSize] = useState(maxTeam);

  useEffect(() => {
    setMaxSize((current) => Math.max(current, maxTeam));
  }, [maxTeam]);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const match = companies.find((c) => companyAnchor(c.id) === hash);
    if (!match) return;
    setHighlightId(match.id);
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [companies]);

  // Precompute per-company sets once so counts stay fast while filtering.
  const facts = useMemo(
    () =>
      new Map(
        companyList.map((c) => [
          c.id,
          { industries: companyIndustrySet(c), regions: companyRegionSet(c) },
        ]),
      ),
    [companyList],
  );

  const globalRankMap = useMemo(() => {
    const sorted = [...companyList].sort((a, b) => {
      const va = a.upvotes_count || 0;
      const vb = b.upvotes_count || 0;
      if (vb !== va) return vb - va;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const rankMap = new Map<string, number>();
    sorted.forEach((comp, idx) => {
      if (idx < 10) {
        rankMap.set(comp.id, idx + 1);
      }
    });
    return rankMap;
  }, [companyList]);

  const topIds = useMemo(() => new Set(globalRankMap.keys()), [globalRankMap]);

  const filters: DirectoryFilters = {
    query,
    hiringOnly,
    nonprofitOnly,
    topOnly: topCompaniesOnly,
    batches,
    industries,
    regions,
    minSize,
    maxSize,
    maxTeam,
    topIds,
  };

  // Companies that pass every filter except one facet. Option counts in that
  // facet are computed from this pool, so they update live as you filter.
  const pools = useMemo(() => {
    const pool = (except: FacetKey) =>
      companyList.filter((c) => matchesFilters(c, filters, except));
    return {
      top: pool("top"),
      hiring: pool("hiring"),
      nonprofit: pool("nonprofit"),
      batch: pool("batch"),
      industry: pool("industry"),
      region: pool("region"),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    companyList,
    query,
    hiringOnly,
    nonprofitOnly,
    topCompaniesOnly,
    batches,
    industries,
    regions,
    minSize,
    maxSize,
    maxTeam,
    topIds,
  ]);

  const filtered = useMemo(() => {
    let rows = companyList.filter((c) => matchesFilters(c, filters));

    if (topCompaniesOnly) {
      rows = rows
        .sort((a, b) => {
          const va = a.upvotes_count || 0;
          const vb = b.upvotes_count || 0;
          if (vb !== va) return vb - va;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
        .slice(0, 10);
      return rows;
    }

    return rows.sort((a, b) => {
      if (sort === "top_voted") {
        const va = a.upvotes_count || 0;
        const vb = b.upvotes_count || 0;
        if (vb !== va) return vb - va;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sort === "name") return a.company_name.localeCompare(b.company_name);
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sort === "oldest" ? da - db : db - da;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    companyList,
    query,
    hiringOnly,
    nonprofitOnly,
    topCompaniesOnly,
    batches,
    industries,
    regions,
    minSize,
    maxSize,
    maxTeam,
    sort,
  ]);

  const currentBatchNum = Math.max(1, Math.floor(companies.length / 3000) + 1);
  const batchOptions = useMemo(() => {
    const existing = sortedUnique(companies.map((c) => c.batch).filter(Boolean));
    const allExpected: string[] = [];
    for (let i = 1; i <= currentBatchNum; i += 1) {
      allExpected.push(`Batch ${i}`);
    }
    return sortBatchNames([...existing, ...allExpected]);
  }, [companies, currentBatchNum]);

  const hiringCount = pools.hiring.filter((c) => c.jobs.length > 0).length;
  const nonprofitCount = pools.nonprofit.filter((c) => c.is_nonprofit).length;
  const topCompanyCount = Math.min(10, pools.top.length);

  const countIn = (pool: Company[], key: "industries" | "regions", name: string) => {
    const target = lower(name);
    let n = 0;
    for (const c of pool) if (facts.get(c.id)?.[key].has(target)) n += 1;
    return n;
  };

  const filterPanel = (
    <aside className="filter-panel" aria-label="Filters">
      <div className="filter-section filter-section-first">
        <label className="check-row">
          <input
            type="checkbox"
            checked={topCompaniesOnly}
            onChange={(e) => setTopCompaniesOnly(e.target.checked)}
          />
          <span className="pill-top-icon">💎 Top Companies</span>
          <em>{topCompanyCount}</em>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={hiringOnly}
            onChange={(e) => setHiringOnly(e.target.checked)}
          />
          <span>Is Hiring</span>
          <em>{hiringCount}</em>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={nonprofitOnly}
            onChange={(e) => setNonprofitOnly(e.target.checked)}
          />
          <span>Nonprofit</span>
          <em>{nonprofitCount}</em>
        </label>
      </div>

      <CollapsibleFilterGroup
        title="Batch"
        allLabel="All batches"
        allCount={pools.batch.length}
        options={batchOptions.map((name) => {
          const count = pools.batch.filter((c) => c.batch === name).length;
          return {
            name,
            countLabel: `${count} / 3,000`,
            count,
          };
        })}
        selected={batches}
        onChange={setBatches}
        defaultOpen={true}
        onToggleOpen={setBatchFilterOpen}
      />
      <HierarchicalTaxonomyFilterGroup
        title="Industry"
        allLabel="All industries"
        allCount={pools.industry.length}
        taxonomy={INDUSTRY_TAXONOMY}
        selected={industries}
        onChange={setIndustries}
        getCount={(name) => countIn(pools.industry, "industries", name)}
        defaultOpen={true}
        onToggleOpen={setIndustryFilterOpen}
      />
      <HierarchicalTaxonomyFilterGroup
        title="HQ Region"
        allLabel="Anywhere"
        allCount={pools.region.length}
        taxonomy={REGION_TAXONOMY}
        selected={regions}
        onChange={setRegions}
        getCount={(name) => countIn(pools.region, "regions", name)}
        defaultOpen={true}
        onToggleOpen={setRegionFilterOpen}
      />

      <div className="filter-section">
        <h4 className="yc-filter-title">Company Size</h4>
        <p className="size-range-display">
          {minSize} - {maxSize >= maxTeam ? `${maxTeam}+` : maxSize}
        </p>
        <div className="yc-range-slider-wrap">
          <div
            className="yc-range-slider-highlight"
            style={{
              left: `${((minSize - 1) / (maxTeam - 1)) * 100}%`,
              right: `${100 - ((maxSize - 1) / (maxTeam - 1)) * 100}%`,
            }}
          />
          <input
            type="range"
            min={1}
            max={maxTeam}
            value={minSize}
            className="yc-range-thumb thumb-min"
            aria-label="Minimum team size"
            onChange={(e) => {
              const val = Math.min(Number(e.target.value), maxSize);
              setMinSize(val);
            }}
          />
          <input
            type="range"
            min={1}
            max={maxTeam}
            value={maxSize}
            className="yc-range-thumb thumb-max"
            aria-label="Maximum team size"
            onChange={(e) => {
              const val = Math.max(Number(e.target.value), minSize);
              setMaxSize(val);
            }}
          />
        </div>
      </div>
    </aside>
  );

  const activeFilters = [
    ...batches.map((b) => ({
      key: `batch-${b}`,
      label: b,
      onRemove: () => setBatches(batches.filter((item) => item !== b)),
    })),
    ...industries.map((ind) => ({
      key: `ind-${ind}`,
      label: ind,
      onRemove: () => setIndustries(industries.filter((item) => item !== ind)),
    })),
    ...regions.map((reg) => ({
      key: `reg-${reg}`,
      label: reg,
      onRemove: () => setRegions(regions.filter((item) => item !== reg)),
    })),
    ...(hiringOnly
      ? [{ key: "hiring", label: "Is Hiring", onRemove: () => setHiringOnly(false) }]
      : []),
    ...(nonprofitOnly
      ? [{ key: "nonprofit", label: "Nonprofit", onRemove: () => setNonprofitOnly(false) }]
      : []),
    ...(topCompaniesOnly
      ? [{ key: "top", label: "Top Companies", onRemove: () => setTopCompaniesOnly(false) }]
      : []),
    ...(minSize > 1 || maxSize < maxTeam
      ? [
          {
            key: "size",
            label: `Size: ${minSize} - ${maxSize >= maxTeam ? `${maxTeam}+` : maxSize}`,
            onRemove: () => {
              setMinSize(1);
              setMaxSize(maxTeam);
            },
          },
        ]
      : []),
    ...(query.trim()
      ? [{ key: "query", label: `“${query.trim()}”`, onRemove: () => setQuery("") }]
      : []),
  ];

  function clearAll() {
    setBatches([]);
    setIndustries([]);
    setRegions([]);
    setHiringOnly(false);
    setNonprofitOnly(false);
    setTopCompaniesOnly(false);
    setMinSize(1);
    setMaxSize(maxTeam);
    setQuery("");
  }

  return (
    <div className="directory-shell">
      <div className="filters-desktop">{filterPanel}</div>
      {filtersOpen ? (
        <div className="filters-drawer">
          <div className="filters-drawer-bar">
            <strong>Filters</strong>
            <button type="button" onClick={() => setFiltersOpen(false)}>
              Show {filtered.length} results
            </button>
          </div>
          {filterPanel}
        </div>
      ) : null}

      <section className="results-col">
        <div className="directory-header-row">
          <div className="search-box-wrapper">
            <svg
              className="search-mag-icon"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
                d="M19 19l-4.35-4.35m0 0A7.5 7.5 0 103.5 3.5a7.5 7.5 0 0011.15 11.15z"
              />
            </svg>
            <input
              className="search-input"
              type="search"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query ? (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            ) : null}
          </div>

          <div className="directory-controls-row">
            <button
              type="button"
              className="filter-toggle"
              onClick={() => setFiltersOpen(true)}
              aria-label="Open directory filters"
            >
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 5h14M6 10h8M8 15h4" strokeLinecap="round" />
              </svg>
              <span>Filters{activeFilters.length > 0 ? ` (${activeFilters.length})` : ""}</span>
            </button>

            <label className="sort-label">
              <span className="sort-by-text">Sort by</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                <option value="top_voted">Top Voted</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </label>
          </div>
        </div>

        {activeFilters.length > 0 ? (
          <div className="active-filters-row">
            {activeFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                className="active-filter-pill"
                onClick={f.onRemove}
                title="Remove filter"
              >
                {f.label} <span className="pill-remove">✕</span>
              </button>
            ))}
            <button type="button" className="clear-all-filters" onClick={clearAll}>
              Clear all
            </button>
          </div>
        ) : null}

        <p className="showing" aria-live="polite">
          {companies.length === 0
            ? `Batch 1 is open — priority spots available to claim below`
            : `Showing ${filtered.length} of ${companies.length} companies`}
        </p>
        <div className="results-box">
          {filtered.length === 0 && (query || batches.length > 0 || industries.length > 0 || regions.length > 0 || hiringOnly || nonprofitOnly || topCompaniesOnly) ? (
            <div className="empty-state">
              No companies match those filters.{" "}
              <button type="button" className="clear-all-filters" onClick={clearAll}>
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              {filtered.map((company) => {
                const rank = globalRankMap.get(company.id);

                return (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    highlighted={highlightId === company.id}
                    rank={rank}
                    onUpvoteClick={(c) => setUpvoteModalCompany(c)}
                    hasUpvoted={userUpvoteIds.has(company.id)}
                    isOwnCompany={isOwnCompany(company)}
                  />
                );
              })}

              {/* Render claimable spots below to fill down to HQ Region / filter height */}
              {(() => {
                if (query || batches.length > 0 || industries.length > 0 || regions.length > 0 || hiringOnly || nonprofitOnly || topCompaniesOnly) {
                  return null;
                }
                // Calculate how many rows are needed to align with the bottom of HQ Region
                // Top checkboxes: ~110px. Batch: 50px header + (open ? 180px : 0). Industry: 50px header + (open ? 240px : 0). HQ Region: 50px header + (open ? 240px : 0)
                let filterHeightEstimate = 110;
                if (batchFilterOpen) filterHeightEstimate += 220; else filterHeightEstimate += 50;
                if (industryFilterOpen) filterHeightEstimate += 280; else filterHeightEstimate += 50;
                if (regionFilterOpen) filterHeightEstimate += 280; else filterHeightEstimate += 50;

                // Each company row in results is ~125px on desktop (including borders and padding)
                const targetSlots = Math.min(10, Math.max(3, Math.round(filterHeightEstimate / 125)));

                if (filtered.length >= targetSlots) return null;

                return PLACEHOLDER_CLAIM_SPOTS.slice(filtered.length, targetSlots).map((slot) => (
                  <Link
                    key={slot.spot}
                    href="/add"
                    className="company-row is-placeholder-row"
                    style={{
                      cursor: "pointer",
                      borderStyle: "dashed",
                      borderColor: "#d1d5db",
                      background: "#fafaf8",
                      transition: "all 0.15s ease",
                      textDecoration: "none",
                    }}
                    title="Click to claim this spot and add your startup"
                  >
                    <div className="company-corner-badge">
                      <span className={slot.badgeClass} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <span>{slot.badgeLabel}</span>
                      </span>
                    </div>

                    <div className="company-logo-wrap">
                      <div
                        className="company-logo"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#ffffff",
                          border: "1.5px dashed #9ca3af",
                          color: "#6b7280",
                          fontSize: "13px",
                          fontWeight: 700,
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                        }}
                      >
                        Logo
                      </div>
                    </div>

                    <div className="company-copy">
                      <div className="company-titleline">
                        <span className="company-name" style={{ color: "#111827", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          {slot.name}
                          <span style={{ fontSize: "12px", fontWeight: 500, color: "#ea580c" }}>
                            (Available)
                          </span>
                        </span>
                        <span className="company-location" style={{ color: "#64748b" }}>{slot.location}</span>
                      </div>

                    <p className="company-pitch" style={{ color: "#4b5563" }}>
                      {slot.pitch}
                    </p>

                    <div className="pill-row">
                      <span className="pill pill-batch">Batch 1</span>
                      <span className="pill pill-status" style={{ background: "#ecfdf5", color: "#047857", fontWeight: 600 }}>
                        Claim Spot
                      </span>
                      <span className="pill-desktop-only">
                        <span className={slot.badgeClass}>{slot.badgeLabel}</span>
                      </span>
                      {slot.industries.map((ind) => (
                        <span className="pill" key={ind} style={{ borderStyle: "dashed", color: "#6b7280" }}>
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="company-upvote-wrap">
                    <div
                      className="company-upvote-btn"
                      style={{
                        background: "#111827",
                        borderColor: "#111827",
                        color: "#ffffff",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "6px 8px",
                      }}
                      title="Click to claim this spot ($20)"
                    >
                      <span className="upvote-arrow" style={{ color: "#ffffff", fontSize: "11px" }}>▲</span>
                      <span className="upvote-num" style={{ color: "#ffffff", fontSize: "11px", fontWeight: 700 }}>
                        Claim
                      </span>
                    </div>
                  </div>
                </Link>
                ));
              })()}
            </>
          )}
      </div>
      </section>

      {upvoteModalCompany && (
        <UpvoteModal
          isOpen={Boolean(upvoteModalCompany)}
          onClose={() => setUpvoteModalCompany(null)}
          company={upvoteModalCompany}
          hasUpvoted={userUpvoteIds.has(upvoteModalCompany.id)}
          isOwnCompany={isOwnCompany(upvoteModalCompany)}
          isLoggedIn={isLoggedIn}
          onUpvoteSuccess={(newCount, hasUpvoted) => {
            setCompanyList((prev) =>
              prev.map((c) =>
                c.id === upvoteModalCompany.id ? { ...c, upvotes_count: newCount } : c
              )
            );
            setUserUpvoteIds((prev) => {
              const next = new Set(prev);
              if (hasUpvoted) {
                next.add(upvoteModalCompany.id);
              } else {
                next.delete(upvoteModalCompany.id);
              }
              return next;
            });
          }}
        />
      )}
    </div>
  );
}

function CollapsibleFilterGroup({
  title,
  allLabel,
  allCount,
  options,
  selected,
  onChange,
  defaultOpen = false,
  limit = 6,
  onToggleOpen,
}: {
  title: string;
  allLabel: string;
  allCount: number;
  options: { name: string; count: number; countLabel?: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  defaultOpen?: boolean;
  limit?: number;
  onToggleOpen?: (isOpen: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showAll, setShowAll] = useState(false);
  const allOn = selected.length === 0;

  // Auto-expand if a selected option is beyond the default limit
  useEffect(() => {
    if (options.slice(limit).some((opt) => selected.includes(opt.name))) {
      setShowAll(true);
    }
  }, [options, selected, limit]);

  const hasMore = options.length > limit;
  const visibleOptions = showAll || !hasMore ? options : options.slice(0, limit);

  return (
    <div className="filter-section">
      <button
        type="button"
        className="filter-section-header-btn"
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          onToggleOpen?.(next);
        }}
        aria-expanded={isOpen}
      >
        <h4 className="yc-filter-title">{title}</h4>
        <span className="filter-toggle-icon">{isOpen ? "−" : "+"}</span>
      </button>

      {isOpen ? (
        <div className="filter-group-content">
          <label className="check-row">
            <input
              type="checkbox"
              checked={allOn}
              // "All" just clears the selection; it never hides everything.
              onChange={() => onChange([])}
            />
            <span>{allLabel}</span>
            <em>{allCount}</em>
          </label>
          {visibleOptions.map((option) => (
            <label
              className={`check-row${option.count === 0 && !selected.includes(option.name) ? " is-empty" : ""}`}
              key={option.name}
            >
              <input
                type="checkbox"
                checked={selected.includes(option.name)}
                onChange={() => onChange(toggleValue(selected, option.name))}
              />
              <span>{option.name}</span>
              <em>{option.countLabel ?? option.count}</em>
            </label>
          ))}
          {hasMore ? (
            <button
              type="button"
              className="filter-see-more-btn"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll ? "See fewer options" : "See all options"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TaxonomySubList({
  subs,
  parent,
  selected,
  parentChecked,
  getCount,
  toggleSub,
  subLimit = 6,
}: {
  subs: string[];
  parent: TaxonomyItem;
  selected: string[];
  parentChecked: boolean;
  getCount: (name: string) => number;
  toggleSub: (parent: TaxonomyItem, sub: string) => void;
  subLimit?: number;
}) {
  const [showAllSubs, setShowAllSubs] = useState(false);
  const hasMoreSubs = subs.length > subLimit;

  useEffect(() => {
    if (subs.slice(subLimit).some((s) => selected.includes(s))) {
      setShowAllSubs(true);
    }
  }, [subs, selected, subLimit]);

  const visibleSubs = showAllSubs || !hasMoreSubs ? subs : subs.slice(0, subLimit);

  return (
    <div className="taxonomy-sub-list">
      {visibleSubs.map((sub) => {
        const subChecked = parentChecked || selected.includes(sub);
        const subCount = getCount(sub);

        return (
          <label
            className={`check-row check-row-sub${subCount === 0 && !subChecked ? " is-empty" : ""}`}
            key={sub}
          >
            <input
              type="checkbox"
              checked={subChecked}
              onChange={() => toggleSub(parent, sub)}
            />
            <span>{sub}</span>
            <em>{subCount}</em>
          </label>
        );
      })}

      {hasMoreSubs ? (
        <button
          type="button"
          className="filter-see-more-btn filter-see-more-sub"
          onClick={() => setShowAllSubs((prev) => !prev)}
        >
          {showAllSubs ? "See fewer options" : "See all options"}
        </button>
      ) : null}
    </div>
  );
}

function HierarchicalTaxonomyFilterGroup({
  title,
  allLabel,
  allCount,
  taxonomy,
  selected,
  onChange,
  getCount,
  defaultOpen = true,
  limit = 6,
  onToggleOpen,
}: {
  title: string;
  allLabel: string;
  allCount: number;
  taxonomy: TaxonomyItem[];
  selected: string[];
  onChange: (next: string[]) => void;
  getCount: (name: string) => number;
  defaultOpen?: boolean;
  limit?: number;
  onToggleOpen?: (isOpen: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showAll, setShowAll] = useState(false);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);
  const allOn = selected.length === 0;

  useEffect(() => {
    const hiddenItems = taxonomy.slice(limit);
    const hasSelectedInHidden = hiddenItems.some((item) => {
      if (selected.includes(item.name)) return true;
      return (item.subcategories ?? []).some((s) => selected.includes(s));
    });
    if (hasSelectedInHidden) {
      setShowAll(true);
    }
  }, [taxonomy, selected, limit]);

  function toggleParent(item: TaxonomyItem) {
    const subs = item.subcategories ?? [];
    if (selected.includes(item.name)) {
      onChange(selected.filter((x) => x !== item.name));
    } else {
      // Parent already covers its subcategories, so drop redundant children.
      onChange([...selected.filter((x) => !subs.includes(x)), item.name]);
    }
  }

  function toggleSub(parent: TaxonomyItem, sub: string) {
    if (selected.includes(parent.name)) {
      // Unticking one child of a fully-selected parent: keep the siblings.
      const siblings = (parent.subcategories ?? []).filter((s) => s !== sub);
      onChange([...selected.filter((x) => x !== parent.name), ...siblings]);
      return;
    }
    onChange(toggleValue(selected, sub));
  }

  function toggleParentExpanded(name: string) {
    setExpandedParents((current) =>
      current.includes(name) ? current.filter((x) => x !== name) : [...current, name],
    );
  }

  const hasMore = taxonomy.length > limit;
  const visibleTaxonomy = showAll || !hasMore ? taxonomy : taxonomy.slice(0, limit);

  return (
    <div className="filter-section">
      <button
        type="button"
        className="filter-section-header-btn"
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          onToggleOpen?.(next);
        }}
        aria-expanded={isOpen}
      >
        <h4 className="yc-filter-title">{title}</h4>
        <span className="filter-toggle-icon">{isOpen ? "−" : "+"}</span>
      </button>

      {isOpen ? (
        <div className="filter-group-content">
          <label className="check-row">
            <input type="checkbox" checked={allOn} onChange={() => onChange([])} />
            <span>{allLabel}</span>
            <em>{allCount}</em>
          </label>

          {visibleTaxonomy.map((item) => {
            const subs = item.subcategories ?? [];
            const hasSub = subs.length > 0;
            const parentChecked = selected.includes(item.name);
            const someSubsChecked = !parentChecked && subs.some((s) => selected.includes(s));
            const isExpanded = expandedParents.includes(item.name) || someSubsChecked;
            const catCount = getCount(item.name);

            return (
              <div key={item.name} className="taxonomy-item-block">
                <div className={`check-row check-row-main${catCount === 0 && !parentChecked ? " is-empty" : ""}`}>
                  {hasSub ? (
                    <button
                      type="button"
                      className="subcat-toggle-btn"
                      onClick={() => toggleParentExpanded(item.name)}
                      aria-label={isExpanded ? `Collapse ${item.name}` : `Expand ${item.name}`}
                    >
                      {isExpanded ? "▼" : "▶"}
                    </button>
                  ) : (
                    <span style={{ width: "12px", display: "inline-block" }} />
                  )}
                  <input
                    type="checkbox"
                    checked={parentChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = someSubsChecked;
                    }}
                    onChange={() => toggleParent(item)}
                    aria-label={item.name}
                  />
                  <span>{item.name}</span>
                  <em>{catCount}</em>
                </div>

                {hasSub && isExpanded ? (
                  <TaxonomySubList
                    subs={subs}
                    parent={item}
                    selected={selected}
                    parentChecked={parentChecked}
                    getCount={getCount}
                    toggleSub={toggleSub}
                  />
                ) : null}
              </div>
            );
          })}

          {hasMore ? (
            <button
              type="button"
              className="filter-see-more-btn"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll ? "See fewer options" : "See all options"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function sortBatchNames(batches: string[]): string[] {
  return [...new Set(batches.map((value) => value.trim()).filter(Boolean))].sort((a, b) => {
    const matchA = a.match(/^Batch\s+(\d+)$/i);
    const matchB = b.match(/^Batch\s+(\d+)$/i);
    if (matchA && matchB) {
      return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
    }
    if (matchA) return -1;
    if (matchB) return 1;
    return a.localeCompare(b);
  });
}

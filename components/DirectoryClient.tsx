"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Company } from "@/lib/types";
import { companyAnchor, companyPath, teamSizeNumber } from "@/lib/companies";
import { INDUSTRY_TAXONOMY, REGION_TAXONOMY, type TaxonomyItem } from "@/lib/options";
import { CompanyCard } from "./CompanyCard";

type SortKey = "newest" | "oldest" | "name";

export function DirectoryClient({ companies }: { companies: Company[] }) {
  const [query, setQuery] = useState("");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [hiringOnly, setHiringOnly] = useState(false);
  const [nonprofitOnly, setNonprofitOnly] = useState(false);
  const [topCompaniesOnly, setTopCompaniesOnly] = useState(false);
  const [batches, setBatches] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const maxTeam = useMemo(() => {
    const sizes = companies.map(teamSizeNumber);
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

  const currentBatchNum = Math.max(1, Math.floor(companies.length / 3000) + 1);
  const batchOptions = useMemo(() => {
    const existing = sortedUnique(companies.map((c) => c.batch).filter(Boolean));
    const allExpected: string[] = [];
    for (let i = 1; i <= currentBatchNum; i += 1) {
      allExpected.push(`Batch ${i}`);
    }
    return sortedUnique([...existing, ...allExpected]);
  }, [companies, currentBatchNum]);
  const industryOptions = useMemo(
    () => sortedUnique(companies.flatMap((c) => c.industries)),
    [companies],
  );
  const regionOptions = useMemo(
    () => sortedUnique(companies.map((c) => c.hq_region).filter(Boolean)),
    [companies],
  );

  const hiringCount = companies.filter((c) => c.jobs.length > 0).length;
  const nonprofitCount = companies.filter((c) => c.is_nonprofit).length;
  const topCompanyCount = companies.filter((c) => c.is_top_company).length;
  const topCompanies = companies.filter((c) => c.is_top_company);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = companies.filter((c) => {
      if (hiringOnly && c.jobs.length === 0) return false;
      if (nonprofitOnly && !c.is_nonprofit) return false;
      if (topCompaniesOnly && !c.is_top_company) return false;
      if (batches.includes("__NONE__")) return false;
      if (batches.length && !batches.includes(c.batch)) return false;
      if (industries.includes("__NONE__")) return false;
      if (industries.length) {
        const matchesIndustry = c.industries.some((tag) => {
          const lowerTag = tag.toLowerCase();
          return industries.some((selectedInd) => {
            const lowerSelected = selectedInd.toLowerCase();
            if (lowerTag === lowerSelected) return true;
            const parent = INDUSTRY_TAXONOMY.find(
              (p) => p.name.toLowerCase() === lowerSelected,
            );
            if (parent?.subcategories?.some((sub) => sub.toLowerCase() === lowerTag)) {
              return true;
            }
            return false;
          });
        });
        if (!matchesIndustry) return false;
      }
      if (regions.includes("__NONE__")) return false;
      if (regions.length) {
        const companyLoc = `${c.hq_region} ${c.location}`.toLowerCase();
        const matchesRegion = regions.some((selectedReg) => {
          const lowerSelected = selectedReg.toLowerCase();
          if (companyLoc.includes(lowerSelected)) return true;
          const parent = REGION_TAXONOMY.find(
            (r) => r.name.toLowerCase() === lowerSelected,
          );
          if (parent?.subcategories?.some((sub) => companyLoc.includes(sub.toLowerCase()))) {
            return true;
          }
          return false;
        });
        if (!matchesRegion) return false;
      }
      const size = teamSizeNumber(c);
      if (size < minSize || size > maxSize) return false;
      if (!q) return true;
      return `${c.company_name} ${c.pitch} ${c.description} ${c.website_url} ${c.location} ${c.industries.join(" ")} ${c.batch}`
        .toLowerCase()
        .includes(q);
    });

    return [...rows].sort((a, b) => {
      if (sort === "name") return a.company_name.localeCompare(b.company_name);
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sort === "oldest" ? da - db : db - da;
    });
  }, [
    companies,
    query,
    hiringOnly,
    nonprofitOnly,
    topCompaniesOnly,
    batches,
    industries,
    regions,
    minSize,
    maxSize,
    sort,
  ]);

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
        allCount={companies.length}
        options={batchOptions.map((name) => {
          const count = companies.filter((c) => c.batch === name).length;
          return {
            name,
            countLabel: `${count} / 3,000`,
            count,
          };
        })}
        selected={batches}
        onChange={setBatches}
        defaultOpen={true}
      />
      <HierarchicalTaxonomyFilterGroup
        title="Industry"
        allLabel="All industries"
        allCount={companies.length}
        taxonomy={INDUSTRY_TAXONOMY}
        selected={industries}
        onChange={setIndustries}
        getCategoryCount={(catName) =>
          companies.filter((c) =>
            c.industries.some((tag) => {
              const lowerTag = tag.toLowerCase();
              if (lowerTag === catName.toLowerCase()) return true;
              const subcats =
                INDUSTRY_TAXONOMY.find(
                  (i) => i.name.toLowerCase() === catName.toLowerCase(),
                )?.subcategories ?? [];
              return subcats.some((sub) => sub.toLowerCase() === lowerTag);
            }),
          ).length
        }
        getSubcategoryCount={(subName) =>
          companies.filter((c) =>
            c.industries.some((tag) => tag.toLowerCase() === subName.toLowerCase()),
          ).length
        }
        defaultOpen={true}
      />
      <HierarchicalTaxonomyFilterGroup
        title="HQ Region"
        allLabel="Anywhere"
        allCount={companies.length}
        taxonomy={REGION_TAXONOMY}
        selected={regions}
        onChange={setRegions}
        getCategoryCount={(catName) =>
          companies.filter((c) => {
            const loc = `${c.hq_region} ${c.location}`.toLowerCase();
            if (loc.includes(catName.toLowerCase())) return true;
            const subcats =
              REGION_TAXONOMY.find(
                (r) => r.name.toLowerCase() === catName.toLowerCase(),
              )?.subcategories ?? [];
            return subcats.some((sub) => loc.includes(sub.toLowerCase()));
          }).length
        }
        getSubcategoryCount={(subName) =>
          companies.filter((c) =>
            `${c.hq_region} ${c.location}`.toLowerCase().includes(subName.toLowerCase()),
          ).length
        }
        defaultOpen={true}
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
    ...(batches.includes("__NONE__")
      ? [
          {
            key: "batch-none",
            label: "Batch: None",
            onRemove: () => setBatches([]),
          },
        ]
      : batches.map((b) => ({
          key: `batch-${b}`,
          label: b,
          onRemove: () => setBatches(batches.filter((item) => item !== b)),
        }))),
    ...(industries.includes("__NONE__")
      ? [
          {
            key: "ind-none",
            label: "Industry: None",
            onRemove: () => setIndustries([]),
          },
        ]
      : industries.map((ind) => ({
          key: `ind-${ind}`,
          label: ind,
          onRemove: () => setIndustries(industries.filter((item) => item !== ind)),
        }))),
    ...(regions.includes("__NONE__")
      ? [
          {
            key: "reg-none",
            label: "Region: None",
            onRemove: () => setRegions([]),
          },
        ]
      : regions.map((reg) => ({
          key: `reg-${reg}`,
          label: reg,
          onRemove: () => setRegions(regions.filter((item) => item !== reg)),
        }))),
    ...(hiringOnly
      ? [
          {
            key: "hiring",
            label: "Is Hiring",
            onRemove: () => setHiringOnly(false),
          },
        ]
      : []),
    ...(nonprofitOnly
      ? [
          {
            key: "nonprofit",
            label: "Nonprofit",
            onRemove: () => setNonprofitOnly(false),
          },
        ]
      : []),
    ...(topCompaniesOnly
      ? [
          {
            key: "top",
            label: "Top Companies",
            onRemove: () => setTopCompaniesOnly(false),
          },
        ]
      : []),
    ...(minSize > 1 || maxSize < maxTeam
      ? [
          {
            key: "size",
            label: `Size: ${minSize} - ${maxSize}+`,
            onRemove: () => {
              setMinSize(1);
              setMaxSize(maxTeam);
            },
          },
        ]
      : []),
  ];

  return (
    <div className="directory-shell">
      <button
        type="button"
        className="filter-toggle"
        onClick={() => setFiltersOpen(true)}
      >
        Filters
      </button>
      <div className="filters-desktop">{filterPanel}</div>
      {filtersOpen ? (
        <div className="filters-drawer">
          <div className="filters-drawer-bar">
            <strong>Filters</strong>
            <button type="button" onClick={() => setFiltersOpen(false)}>
              Done
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

          <label className="sort-label">
            <span className="sort-by-text">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="newest">Default (Newest)</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </label>
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
            <button
              type="button"
              className="clear-all-filters"
              onClick={() => {
                setBatches([]);
                setIndustries([]);
                setRegions([]);
                setHiringOnly(false);
                setNonprofitOnly(false);
                setTopCompaniesOnly(false);
                setMinSize(1);
                setMaxSize(maxTeam);
                setQuery("");
              }}
            >
              Clear all
            </button>
          </div>
        ) : null}

        <p className="showing">
          Showing {filtered.length} of {companies.length} companies
        </p>
        <div className="results-box">
          {filtered.length === 0 ? (
            <div className="empty-state">
              {companies.length === 0
                ? "No companies yet. Pay $20 and be the first listing."
                : "No companies match those filters."}
            </div>
          ) : (
            filtered.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                highlighted={highlightId === company.id}
              />
            ))
          )}
        </div>
      </section>
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
}: {
  title: string;
  allLabel: string;
  allCount: number;
  options: { name: string; count: number; countLabel?: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isNone = selected.includes("__NONE__");
  const allOn = selected.length === 0;

  function toggleAll() {
    if (allOn) {
      onChange(["__NONE__"]);
    } else {
      onChange([]);
    }
  }

  function toggleItem(name: string) {
    const clean = selected.filter((x) => x !== "__NONE__");
    onChange(toggleValue(clean, name));
  }

  return (
    <div className="filter-section">
      <button
        type="button"
        className="filter-section-header-btn"
        onClick={() => setIsOpen(!isOpen)}
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
              onChange={toggleAll}
            />
            <span>{allLabel}</span>
            <em>{allCount}</em>
          </label>
          {options.map((option) => (
            <label className="check-row" key={option.name}>
              <input
                type="checkbox"
                checked={!isNone && selected.includes(option.name)}
                onChange={() => toggleItem(option.name)}
              />
              <span>{option.name}</span>
              <em>{option.countLabel ?? option.count}</em>
            </label>
          ))}
        </div>
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
  getCategoryCount,
  getSubcategoryCount,
  defaultOpen = true,
}: {
  title: string;
  allLabel: string;
  allCount: number;
  taxonomy: TaxonomyItem[];
  selected: string[];
  onChange: (next: string[]) => void;
  getCategoryCount: (catName: string) => number;
  getSubcategoryCount: (subName: string) => number;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);
  const isNone = selected.includes("__NONE__");
  const allOn = selected.length === 0;

  function toggleAll() {
    if (allOn) {
      onChange(["__NONE__"]);
    } else {
      onChange([]);
    }
  }

  function toggleItem(name: string) {
    const clean = selected.filter((x) => x !== "__NONE__");
    onChange(toggleValue(clean, name));
  }

  function toggleParentExpanded(name: string) {
    setExpandedParents((current) =>
      current.includes(name) ? current.filter((x) => x !== name) : [...current, name],
    );
  }

  return (
    <div className="filter-section">
      <button
        type="button"
        className="filter-section-header-btn"
        onClick={() => setIsOpen(!isOpen)}
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
              onChange={toggleAll}
            />
            <span>{allLabel}</span>
            <em>{allCount}</em>
          </label>

          {taxonomy.map((item) => {
            const hasSub = (item.subcategories?.length ?? 0) > 0;
            const isExpanded = expandedParents.includes(item.name);
            const parentChecked = !isNone && selected.includes(item.name);
            const catCount = getCategoryCount(item.name);

            return (
              <div key={item.name} className="taxonomy-item-block">
                <div className="check-row check-row-main">
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
                    onChange={() => toggleItem(item.name)}
                  />
                  <span>{item.name}</span>
                  <em>{catCount}</em>
                </div>

                {hasSub && isExpanded ? (
                  <div className="taxonomy-sub-list">
                    {item.subcategories!.map((sub) => {
                      const subChecked = !isNone && selected.includes(sub);
                      const subCount = getSubcategoryCount(sub);

                      return (
                        <label className="check-row check-row-sub" key={sub}>
                          <input
                            type="checkbox"
                            checked={subChecked}
                            onChange={() => toggleItem(sub)}
                          />
                          <span>{sub}</span>
                          <em>{subCount}</em>
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
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

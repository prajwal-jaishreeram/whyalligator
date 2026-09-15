"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Company } from "@/lib/types";
import { companyAnchor, companyPath, teamSizeNumber } from "@/lib/companies";
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

  const batchOptions = useMemo(
    () => sortedUnique(companies.map((c) => c.batch).filter(Boolean)),
    [companies],
  );
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
      if (batches.length && !batches.includes(c.batch)) return false;
      if (industries.length && !c.industries.some((tag) => industries.includes(tag))) {
        return false;
      }
      if (regions.length && !regions.includes(c.hq_region)) return false;
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
        options={batchOptions.map((name) => ({
          name,
          count: companies.filter((c) => c.batch === name).length,
        }))}
        selected={batches}
        onChange={setBatches}
        defaultOpen={false}
      />
      <CollapsibleFilterGroup
        title="Industry"
        allLabel="All industries"
        allCount={companies.length}
        options={industryOptions.map((name) => ({
          name,
          count: companies.filter((c) => c.industries.includes(name)).length,
        }))}
        selected={industries}
        onChange={setIndustries}
        defaultOpen={false}
      />
      <CollapsibleFilterGroup
        title="HQ Region"
        allLabel="Anywhere"
        allCount={companies.length}
        options={regionOptions.map((name) => ({
          name,
          count: companies.filter((c) => c.hq_region === name).length,
        }))}
        selected={regions}
        onChange={setRegions}
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
        <div className="results-toolbar">
          <label className="sort-label">
            Sort by
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

        <div className="search-box-card">
          <input
            className="search-input"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
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
        </div>

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
  options: { name: string; count: number }[];
  selected: string[];
  onChange: (next: string[]) => void;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const allOn = selected.length === 0;

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
              onChange={() => onChange([])}
            />
            <span>{allLabel}</span>
            <em>{allCount}</em>
          </label>
          {options.map((option) => (
            <label className="check-row" key={option.name}>
              <input
                type="checkbox"
                checked={selected.includes(option.name)}
                onChange={() => onChange(toggleValue(selected, option.name))}
              />
              <span>{option.name}</span>
              <em>{option.count}</em>
            </label>
          ))}
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

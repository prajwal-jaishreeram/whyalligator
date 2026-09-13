"use client";

import { useEffect, useMemo, useState } from "react";
import type { Company } from "@/lib/types";
import { companyAnchor, teamSizeNumber } from "@/lib/companies";
import { CompanyCard } from "./CompanyCard";

type SortKey = "newest" | "oldest" | "name";

export function DirectoryClient({ companies }: { companies: Company[] }) {
  const [query, setQuery] = useState("");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [hiringOnly, setHiringOnly] = useState(false);
  const [nonprofitOnly, setNonprofitOnly] = useState(false);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = companies.filter((c) => {
      if (hiringOnly && c.jobs.length === 0) return false;
      if (nonprofitOnly && !c.is_nonprofit) return false;
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
    batches,
    industries,
    regions,
    minSize,
    maxSize,
    sort,
  ]);

  const filterPanel = (
    <aside className="filter-panel" aria-label="Filters">
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

      <FilterGroup
        title="Batch"
        allLabel="All batches"
        allCount={companies.length}
        options={batchOptions.map((name) => ({
          name,
          count: companies.filter((c) => c.batch === name).length,
        }))}
        selected={batches}
        onChange={setBatches}
      />
      <FilterGroup
        title="Industry"
        allLabel="All industries"
        allCount={companies.length}
        options={industryOptions.map((name) => ({
          name,
          count: companies.filter((c) => c.industries.includes(name)).length,
        }))}
        selected={industries}
        onChange={setIndustries}
      />
      <FilterGroup
        title="HQ Region"
        allLabel="Anywhere"
        allCount={companies.length}
        options={regionOptions.map((name) => ({
          name,
          count: companies.filter((c) => c.hq_region === name).length,
        }))}
        selected={regions}
        onChange={setRegions}
      />

      <div className="filter-section">
        <h4>Company Size</h4>
        <p className="size-range">
          {minSize} - {maxSize}+
        </p>
        <label className="range-label">
          Min
          <input
            type="range"
            min={1}
            max={maxTeam}
            value={minSize}
            onChange={(e) => setMinSize(Math.min(Number(e.target.value), maxSize))}
          />
        </label>
        <label className="range-label">
          Max
          <input
            type="range"
            min={1}
            max={maxTeam}
            value={maxSize}
            onChange={(e) => setMaxSize(Math.max(Number(e.target.value), minSize))}
          />
        </label>
      </div>
    </aside>
  );

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
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>
        <input
          className="search-input"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
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

function FilterGroup({
  title,
  allLabel,
  allCount,
  options,
  selected,
  onChange,
}: {
  title: string;
  allLabel: string;
  allCount: number;
  options: { name: string; count: number }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const allOn = selected.length === 0;
  return (
    <div className="filter-section">
      <h4>{title}</h4>
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

import Link from "next/link";
import type { Company } from "@/lib/types";
import { companyAnchor, companyPath } from "@/lib/companies";
import { ActivityStatusBadge } from "./ActivityStatusBadge";

export function CompanyCard({
  company,
  highlighted,
  rank,
  onUpvoteClick,
  hasUpvoted,
  isOwnCompany,
}: {
  company: Company;
  highlighted?: boolean;
  rank?: number;
  onUpvoteClick?: (company: Company) => void;
  hasUpvoted?: boolean;
  isOwnCompany?: boolean;
}) {
  const topBadge =
    rank === 1 ? (
      <span className="pill pill-gold" title="Rank 1 by upvotes" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
        <span>#1 Top Company</span>
      </span>
    ) : rank === 2 ? (
      <span className="pill pill-silver" title="Rank 2 by upvotes" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span>#2 Top Company</span>
      </span>
    ) : rank === 3 ? (
      <span className="pill pill-bronze" title="Rank 3 by upvotes" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span>#3 Top Company</span>
      </span>
    ) : rank && rank <= 10 ? (
      <span className="pill pill-top-10" title={`Rank #${rank} by upvotes`} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
        <span>#{rank} Top Company</span>
      </span>
    ) : company.is_top_company ? (
      <span className="pill pill-top">Top company</span>
    ) : null;

  return (
    <Link
      id={companyAnchor(company.id)}
      href={companyPath(company)}
      className={`company-row${highlighted ? " is-highlighted" : ""}`}
    >
      {topBadge && (
        <div className="company-corner-badge">
          {topBadge}
        </div>
      )}
      <div className="company-logo-wrap">
        {company.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={company.logo_url}
            alt=""
            className="company-logo"
            width={64}
            height={64}
          />
        ) : (
          <div className="company-logo fallback">
            {company.company_name.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div className="company-copy">
        <div className="company-titleline">
          <span className="company-name">{company.company_name}</span>
          {company.location ? (
            <span className="company-location">{company.location}</span>
          ) : null}
        </div>
        <p className="company-pitch">{company.pitch}</p>
        <div className="pill-row">
          <span className="pill pill-batch">{company.batch}</span>
          <ActivityStatusBadge status={company.activity_status} />
          {topBadge && (
            <span className="pill-desktop-only">
              {topBadge}
            </span>
          )}
          {company.industries.slice(0, 2).map((tag) => (
            <span className="pill" key={tag}>
              {tag}
            </span>
          ))}
          {company.industries.length > 2 && (
            <span
              className="pill pill-more"
              title={`+${company.industries.length - 2} more (${company.industries.slice(2).join(", ")}) — click to view all on company page`}
            >
              +{company.industries.length - 2}
            </span>
          )}
        </div>
      </div>
      <div
        className="company-upvote-wrap"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {isOwnCompany ? (
          <div
            className="company-upvote-btn"
            style={{
              cursor: "default",
              background: "#f9fafb",
              borderColor: "#e5e7eb",
              opacity: 0.9,
            }}
            title="Your startup — Total upvotes"
          >
            <span className="upvote-arrow" style={{ color: "#f97316" }}>▲</span>
            <span className="upvote-num" style={{ color: "#374151" }}>{company.upvotes_count || 0}</span>
          </div>
        ) : (
          <button
            type="button"
            className={`company-upvote-btn ${hasUpvoted ? "is-voted" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onUpvoteClick?.(company);
            }}
            title={hasUpvoted ? "You upvoted this company" : "Upvote this company"}
          >
            <span className="upvote-arrow">▲</span>
            <span className="upvote-num">{company.upvotes_count || 0}</span>
          </button>
        )}
      </div>
    </Link>
  );
}

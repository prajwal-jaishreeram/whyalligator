import Link from "next/link";
import type { Company } from "@/lib/types";
import { companyAnchor, companyPath } from "@/lib/companies";

export function CompanyCard({
  company,
  highlighted,
}: {
  company: Company;
  highlighted?: boolean;
}) {
  return (
    <Link
      id={companyAnchor(company.id)}
      href={companyPath(company)}
      className={`company-row${highlighted ? " is-highlighted" : ""}`}
    >
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
          {company.industries.slice(0, 3).map((tag) => (
            <span className="pill" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

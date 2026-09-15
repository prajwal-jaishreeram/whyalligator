"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import type { Company } from "@/lib/types";
import { companyPath } from "@/lib/companies";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!hasSupabaseConfig()) {
        setLoading(false);
        return;
      }
      const supabase = createBrowserClient();
      const { data: authData } = await supabase.auth.getSession();
      const user = authData.session?.user;
      if (!user) {
        window.location.href = "/login";
        return;
      }
      setUserEmail(user.email ?? null);

      // Match by user_id OR email
      const { data, error } = await supabase
        .from("companies")
        .select("id, slug, company_name, pitch, batch, location, logo_url, email, status, user_id, created_at, description, website_url, founded_year, team_size, activity_status, industries, linkedin_url, twitter_url, primary_partner, founders, jobs, hq_region, is_nonprofit, is_top_company")
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCompanies(data as Company[]);
      }
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <main className="page-width" style={{ padding: "80px 0", textAlign: "center" }}>
        <p>Loading your startups...</p>
      </main>
    );
  }

  return (
    <main>
      <section className="hero">
        <h1>Founder Dashboard</h1>
        <p className="hero-copy">
          Manage and edit your listed startups. Logged in as <strong>{userEmail}</strong>
        </p>
      </section>

      <div className="page-width">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2>Your Listed Startups ({companies.length})</h2>
          <Link href="/add" className="apply-btn">
            + List another startup ($20)
          </Link>
        </div>

        {companies.length === 0 ? (
          <div className="form-card" style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ fontSize: "16px", color: "var(--muted)", marginBottom: "20px" }}>
              No startups found under {userEmail}. If you paid for a listing with this email, it will appear here automatically.
            </p>
            <Link href="/add" className="hero-cta">
              List your startup now ($20)
            </Link>
          </div>
        ) : (
          <div className="results-box">
            {companies.map((company) => (
              <div
                key={company.id}
                className="company-row"
                style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div className="company-logo-wrap" style={{ width: "48px", flexBasis: "48px" }}>
                    {company.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={company.logo_url}
                        alt=""
                        className="company-logo"
                        style={{ width: "48px", height: "48px" }}
                      />
                    ) : (
                      <div
                        className="company-logo fallback"
                        style={{ width: "48px", height: "48px", fontSize: "18px" }}
                      >
                        {company.company_name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "18px", margin: "0 0 4px", fontWeight: 500 }}>
                      {company.company_name}
                    </h3>
                    <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)" }}>
                      {company.pitch}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Link
                    href={companyPath(company)}
                    className="ghost-btn"
                    target="_blank"
                  >
                    View public page ↗
                  </Link>
                  <Link
                    href={`/companies/${company.slug || company.id}/edit`}
                    className="hero-cta"
                    style={{ height: "36px", fontSize: "14px", padding: "0 16px" }}
                  >
                    Edit startup
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

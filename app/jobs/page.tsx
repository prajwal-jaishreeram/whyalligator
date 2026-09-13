import type { Metadata } from "next";
import Link from "next/link";
import { getAllJobs } from "@/lib/companies";

export const revalidate = 60;
export const metadata: Metadata = { title: "Startup Jobs | WhyAlligator" };

export default async function JobsPage() {
  const jobs = await getAllJobs();

  return (
    <main>
      <section className="hero">
        <h1>Startup Jobs</h1>
        <p className="hero-copy">
          Roles posted by companies listed on WhyAlligator. Apply on the
          company&apos;s own site.
        </p>
      </section>
      <div className="page-width">
        {jobs.length === 0 ? (
          <p className="empty-state">No jobs posted yet.</p>
        ) : (
          <div className="results-box jobs-board">
            {jobs.map((job) => (
              <div className="job-row" key={`${job.company_slug}-${job.title}`}>
                <div>
                  <Link className="job-title" href={`/companies/${job.company_slug}`}>
                    {job.title}
                  </Link>
                  <p className="job-meta">
                    {[job.company_name, job.location, job.salary, job.equity, job.experience]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </p>
                </div>
                <a className="job-apply" href={job.apply_url} target="_blank" rel="noreferrer">
                  Apply Now
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

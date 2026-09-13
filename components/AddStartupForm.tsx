"use client";

import { FormEvent, useState } from "react";

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
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [pitch, setPitch] = useState("");
  const [description, setDescription] = useState("");
  const [founders, setFounders] = useState<FounderDraft[]>([emptyFounder()]);
  const [jobs, setJobs] = useState<JobDraft[]>([]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
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
    <form className="add-form" onSubmit={onSubmit}>
      <h2 className="form-section">Company</h2>
      <label>
        Company name
        <input name="company_name" required maxLength={80} autoComplete="organization" />
      </label>
      <label>
        One-line pitch
        <input
          name="pitch"
          required
          maxLength={140}
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          placeholder="Talk to your computer without talking"
        />
        <span className="char-count">{pitch.length}/140</span>
      </label>
      <label>
        About the company
        <textarea
          name="description"
          required
          minLength={20}
          maxLength={2000}
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What you are building, who it is for, and why it exists."
        />
        <span className="char-count">{description.length}/2000</span>
      </label>
      <div className="form-grid">
        <label>
          Website URL
          <input name="website_url" required placeholder="https://example.com" inputMode="url" />
        </label>
        <label>
          Location
          <input name="location" required placeholder="San Francisco, CA, USA" />
        </label>
        <label>
          Founded
          <input name="founded_year" placeholder="2026" />
        </label>
        <label>
          Team size
          <input name="team_size" type="number" min="1" max="10000" placeholder="3" />
        </label>
        <label>
          HQ region
          <select name="hq_region" defaultValue="Remote">
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
          <input name="batch" placeholder="The Other 99%" />
        </label>
        <label>
          Status
          <select name="activity_status" defaultValue="Active">
            <option>Active</option>
            <option>Stealth</option>
            <option>Public</option>
            <option>Acquired</option>
          </select>
        </label>
      </div>
      <label>
        Industries
        <input name="industries" placeholder="Hard Tech, Consumer" />
        <span className="char-count">Comma-separated, like YC tags</span>
      </label>
      <label>
        Logo
        <input name="logo" type="file" accept="image/*" required />
      </label>
      <div className="form-grid">
        <label>
          Company LinkedIn
          <input name="linkedin_url" placeholder="https://linkedin.com/company/..." />
        </label>
        <label>
          Company X / Twitter
          <input name="twitter_url" placeholder="https://x.com/..." />
        </label>
      </div>
      <label className="check-row">
        <input name="is_nonprofit" type="checkbox" />
        <span>This is a nonprofit</span>
      </label>
      <label>
        Primary partner
        <input name="primary_partner" placeholder="Leave blank and we will put You" />
      </label>

      <h2 className="form-section">Active founders</h2>
      {founders.map((founder, index) => (
        <fieldset className="form-block" key={index}>
          <legend>Founder {index + 1}</legend>
          <label>
            Name
            <input
              name={`founder_name_${index}`}
              required
              value={founder.name}
              onChange={(e) =>
                setFounders(updateAt(founders, index, { name: e.target.value }))
              }
            />
          </label>
          <label>
            Title
            <input
              name={`founder_title_${index}`}
              placeholder="Founder/CEO"
              value={founder.title}
              onChange={(e) =>
                setFounders(updateAt(founders, index, { title: e.target.value }))
              }
            />
          </label>
          <label>
            Bio
            <input
              name={`founder_bio_${index}`}
              placeholder="Founder at Acme, CS @ GT"
              value={founder.bio}
              onChange={(e) =>
                setFounders(updateAt(founders, index, { bio: e.target.value }))
              }
            />
          </label>
          <label>
            Photo
            <input name={`founder_photo_${index}`} type="file" accept="image/*" />
          </label>
          <div className="form-grid">
            <label>
              X / Twitter
              <input
                name={`founder_twitter_${index}`}
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
                value={founder.linkedin}
                onChange={(e) =>
                  setFounders(updateAt(founders, index, { linkedin: e.target.value }))
                }
              />
            </label>
          </div>
        </fieldset>
      ))}
      {founders.length < 4 ? (
        <button
          type="button"
          className="ghost-btn"
          onClick={() => setFounders([...founders, emptyFounder()])}
        >
          Add another founder
        </button>
      ) : null}

      <h2 className="form-section">Jobs (optional)</h2>
      {jobs.map((job, index) => (
        <fieldset className="form-block" key={index}>
          <legend>Job {index + 1}</legend>
          <label>
            Title
            <input
              name={`job_title_${index}`}
              required
              value={job.title}
              onChange={(e) => setJobs(updateAt(jobs, index, { title: e.target.value }))}
            />
          </label>
          <div className="form-grid">
            <label>
              Location
              <input
                name={`job_location_${index}`}
                placeholder="San Francisco, CA, US"
                value={job.location}
                onChange={(e) =>
                  setJobs(updateAt(jobs, index, { location: e.target.value }))
                }
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
            <label>
              Equity
              <input
                name={`job_equity_${index}`}
                placeholder="0.50% - 2.00%"
                value={job.equity}
                onChange={(e) => setJobs(updateAt(jobs, index, { equity: e.target.value }))}
              />
            </label>
            <label>
              Experience
              <input
                name={`job_experience_${index}`}
                placeholder="3+ Years"
                value={job.experience}
                onChange={(e) =>
                  setJobs(updateAt(jobs, index, { experience: e.target.value }))
                }
              />
            </label>
          </div>
          <label>
            Apply URL
            <input
              name={`job_apply_url_${index}`}
              placeholder="Defaults to company website"
              value={job.apply_url}
              onChange={(e) =>
                setJobs(updateAt(jobs, index, { apply_url: e.target.value }))
              }
            />
          </label>
        </fieldset>
      ))}
      {jobs.length < 6 ? (
        <button
          type="button"
          className="ghost-btn"
          onClick={() => setJobs([...jobs, emptyJob()])}
        >
          Add a job
        </button>
      ) : null}

      <h2 className="form-section">Checkout</h2>
      <label>
        Founder email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="apply-btn submit-btn" type="submit" disabled={pending}>
        {pending ? "Sending you to checkout…" : "Pay $20 and get listed"}
      </button>
      <p className="form-fineprint">
        Flat $20, one time. Your company page goes live as soon as Stripe
        clears. Newest first, no ranking.
      </p>
    </form>
  );
}

function updateAt<T>(list: T[], index: number, patch: Partial<T>): T[] {
  return list.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

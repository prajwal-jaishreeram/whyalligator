const URL_PATTERN = /^https?:\/\/.+/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ListingInput = {
  company_name: string;
  pitch: string;
  website_url: string;
  email: string;
};

export function normalizeWebsite(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function validateListing(input: ListingInput): string | null {
  const name = input.company_name.trim();
  const pitch = input.pitch.trim();
  const website = normalizeWebsite(input.website_url);
  const email = input.email.trim();

  if (name.length < 2 || name.length > 80) {
    return "Company name must be between 2 and 80 characters.";
  }
  if (pitch.length < 4 || pitch.length > 140) {
    return "Pitch must be between 4 and 140 characters.";
  }
  if (!URL_PATTERN.test(website)) {
    return "Website must be a valid URL.";
  }
  if (!EMAIL_PATTERN.test(email)) {
    return "Enter a valid founder email.";
  }
  return null;
}

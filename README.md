# WhyAlligator

Y Combinator accepts 1%. We accept the other 99%.

A satirical startup directory. The homepage is a YC-style companies list. Anyone can add a company for a flat **$20** via Stripe. After payment, the company goes live immediately (newest first) and the founder gets a Resend confirmation email.

## Stack

- Next.js App Router
- Supabase (Postgres + Storage)
- Stripe Checkout
- Resend
- Cloudflare Workers via OpenNext (`@opennextjs/cloudflare`)

## Setup

1. Copy `.env.example` to `.env.local` and fill in keys.
2. In Supabase, run `supabase/schema.sql` and create a public Storage bucket named `logos`.
3. Add Stripe and Resend keys to `.env.local` so checkout and confirmation email work.
4. Create a Stripe webhook pointing at `/api/webhooks/stripe` for `checkout.session.completed`.

```bash
npm install
npm run dev
```

Directory pages revalidate every 60 seconds so the homepage can stay cached under a traffic spike. The Stripe webhook also calls `revalidatePath("/")` and the company page.

Clicking a company opens `/companies/[slug]`, a YC-style profile with about copy, founders, jobs, and a metadata sidebar. The add-startup form collects those fields.

## Out of scope (on purpose)

## Deploy to Cloudflare Workers

```bash
npm run deploy
```

Set the same environment variables in the Worker dashboard (or `wrangler secret`). Stripe webhooks must use the production URL.

## Out of scope (on purpose)

Certificates, AI copy, ranking / Top Companies, rejection counts, screenshot uploads.

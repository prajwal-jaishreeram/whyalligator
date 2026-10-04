// Dodo Payments helpers. Uses plain fetch + Web Crypto so it runs on both
// Node.js and Cloudflare Workers without an SDK.

export const LISTING_PRICE_CENTS = 2000;

function env(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function apiBase(): string {
  const mode = (process.env.DODO_PAYMENTS_ENVIRONMENT || "").trim().toLowerCase();
  return mode === "live_mode" || mode === "live"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";
}

export async function createCheckoutSession(input: {
  email: string;
  name: string;
  returnUrl: string;
  metadata: Record<string, string>;
}): Promise<{ session_id: string; checkout_url: string }> {
  const response = await fetch(`${apiBase()}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("DODO_PAYMENTS_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_cart: [{ product_id: env("DODO_PAYMENTS_PRODUCT_ID"), quantity: 1 }],
      customer: { email: input.email, name: input.name },
      return_url: input.returnUrl,
      metadata: input.metadata,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Dodo checkout failed (${response.status}): ${text.slice(0, 500)}`);
  }
  return JSON.parse(text) as { session_id: string; checkout_url: string };
}

const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: ArrayBuffer): string {
  let binary = "";
  const view = new Uint8Array(bytes);
  for (let i = 0; i < view.length; i += 1) binary += String.fromCharCode(view[i]);
  return btoa(binary);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verifies a Standard Webhooks signature as sent by Dodo Payments.
 * Signed content is `${webhook-id}.${webhook-timestamp}.${rawBody}`.
 */
export async function verifyWebhook(
  rawBody: string,
  headers: Headers,
): Promise<boolean> {
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatureHeader = headers.get("webhook-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() / 1000 - ts) > WEBHOOK_TOLERANCE_SECONDS) return false;

  const secret = env("DODO_PAYMENTS_WEBHOOK_SECRET").replace(/^whsec_/, "");
  const key = await crypto.subtle.importKey(
    "raw",
    base64ToBytes(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`),
  );
  const expected = bytesToBase64(mac);

  return signatureHeader
    .split(" ")
    .map((part) => part.split(",", 2))
    .some(([version, sig]) => version === "v1" && !!sig && timingSafeEqual(sig, expected));
}

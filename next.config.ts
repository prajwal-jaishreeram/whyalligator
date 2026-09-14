import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

// Bindings helper for `next dev` only. Running it during `next build` on
// Workers CI can crash the config load and fail the deploy with no logs.
if (process.env.NODE_ENV === "development" && process.env.WORKERS_CI !== "1") {
  const { initOpenNextCloudflareForDev } = await import("@opennextjs/cloudflare");
  initOpenNextCloudflareForDev();
}

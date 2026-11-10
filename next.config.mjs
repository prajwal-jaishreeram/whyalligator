/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      // Redirect apex domain to www canonical domain
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "whyalligator.com",
          },
        ],
        destination: "https://www.whyalligator.com/:path*",
        permanent: true,
      },
      // Redirect HTTP to HTTPS
      {
        source: "/:path*",
        has: [
          {
            type: "header",
            key: "x-forwarded-proto",
            value: "http",
          },
        ],
        destination: "https://www.whyalligator.com/:path*",
        permanent: true,
      },
      // Directory parent path redirects
      {
        source: "/companies",
        destination: "/",
        permanent: true,
      },
      {
        source: "/company",
        destination: "/",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

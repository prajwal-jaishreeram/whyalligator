import type { Metadata } from "next";
import Script from "next/script";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.whyalligator.com"),
  title: {
    default: "WhyAlligator — Discover & Launch Ambitious Startups",
    template: "%s | WhyAlligator",
  },
  description:
    "The global startup launchpad for ambitious founders. List your product for $20, get discovered by active customers and investors, and compete for $30,000 in equity-free grants.",
  keywords: [
    "startup directory",
    "launch startup",
    "discover startups",
    "indie founders",
    "equity free funding",
    "startup funding",
    "build in public",
    "Y Combinator alternative",
    "startup jobs",
  ],
  authors: [{ name: "WhyAlligator" }],
  creator: "WhyAlligator",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.whyalligator.com",
    siteName: "WhyAlligator",
    title: "WhyAlligator — Discover & Launch Ambitious Startups",
    description:
      "The global startup launchpad for ambitious founders. List your product for $20, get discovered by active customers and investors, and compete for $30,000 in equity-free grants.",
    images: [
      {
        url: "/og-image.png",
        width: 1024,
        height: 486,
        alt: "WhyAlligator — Discover & Launch Ambitious Startups",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WhyAlligator — Discover & Launch Ambitious Startups",
    description:
      "The global startup launchpad for ambitious founders. List your product for $20, get discovered by active customers and investors, and compete for $30,000 in equity-free grants.",
    creator: "@Prajwal_shindee",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/logo.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HVJZVR5B39"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-HVJZVR5B39');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "WhyAlligator",
              alternateName: ["Why Alligator", "WhyAlligator Startup Directory"],
              url: "https://www.whyalligator.com",
              description:
                "The global startup launchpad for ambitious founders. List your product for $20, get discovered by active customers and investors, and compete for $30,000 in equity-free grants.",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://www.whyalligator.com/?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500&family=Source+Serif+4:ital,wght@0,400;0,500;1,400;1,500&display=swap"
        />
      </head>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}

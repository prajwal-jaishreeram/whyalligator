import type { Metadata } from "next";
import Script from "next/script";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.whyalligator.com"),
  title: {
    default: "WhyAlligator — The Global Startup Directory for the Other 99%",
    template: "%s | WhyAlligator",
  },
  description:
    "YC accepts 1%. We back the other 99%. List for $20 once to reach customers & investors. When Batch 1 fills (3,000 startups), #1 wins a $30,000 equity-free grant.",
  keywords: [
    "startup directory",
    "indie founders",
    "launch startup",
    "discover startups",
    "equity free funding",
    "startup funding",
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
    title: "WhyAlligator — The Global Startup Directory for the Other 99%",
    description:
      "YC accepts 1%. We back the other 99%. List for $20 once to reach customers & investors. When Batch 1 fills (3,000 startups), #1 wins a $30,000 equity-free grant.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "WhyAlligator Startup Directory",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "WhyAlligator — The Global Startup Directory for the Other 99%",
    description:
      "YC accepts 1%. We back the other 99%. List for $20 once to reach customers & investors. When Batch 1 fills (3,000 startups), #1 wins a $30,000 equity-free grant.",
    creator: "@Prajwal_shindee",
    images: ["/logo.png"],
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

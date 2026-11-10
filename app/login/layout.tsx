import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your WhyAlligator account to manage your startup listing, profile, and upvotes.",
  alternates: {
    canonical: "https://www.whyalligator.com/login",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

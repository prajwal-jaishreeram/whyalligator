import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Listing | WhyAlligator",
  robots: { index: false, follow: false },
};

export default function EditListingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

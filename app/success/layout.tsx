import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Successful | WhyAlligator",
  robots: { index: false, follow: false },
};

export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}

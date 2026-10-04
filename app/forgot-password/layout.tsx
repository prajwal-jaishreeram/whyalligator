import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | WhyAlligator",
  description: "Reset the password for your WhyAlligator account.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}

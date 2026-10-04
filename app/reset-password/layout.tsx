import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set a New Password | WhyAlligator",
  description: "Choose a new password for your WhyAlligator account.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}

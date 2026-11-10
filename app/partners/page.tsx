import type { Metadata } from "next";
import { ProsePage } from "@/components/ProsePage";

export const metadata: Metadata = {
  title: "Partners",
  description: "Learn about the WhyAlligator partner philosophy — founders stay in complete control with zero equity taken.",
  alternates: {
    canonical: "https://www.whyalligator.com/partners",
  },
};

export default function PartnersPage() {
  return (
    <ProsePage title="Partners">
      <p>
        There is no partner program and no one will take a board seat. The
        primary partner on a WhyAlligator listing is you, unless you type
        someone else on the form.
      </p>
      <p>
        We do not introduce companies to investors as part of the $20 listing.
        If that changes, it will be written on this page first.
      </p>
    </ProsePage>
  );
}

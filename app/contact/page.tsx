import type { Metadata } from "next";
import { ProsePage } from "@/components/ProsePage";

export const metadata: Metadata = { title: "Contact | WhyAlligator" };

export default function ContactPage() {
  return (
    <ProsePage title="Contact">
      <p>
        For listing takedowns, privacy requests, or problems with a $20
        payment, email{" "}
        <a href="mailto:hello@whyalligator.com">hello@whyalligator.com</a>.
      </p>
      <p>
        Include the company name, the founder email used at checkout, and what
        you need changed. We cannot refund a live listing except where the law
        requires it or we failed to publish after a successful charge.
      </p>
    </ProsePage>
  );
}

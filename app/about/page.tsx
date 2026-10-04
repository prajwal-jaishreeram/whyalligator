import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/ProsePage";

export const metadata: Metadata = {
  title: "About | WhyAlligator",
  description:
    "WhyAlligator is the global launchpad and directory for the 99% of ambitious builders. List for $20 once, connect with early users and investors, and compete for $30,000 in equity-free grant funding.",
};

export default function AboutPage() {
  return (
    <ProsePage title="About">
      <p>
        Y Combinator accepts about 1% of applicants. WhyAlligator backs the
        other 99% for a flat $20 one-time fee. There is no pitch deck, no gatekeeping,
        and zero equity taken.
      </p>
      <p>
        In Batch 1, once all 3,000 listings are filled, the #1 community-voted startup is awarded a <strong>$30,000 equity-free grant</strong>.
      </p>
      <p>
        WhyAlligator is an independent founder directory and is not affiliated with Y Combinator.
      </p>
      <p>
        <Link href="/add">Add your startup ($20)</Link>
        {" · "}
        <Link href="/">Browse the directory</Link>
        {" · "}
        <Link href="/contact">Contact</Link>
      </p>
    </ProsePage>
  );
}

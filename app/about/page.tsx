import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/ProsePage";

export const metadata: Metadata = { title: "About | WhyAlligator" };

export default function AboutPage() {
  return (
    <ProsePage title="About">
      <p>
        Y Combinator accepts about 1% of applicants. WhyAlligator lists the
        other 99% for a flat $20. There is no interview, no batch partner, and
        no equity. You pay, we publish a public company page, newest first.
      </p>
      <p>
        The directory is a parody of Y Combinator&apos;s companies site. It is
        not affiliated with Y Combinator. A listing is not funding and not an
        endorsement.
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

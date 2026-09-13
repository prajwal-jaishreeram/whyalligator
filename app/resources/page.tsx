import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/ProsePage";

export const metadata: Metadata = { title: "Resources | WhyAlligator" };

export default function ResourcesPage() {
  return (
    <ProsePage title="Resources">
      <ul>
        <li>
          <Link href="/">Startup Directory</Link> - every live listing, newest first.
        </li>
        <li>
          <Link href="/library">Library</Link> - the same companies as a reading list.
        </li>
        <li>
          <Link href="/jobs">Startup Jobs</Link> - roles posted on live listings.
        </li>
        <li>
          <Link href="/add">Add your startup</Link> - $20, one time, then you are live.
        </li>
        <li>
          <Link href="/privacy">Privacy Policy</Link> and{" "}
          <Link href="/terms">Terms of Use</Link>.
        </li>
      </ul>
    </ProsePage>
  );
}

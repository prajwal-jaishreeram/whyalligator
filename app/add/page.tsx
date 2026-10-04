import { AddStartupForm } from "@/components/AddStartupForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add your startup | WhyAlligator",
  description:
    "Launch your startup on WhyAlligator. List for $20 once, reach active customers & investors, and compete in Batch 1 for a $30,000 equity-free grant.",
};

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="yc-add-page">
      {params.canceled ? (
        <div className="page-width" style={{ marginTop: 20 }}>
          <p className="form-error hero-error">
            Checkout was canceled. Your card was not listed.
          </p>
        </div>
      ) : null}
      <div className="yc-page-width">
        <AddStartupForm />
      </div>
    </main>
  );
}

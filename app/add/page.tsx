import { AddStartupForm } from "@/components/AddStartupForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add your startup | WhyAlligator",
  description:
    "YC accepts 1%. We back the other 99%. List for $20 once to reach customers & investors. When Batch 1 fills (3,000 startups), #1 wins a $30,000 equity-free grant.",
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

import { AddStartupForm } from "@/components/AddStartupForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add your startup | WhyAlligator",
  description:
    "Y Combinator accepts 1%. We accept the other 99%. List your startup for a flat $20 one-time fee in Batch 1 — once all 3,000 listings are filled, the top-voted startup wins a $30,000 equity-free grant.",
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

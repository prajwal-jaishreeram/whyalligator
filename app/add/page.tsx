import { AddStartupForm } from "@/components/AddStartupForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add your startup | WhyAlligator",
  description: "Y Combinator accepts 1%. We accept the other 99%. $20 to list.",
};

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const params = await searchParams;

  return (
    <main>
      <section className="hero">
        <h1>Add your startup</h1>
        <p className="hero-copy">
          $20, one time, live on the directory as soon as payment clears. No
          interview. No batch. No 7%. We accept the other 99%.
        </p>
        {params.canceled ? (
          <p className="form-error hero-error">
            Checkout was canceled. Your card was not listed.
          </p>
        ) : null}
      </section>
      <div className="page-width form-wide">
        <div className="form-card">
          <AddStartupForm />
        </div>
      </div>
    </main>
  );
}

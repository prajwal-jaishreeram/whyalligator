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
  searchParams: Promise<{ canceled?: string; unlocked?: string; payment_id?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="yc-add-page">
      {params.canceled ? (
        <div className="page-width" style={{ marginTop: 20 }}>
          <p className="form-error hero-error">
            Checkout was canceled. Your card was not charged.
          </p>
        </div>
      ) : params.unlocked ? (
        <div className="page-width" style={{ marginTop: 20 }}>
          <p style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "12px 18px", borderRadius: "8px", fontSize: "14px", fontWeight: 500, margin: 0, textAlign: "center" }}>
            🎉 Payment received! Your Batch 1 listing slot is unlocked. Fill in your details below to launch your startup.
          </p>
        </div>
      ) : null}
      <div className="yc-page-width">
        <AddStartupForm />
      </div>
    </main>
  );
}

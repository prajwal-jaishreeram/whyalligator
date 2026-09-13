import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <section className="hero">
        <h1>Not found</h1>
        <p className="hero-copy">That page is not on WhyAlligator.</p>
        <Link href="/" className="hero-cta">
          Back to the directory
        </Link>
      </section>
    </main>
  );
}

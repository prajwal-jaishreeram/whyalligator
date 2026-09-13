import type { ReactNode } from "react";

export function ProsePage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main>
      <section className="hero">
        <h1>{title}</h1>
      </section>
      <div className="page-width prose-page">{children}</div>
    </main>
  );
}

import { type ReactNode } from "react";
import { Container } from "@/components/ui/Container";

/** Shared banner for every inner public page (About, Procedures, FAQ, etc). */
export function PageHero({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker?: string;
  title: string;
  subtitle?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-line bg-cream">
      <Container className="py-16 md:py-20">
        {kicker && (
          <p className="text-xs font-semibold uppercase tracking-wider text-teal">{kicker}</p>
        )}
        <h1 className="mt-3 max-w-2xl text-4xl md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-muted">{subtitle}</p>}
        {children}
      </Container>
    </div>
  );
}

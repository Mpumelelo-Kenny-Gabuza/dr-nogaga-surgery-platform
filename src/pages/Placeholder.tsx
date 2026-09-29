import { Container } from "@/components/ui/Container";

export function Placeholder({ title, phase }: { title: string; phase: string }) {
  return (
    <Container className="py-24">
      <p className="text-xs font-medium uppercase tracking-wider text-teal">{phase}</p>
      <h1 className="mt-3 text-4xl">{title}</h1>
      <p className="mt-4 max-w-xl text-muted">
        Route wired up in Phase 1. Real content and functionality land in the phase noted above.
      </p>
    </Container>
  );
}

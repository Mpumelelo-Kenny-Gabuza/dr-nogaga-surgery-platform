import { Link } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";

export function ConsultationCta({
  heading,
  text,
}: {
  heading?: string | null;
  text?: string | null;
}) {
  return (
    <div className="bg-ink">
      <Container className="flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h2 className="text-white">{heading ?? "Ready to take the next step?"}</h2>
          {text && <p className="mt-3 text-mist/80">{text}</p>}
        </div>
        <Link to="/consultation" className={buttonClasses("onDark", "shrink-0")}>
          Book a Consultation
        </Link>
      </Container>
    </div>
  );
}

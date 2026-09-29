import { Link } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";

export function NotFound() {
  return (
    <Container className="flex flex-col items-start py-32">
      <p className="text-xs font-medium uppercase tracking-wider text-teal">404</p>
      <h1 className="mt-3 text-4xl">Page not found</h1>
      <p className="mt-4 max-w-md text-muted">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to="/" className={buttonClasses("primary", "mt-8")}>
        Back to homepage
      </Link>
    </Container>
  );
}

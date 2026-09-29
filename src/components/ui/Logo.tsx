import { Link } from "react-router-dom";
import clsx from "clsx";
import logoMark from "@/assets/logo-mark.png";

type LogoProps = {
  /** "light" for use on white/cream backgrounds, "dark" for the navy footer */
  tone?: "light" | "dark";
  className?: string;
};

// The practice name is set in Inter (not the serif used for editorial
// headings) to match the sans-serif wordmark in the practice's own logo file.
export function Logo({ tone = "light", className }: LogoProps) {
  return (
    <Link to="/" className={clsx("flex items-center gap-3 shrink-0", className)}>
      <img src={logoMark} alt="" className="h-11 w-auto" />
      <span className="font-sans text-lg font-semibold tracking-tight">
        <span className={tone === "dark" ? "text-white" : "text-ink"}>Dr Viwe </span>
        <span className="text-teal-brand">Nogaga</span>
      </span>
    </Link>
  );
}

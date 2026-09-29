import { type ButtonHTMLAttributes, type AnchorHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[3px] px-5 py-3 text-sm font-semibold transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none";

const variants = {
  primary: "bg-teal text-white hover:bg-teal-dark",
  secondary: "bg-white text-teal border border-teal hover:bg-mist/40",
  ghost: "bg-transparent text-ink-light hover:text-teal",
  onDark: "bg-white text-ink hover:bg-cream",
};

type Variant = keyof typeof variants;

/** Class string for styling a non-<button> element (e.g. a router Link) as a button. */
export function buttonClasses(variant: Variant = "primary", className?: string) {
  return clsx(base, variants[variant], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button ref={ref} className={clsx(base, variants[variant], className)} {...props} />
  )
);
Button.displayName = "Button";

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant };

// Plain <a> styled as a button, for external links. For internal navigation
// use React Router's <Link className={buttonClasses(...)}> instead.
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ className, variant = "primary", ...props }, ref) => (
    <a ref={ref} className={buttonClasses(variant, className)} {...props} />
  )
);
ButtonLink.displayName = "ButtonLink";

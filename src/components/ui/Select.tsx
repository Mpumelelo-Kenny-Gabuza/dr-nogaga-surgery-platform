import { type SelectHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, id, className, children, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div>
        {/* An empty label (e.g. a compact inline control that already has a
            visible column header elsewhere, with its name instead passed as
            aria-label) skips the element entirely rather than rendering a
            blank one — every other call site passes a real label as before. */}
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={clsx(
            "mt-1.5 w-full rounded-[3px] border bg-white px-3 py-2.5 text-sm text-ink",
            "focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal",
            error ? "border-red-400" : "border-line",
            className
          )}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

import { type TextareaHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className, rows = 4, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div>
        <label htmlFor={inputId} className="block text-sm font-medium text-ink">
          {label}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={clsx(
            "mt-1.5 w-full rounded-[3px] border px-3 py-2.5 text-sm text-ink placeholder:text-muted/60",
            "focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal",
            error ? "border-red-400" : "border-line",
            className
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

import { type InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div>
        <label htmlFor={inputId} className="block text-sm font-medium text-ink">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            "mt-1.5 w-full rounded-[3px] border px-3 py-2.5 text-sm text-ink placeholder:text-muted/60",
            "focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal",
            error ? "border-red-400" : "border-line",
            className
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Field.displayName = "Field";

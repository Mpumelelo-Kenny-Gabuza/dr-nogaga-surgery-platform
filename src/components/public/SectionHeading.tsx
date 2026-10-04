import clsx from "clsx";

export function SectionHeading({
  kicker,
  title,
  text,
  align = "left",
  className,
}: {
  kicker?: string;
  title: string;
  text?: string | null;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={clsx(align === "center" && "text-center mx-auto", "max-w-2xl", className)}>
      {kicker && (
        <p className="text-xs font-semibold uppercase tracking-wider text-teal">{kicker}</p>
      )}
      <h2 className="mt-2 text-3xl">{title}</h2>
      {text && <p className="mt-3 text-muted">{text}</p>}
    </div>
  );
}

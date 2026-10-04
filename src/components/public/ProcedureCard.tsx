import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { ProcedureWithCategory } from "@/types/content";

export function ProcedureCard({ procedure }: { procedure: ProcedureWithCategory }) {
  return (
    <Link
      to={`/procedures/${procedure.slug}`}
      className="group flex flex-col overflow-hidden rounded-sm border border-line bg-white transition-colors hover:border-teal"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-mist/40">
        {procedure.featured_image_url ? (
          <img
            src={procedure.featured_image_url}
            alt={procedure.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-wide text-muted">
            {procedure.procedure_categories?.name ?? "Procedure"}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        {procedure.procedure_categories && (
          <p className="text-xs font-semibold uppercase tracking-wider text-teal">
            {procedure.procedure_categories.name}
          </p>
        )}
        <h3 className="mt-2 text-xl">{procedure.title}</h3>
        {procedure.short_description && (
          <p className="mt-2 flex-1 text-sm text-muted">{procedure.short_description}</p>
        )}
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal">
          Learn more <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}

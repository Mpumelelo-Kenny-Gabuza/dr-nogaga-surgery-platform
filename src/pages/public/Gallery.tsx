import { useMemo, useState } from "react";
import { PageHero } from "@/components/public/PageHero";
import { Container } from "@/components/ui/Container";
import { DataState } from "@/components/public/DataState";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getGalleryItems } from "@/lib/supabase/queries";
import type { GalleryItem } from "@/types/content";
import clsx from "clsx";

export function Gallery() {
  usePageMeta("Gallery", "Photos from the practice.");
  const { data, loading, error } = useSupabaseQuery<GalleryItem[]>(
    async () => {
      const { data, error } = await getGalleryItems();
      return { data: data ?? [], error };
    },
    []
  );

  return (
    <>
      <PageHero kicker="Gallery" title="Gallery" />
      <Container className="py-16 md:py-20">
        <DataState
          loading={loading}
          error={error}
          isEmpty={!loading && !error && (data?.length ?? 0) === 0}
          emptyMessage="Gallery images will be published here soon."
        >
          {data && <GalleryGrid items={data} />}
        </DataState>
      </Container>
    </>
  );
}

function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category).filter((c): c is string => Boolean(c)))),
    [items]
  );
  const [active, setActive] = useState<string | "ALL">("ALL");
  const filtered = active === "ALL" ? items : items.filter((i) => i.category === active);

  return (
    <div>
      {categories.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActive("ALL")}
            className={clsx(
              "rounded-full border px-4 py-1.5 text-sm",
              active === "ALL" ? "border-teal bg-teal text-white" : "border-line text-muted"
            )}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActive(category)}
              className={clsx(
                "rounded-full border px-4 py-1.5 text-sm",
                active === category ? "border-teal bg-teal text-white" : "border-line text-muted"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <figure key={item.id} className="overflow-hidden rounded-sm bg-mist/40">
            <img
              src={item.image_url}
              alt={item.alt_text ?? item.caption ?? ""}
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
            />
            {item.caption && (
              <figcaption className="px-3 py-2 text-xs text-muted">{item.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}

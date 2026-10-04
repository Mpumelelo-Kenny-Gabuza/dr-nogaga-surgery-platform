import { useState } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import type { Faq } from "@/types/content";

export function FaqAccordion({ faqs }: { faqs: Pick<Faq, "id" | "question" | "answer">[] }) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  return (
    <div className="divide-y divide-line border-y border-line">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div key={faq.id}>
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : faq.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="font-medium text-ink">{faq.question}</span>
              <ChevronDown
                size={18}
                className={clsx("shrink-0 text-teal transition-transform", isOpen && "rotate-180")}
                aria-hidden
              />
            </button>
            {isOpen && <p className="pb-5 pr-8 text-sm leading-relaxed text-muted">{faq.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}

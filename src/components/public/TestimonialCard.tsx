import { Quote } from "lucide-react";
import type { Testimonial } from "@/types/content";

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="flex h-full flex-col rounded-sm border border-line bg-white p-6">
      <Quote size={20} className="text-teal" aria-hidden />
      <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink-light">
        “{testimonial.testimonial_text}”
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        {testimonial.image_url && (
          <img
            src={testimonial.image_url}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />
        )}
        <span className="text-sm font-medium text-ink">{testimonial.display_name}</span>
      </figcaption>
    </figure>
  );
}

/** Formats a Postgres `numeric` fee column (e.g. site_settings.consultation_fee_cash) as ZAR. */
export function formatZAR(amount: number | string | null | undefined): string | null {
  if (amount === null || amount === undefined) return null;
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(n)) return null;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

/** Formats a date-only Postgres column (e.g. a post's published_at) for display. */
export function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

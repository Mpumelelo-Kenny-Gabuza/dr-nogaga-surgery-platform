-- Split into its own migration, deliberately. Postgres refuses to let a
-- newly added enum value be *used* (in a query, or in a `language sql`
-- function body, which gets parsed/inlined immediately) within the same
-- transaction that added it — "unsafe use of new value ... of enum type".
-- Since the Supabase CLI runs each migration file as one transaction, this
-- value has to be committed here, in its own file, before anything in a
-- later migration is allowed to reference 'CANCELLED'.
alter type public.enquiry_status add value 'CANCELLED';

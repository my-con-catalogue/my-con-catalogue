-- Adds an optional order cutoff field to published catalogue entries.
alter table public.catalogue_entries
  add column if not exists order_cutoff text;

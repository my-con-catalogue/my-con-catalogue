-- Adds an optional public-facing note to pick-up-only catalogue entries.
alter table public.catalogue_entries
  add column if not exists pickup_note text;

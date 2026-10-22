-- Allow Supabase CSV imports to send SQL NULL for artists without Instagram.
-- Keep app reads safe via the corresponding nullable Drizzle field + query normalization.
alter table public.catalogue_entries
  add column if not exists artist_social_links text[] not null default '{}';

alter table public.catalogue_entries
  alter column artist_instagrams drop not null;

alter table public.catalogue_entries
  alter column artist_instagrams set default '{}';

alter table public.catalogue_entries
  drop constraint if exists catalogue_entries_artist_instagrams_nonempty;

alter table public.catalogue_entries
  drop constraint if exists catalogue_entries_social_account_required;

alter table public.catalogue_entries
  add constraint catalogue_entries_social_account_required
  check (
    coalesce(cardinality(artist_instagrams), 0) >= 1
    or coalesce(cardinality(artist_social_links), 0) >= 1
  );

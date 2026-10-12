-- Allow an artist booth entry to be published before catalogue material is available.
-- The artist Instagram remains required; catalogue URLs/files/tags stay optional.
alter table public.catalogue_entries
  add column if not exists catalogue_links text[] not null default '{}';

-- Remove legacy checks that required an Instagram post or uploaded file.
alter table public.catalogue_entries drop constraint if exists catalogue_entries_check;
alter table public.catalogue_entries drop constraint if exists catalogue_entries_check1;
alter table public.catalogue_entries drop constraint if exists catalogue_entries_check_1;

-- Keep the artist Instagram handle required for new entries.
alter table public.catalogue_entries drop constraint if exists catalogue_entries_artist_instagrams_nonempty;
alter table public.catalogue_entries
  add constraint catalogue_entries_artist_instagrams_nonempty
  check (cardinality(artist_instagrams) >= 1);

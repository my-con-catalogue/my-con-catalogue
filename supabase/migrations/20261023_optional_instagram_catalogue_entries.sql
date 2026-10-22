-- Instagram is optional for catalogue entries when another social profile is
-- provided in artist_social_links (for example, an X profile URL).
alter table public.catalogue_entries
  add column if not exists artist_social_links text[] not null default '{}';

alter table public.catalogue_entries
  drop constraint if exists catalogue_entries_artist_instagrams_nonempty;

alter table public.catalogue_entries
  drop constraint if exists catalogue_entries_social_account_required;

alter table public.catalogue_entries
  add constraint catalogue_entries_social_account_required
  check (
    cardinality(artist_instagrams) >= 1
    or cardinality(artist_social_links) >= 1
  );

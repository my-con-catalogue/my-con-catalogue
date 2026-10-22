-- Supabase CSV imports may send SQL NULL for a blank artist_instagrams cell.
-- Keep the array column non-null for the app, but normalize blank imports to {}.
create or replace function public.normalize_catalogue_entry_instagrams()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.artist_instagrams := coalesce(new.artist_instagrams, '{}'::text[]);
  return new;
end;
$$;

drop trigger if exists normalize_catalogue_entry_instagrams
  on public.catalogue_entries;

create trigger normalize_catalogue_entry_instagrams
before insert or update on public.catalogue_entries
for each row
execute function public.normalize_catalogue_entry_instagrams();

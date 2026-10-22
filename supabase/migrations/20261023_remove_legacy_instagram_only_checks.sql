-- Remove legacy CHECK constraints that require Instagram specifically.
-- Keep a check requiring at least one social account (Instagram or another URL).
alter table public.catalogue_entries
  add column if not exists artist_social_links text[] not null default '{}';

alter table public.catalogue_entries
  alter column artist_instagrams drop not null;

alter table public.catalogue_entries
  alter column artist_instagrams set default '{}';

do $$
declare
  old_check record;
begin
  for old_check in
    select conname, pg_get_constraintdef(oid) as definition
    from pg_constraint
    where conrelid = 'public.catalogue_entries'::regclass
      and contype = 'c'
  loop
    if old_check.definition ilike '%artist_instagrams%'
       and old_check.definition not ilike '%artist_social_links%' then
      execute format(
        'alter table public.catalogue_entries drop constraint %I',
        old_check.conname
      );
    end if;
  end loop;
end;
$$;

alter table public.catalogue_entries
  drop constraint if exists catalogue_entries_social_account_required;

alter table public.catalogue_entries
  add constraint catalogue_entries_social_account_required
  check (
    coalesce(cardinality(artist_instagrams), 0) >= 1
    or coalesce(cardinality(artist_social_links), 0) >= 1
  ) not valid;

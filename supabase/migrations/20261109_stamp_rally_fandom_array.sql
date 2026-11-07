-- Store each Stamp Rally fandom as a separate text-array value. Existing text
-- values are preserved as one tag (including any commas in the name).
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'stamp_rallies'
      and column_name = 'fandom'
      and data_type <> 'ARRAY'
  ) then
    alter table public.stamp_rallies
      alter column fandom type text[]
      using case
        when fandom is null or btrim(fandom) = '' then '{}'::text[]
        else array[fandom]::text[]
      end;
  end if;
end $$;

update public.stamp_rallies
set fandom = '{}'::text[]
where fandom is null;

alter table public.stamp_rallies
  alter column fandom set default '{}'::text[],
  alter column fandom set not null;

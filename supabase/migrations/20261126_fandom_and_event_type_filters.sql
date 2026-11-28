-- Store multiple fandoms and event types as PostgreSQL text arrays so Supabase
-- Table Editor accepts values such as {"Alien Stage","Genshin Impact"}.
do $$
begin
  if (select data_type from information_schema.columns where table_schema = 'public' and table_name = 'fan_cafes' and column_name = 'fandom') = 'text' then
    alter table public.fan_cafes alter column fandom type text[]
      using case when nullif(trim(fandom), '') is null then '{}'::text[] else array[trim(fandom)] end;
  end if;
end $$;

alter table public.fan_cafes alter column fandom set default '{}';
update public.fan_cafes set fandom = '{}' where fandom is null;
alter table public.fan_cafes alter column fandom set not null;

alter table public.fan_cafes
  add column if not exists types text[] not null default '{}';

do $$
begin
  if (select data_type from information_schema.columns where table_schema = 'public' and table_name = 'interest_checks' and column_name = 'type') = 'text' then
    alter table public.interest_checks alter column "type" type text[]
      using case when nullif(trim("type"), '') is null then '{}'::text[] else array[trim("type")] end;
  end if;
  if (select data_type from information_schema.columns where table_schema = 'public' and table_name = 'interest_checks' and column_name = 'fandom') = 'text' then
    alter table public.interest_checks alter column fandom type text[]
      using case when nullif(trim(fandom), '') is null then '{}'::text[] else array[trim(fandom)] end;
  end if;
end $$;

alter table public.interest_checks alter column "type" set default '{}';
alter table public.interest_checks alter column fandom set default '{}';
update public.interest_checks set "type" = '{}' where "type" is null;
update public.interest_checks set fandom = '{}' where fandom is null;
alter table public.interest_checks alter column "type" set not null;
alter table public.interest_checks alter column fandom set not null;


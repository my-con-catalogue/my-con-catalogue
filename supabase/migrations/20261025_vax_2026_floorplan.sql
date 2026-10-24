-- Add VAX 2026 if it is not already in the event list, then register all
-- yellow Standard Artist Alley and Rahmah table booths for the booth index.
-- Keep serial IDs aligned with existing rows. A prior manual import can leave
-- the sequence behind the table and make the next insert fail on its primary key.
do $$
declare
  target record;
  sequence_name text;
  highest_id bigint;
  sequence_value bigint;
begin
  for target in
    select table_name from (values ('events'), ('event_booths')) as tables(table_name)
  loop
    sequence_name := pg_get_serial_sequence(format('public.%I', target.table_name), 'id');
    if sequence_name is not null then
      execute format('select coalesce(max(id), 0) from public.%I', target.table_name)
        into highest_id;
      execute format('select last_value from %s', sequence_name::regclass)
        into sequence_value;
      perform setval(sequence_name::regclass, greatest(highest_id, sequence_value), true);
    end if;
  end loop;
end $$;

insert into public.events (
  slug, name, year, display_order, is_upcoming, start_date, end_date,
  location, entry_status, logo_url
)
values (
  'vax-2026', 'VAX 2026', 2026, 4, true, '2026-10-31', '2026-11-01',
  'Taylor''s University, Lakeside Campus, Selangor, Malaysia', 'TBA', '/events/vax.jpg'
)
on conflict (slug) do update set
  name = excluded.name,
  year = excluded.year,
  display_order = excluded.display_order,
  start_date = coalesce(events.start_date, excluded.start_date),
  end_date = coalesce(events.end_date, excluded.end_date),
  location = coalesce(events.location, excluded.location),
  logo_url = coalesce(events.logo_url, excluded.logo_url);

insert into public.event_booths (event_slug, booth_number, display_order)
select 'vax-2026', booth_number, display_order
from (
  select 'SA' || lpad(n::text, 2, '0') as booth_number, n as display_order from generate_series(1, 11) n
  union all select 'SB' || lpad(n::text, 2, '0'), 11 + n from generate_series(1, 11) n
  union all select 'SC' || lpad(n::text, 2, '0'), 22 + n from generate_series(1, 10) n
  union all select 'SD' || lpad(n::text, 2, '0'), 32 + n from generate_series(1, 10) n
  union all select 'SE' || lpad(n::text, 2, '0'), 42 + n from generate_series(1, 11) n
  union all select 'SF' || lpad(n::text, 2, '0'), 53 + n from generate_series(1, 5) n
  union all select 'R' || lpad(n::text, 2, '0'), 58 + n from generate_series(1, 30) n
) booths
on conflict (event_slug, booth_number) do nothing;

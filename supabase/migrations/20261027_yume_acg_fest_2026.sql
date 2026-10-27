-- Add Yume ACG Fest 2026 and its Artist Alley booth index.
-- The map's A05 and A06 squares can both link to a single catalogue row
-- entered with booth_number 'A05-A06'.
alter table public.catalogue_entries
  add column if not exists stamp_rally_note text;

-- Earlier manual imports can leave serial IDs behind their table rows.
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
  slug, name, year, display_order, is_upcoming, entry_status, logo_url
)
values (
  'yume-acg-2026', 'Yume ACG Fest 2026', 2026, 5, true, 'TBA', '/events/yume-acg-fest.png'
)
on conflict (slug) do update set
  name = excluded.name,
  year = excluded.year,
  display_order = excluded.display_order,
  is_upcoming = true,
  logo_url = excluded.logo_url;

insert into public.event_booths (event_slug, booth_number, display_order)
select 'yume-acg-2026', 'A' || lpad(number::text, 2, '0'), number
from generate_series(1, 28) as booth(number)
on conflict (event_slug, booth_number) do nothing;

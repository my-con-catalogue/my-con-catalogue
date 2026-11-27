-- Add ACG Mart 2026 / 3.0 and its R01–R21 booth index.
-- Event details: 27–29 November 2026, 12:00 PM–12:00 AM, free entry at Lalaport Bukit Bintang City Centre. Instagram: @jcosclub.

-- Keep serial sequences ahead of manually imported IDs before inserting rows.
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
  location, instagram, entry_status, description, logo_url
)
values (
  'acg-mart-2026-3', 'ACG Mart 2026 / 3.0', 2026, 7, true, '2026-11-27', '2026-11-29',
  'Lalaport Bukit Bintang City Centre, Level 2 (ACG Base)', 'jcosclub', 'Free entry', '12:00 PM–12:00 AM.',
  '/events/acg-mart-2026-3-logo.png'
)
on conflict (slug) do update set
  name = excluded.name,
  year = excluded.year,
  display_order = excluded.display_order,
  is_upcoming = excluded.is_upcoming,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  location = coalesce(excluded.location, events.location),
  instagram = coalesce(excluded.instagram, events.instagram),
  entry_status = excluded.entry_status,
  description = coalesce(excluded.description, events.description),
  logo_url = excluded.logo_url;

insert into public.event_booths (event_slug, booth_number, display_order)
select 'acg-mart-2026-3', 'R' || lpad(number::text, 2, '0'), number
from generate_series(1, 21) as booth(number)
on conflict (event_slug, booth_number) do update set display_order = excluded.display_order;

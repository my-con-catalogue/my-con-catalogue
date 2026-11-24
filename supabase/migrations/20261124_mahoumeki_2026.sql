-- Add Mahoumeki 2026 and the public Artist Alley booth index.
-- Sponsor booths 17 and 18 are intentionally omitted from the catalogue booth list.
-- The two map tiles 19 and 20 can both point to one catalogue entered as booth_number '19-20'.

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
  location, entry_status, description, logo_url
)
values (
  'mahoumeki-2026', 'Mahoumeki 2026', 2026, 6, true,
  '2026-11-27', '2026-11-28', 'The Ship Campus, Level 2, Batu Kawan, Penang',
  'Free entry', 'Come spend the day with us, 11 AM–7 PM both days.',
  '/events/mahoumeki-2026-logo.png'
)
on conflict (slug) do update set
  name = excluded.name,
  year = excluded.year,
  display_order = excluded.display_order,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  location = excluded.location,
  is_upcoming = true,
  entry_status = excluded.entry_status,
  description = excluded.description,
  logo_url = excluded.logo_url;

insert into public.event_booths (event_slug, booth_number, display_order)
values
  ('mahoumeki-2026', '01', 1),
  ('mahoumeki-2026', '02', 2),
  ('mahoumeki-2026', '03', 3),
  ('mahoumeki-2026', '04', 4),
  ('mahoumeki-2026', '05', 5),
  ('mahoumeki-2026', '06', 6),
  ('mahoumeki-2026', '07', 7),
  ('mahoumeki-2026', '08', 8),
  ('mahoumeki-2026', '09', 9),
  ('mahoumeki-2026', '10', 10),
  ('mahoumeki-2026', '11', 11),
  ('mahoumeki-2026', '12', 12),
  ('mahoumeki-2026', '13', 13),
  ('mahoumeki-2026', '14', 14),
  ('mahoumeki-2026', '15', 15),
  ('mahoumeki-2026', '16', 16),
  ('mahoumeki-2026', '19', 19),
  ('mahoumeki-2026', '20', 20)
on conflict (event_slug, booth_number) do update set display_order = excluded.display_order;

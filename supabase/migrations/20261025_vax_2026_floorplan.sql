-- Add VAX 2026 if it is not already in the event list, then register all
-- yellow Standard Artist Alley and Rahmah table booths for the booth index.
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

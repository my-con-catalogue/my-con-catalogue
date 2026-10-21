-- Add Otakyun 2026 and its CR booth list for the interactive floor plan.
insert into public.events (slug, name, year, display_order, is_upcoming, entry_status, logo_url)
values ('otakyun-2026', 'Otakyun 2026', 2026, 3, true, 'TBA', '/events/otakyun.png')
on conflict (slug) do nothing;

insert into public.event_booths (event_slug, booth_number, display_order)
select 'otakyun-2026', 'CR' || lpad(booth_number::text, 2, '0'), booth_number
from generate_series(1, 38) as booth(booth_number)
on conflict (event_slug, booth_number) do nothing;

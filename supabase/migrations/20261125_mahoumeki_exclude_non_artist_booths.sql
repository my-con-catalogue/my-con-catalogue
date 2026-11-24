-- Exclude non-Artist-Alley booths from the catalogue booth index:
-- 16 is Peninsula College Student Council; 19–20 are Komodo Range Studio.
delete from public.event_booths
where event_slug = 'mahoumeki-2026'
  and booth_number in ('16', '19', '20');

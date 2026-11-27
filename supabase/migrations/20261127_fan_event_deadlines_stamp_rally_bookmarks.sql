-- Optional date for fan-event registration cutoffs.
alter table public.fan_cafes
  add column if not exists registration_deadline date;
alter table public.fan_cafe_submissions
  add column if not exists registration_deadline date;

-- Record the required participation method on public stamp-rally listings.
alter table public.stamp_rallies
  add column if not exists method text;

-- Required fields collected by the stamp-rally submission form. Defaults backfill
-- existing submissions; dropping them ensures all new form writes provide a value.
alter table public.stamp_rally_submissions
  add column if not exists prizes text not null default 'Not provided',
  add column if not exists method text not null default 'Not provided';
alter table public.stamp_rally_submissions
  alter column prizes drop default,
  alter column method drop default;

-- Stamp-rally bookmarks use event-slug:sr-id keys alongside numeric booth keys.
alter table public.mcc_user_bookmarks
  drop constraint if exists mcc_user_bookmarks_key_format;
alter table public.mcc_user_bookmarks
  add constraint mcc_user_bookmarks_key_format
  check (catalogue_key ~ '^[a-z0-9-]+:([0-9]+|sr-[0-9]+)$');

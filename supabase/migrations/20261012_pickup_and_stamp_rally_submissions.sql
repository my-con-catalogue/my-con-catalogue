-- Run once on an existing database before deploying the matching website update.

alter table public.catalogue_entries
  add column if not exists catalogue_type text not null default 'booth_catalogue';

alter table public.catalogue_entries
  drop constraint if exists catalogue_entries_catalogue_type_check;

alter table public.catalogue_entries
  add constraint catalogue_entries_catalogue_type_check
  check (catalogue_type in ('booth_catalogue', 'pickup_only'));

-- Booth numbers must be unique for regular booths, but many pickup entries can use PO only.
drop index if exists public.catalogue_entries_event_booth_idx;
create unique index if not exists catalogue_entries_event_booth_idx
  on public.catalogue_entries(event_slug, booth_number)
  where catalogue_type = 'booth_catalogue';

alter table public.artist_submissions
  add column if not exists social_media_handle text;
update public.artist_submissions
  set social_media_handle = instagram
  where social_media_handle is null and instagram is not null;
alter table public.artist_submissions
  alter column instagram drop not null;
alter table public.artist_submissions
  alter column email drop not null;

create table if not exists public.stamp_rally_submissions (
  id serial primary key,
  artist_names text not null,
  social_media_handles text not null,
  event_name text not null,
  fandom text not null,
  post_link text,
  upload_file_path text,
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists stamp_rally_submissions_created_at_idx
  on public.stamp_rally_submissions(created_at desc);

-- Form submissions can contain personal/social contact details; keep them off
-- the public and authenticated Data API. Server-side service-role access only.
grant select, insert, update, delete on public.stamp_rally_submissions to service_role;

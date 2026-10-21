-- Run once on an existing Supabase database before deploying the website code.
create table if not exists public.event_booths (
  id serial primary key,
  event_slug text not null references public.events(slug) on delete cascade,
  booth_number text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists event_booths_event_booth_idx
  on public.event_booths(event_slug, booth_number);

create index if not exists event_booths_event_order_idx
  on public.event_booths(event_slug, display_order, id);

-- Explicit Data API grants for tables created in this migration.
grant select on public.event_booths to anon;
grant select, insert, update, delete on public.event_booths to authenticated;
grant select, insert, update, delete on public.event_booths to service_role;

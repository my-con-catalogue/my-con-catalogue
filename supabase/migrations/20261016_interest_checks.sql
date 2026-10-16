create table if not exists public.interest_checks (
  id serial primary key,
  title text not null,
  social_post_url text,
  type text not null,
  event_name text not null,
  year integer not null,
  start_date date not null default ((now() at time zone 'Asia/Kuala_Lumpur')::date),
  cutoff_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists interest_checks_year_cutoff_idx
  on public.interest_checks(year, cutoff_date);

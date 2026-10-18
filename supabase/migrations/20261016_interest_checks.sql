create table if not exists public.interest_checks (
  id serial primary key,
  title text not null,
  social_post_url text,
  type text not null,
  event_name text not null,
  year integer not null,
  cutoff_date date,
  created_at timestamptz not null default now()
);

create index if not exists interest_checks_year_cutoff_idx
  on public.interest_checks(year, cutoff_date);

-- Interest checks do not use a start date, and the cutoff date is optional.
alter table public.interest_checks drop column if exists start_date;
alter table public.interest_checks alter column cutoff_date drop not null;

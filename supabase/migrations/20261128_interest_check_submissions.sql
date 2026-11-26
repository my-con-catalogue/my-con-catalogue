create table if not exists public.interest_check_submissions (
  id serial primary key,
  interest_check_name text not null,
  post_link text not null,
  type text not null,
  other_type text,
  fandom text not null,
  event_name text,
  cutoff_date date,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists interest_check_submissions_created_at_idx
  on public.interest_check_submissions(created_at desc);

revoke all on public.interest_check_submissions from anon, authenticated;
grant select, insert, update, delete on public.interest_check_submissions to service_role;

-- Personal calendar reminders are private account data, read and changed only
-- through authenticated server actions using the database connection.
create table if not exists public.mcc_user_calendar_items (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_key text not null,
  category text not null check (category in ('event', 'fan_event', 'interest_check', 'pickup_cutoff')),
  title text not null check (char_length(title) between 1 and 160),
  detail text not null default '' check (char_length(detail) <= 240),
  item_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, source_key),
  constraint mcc_user_calendar_source_key_length check (char_length(source_key) between 1 and 180)
);

create index if not exists mcc_user_calendar_items_user_date_idx
  on public.mcc_user_calendar_items(user_id, item_date);

revoke all on public.mcc_user_calendar_items from public, anon, authenticated;
grant select, insert, update, delete on public.mcc_user_calendar_items to service_role;
grant usage, select on sequence public.mcc_user_calendar_items_id_seq to service_role;

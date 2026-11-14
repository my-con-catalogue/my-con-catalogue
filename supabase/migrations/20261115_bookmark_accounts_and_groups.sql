-- Persistent bookmark accounts and event-scoped shared bookmark groups.
-- Account passwords are handled by Supabase Auth; this migration never stores passwords.
-- The website accesses these tables only through server-side DATABASE_URL queries after
-- checking the signed-in Supabase Auth user. They are intentionally not exposed through
-- the public Data API roles.

create table if not exists public.mcc_usernames (
  username text not null,
  username_key text primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint mcc_usernames_username_format check (username_key ~ '^[a-z0-9_]{3,24}$')
);

create table if not exists public.mcc_user_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  catalogue_key text not null,
  label_name text not null default '',
  label_color text not null default 'blue' check (label_color in ('rose', 'blue', 'amber', 'green')),
  memo text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, catalogue_key),
  constraint mcc_user_bookmarks_key_format check (catalogue_key ~ '^[a-z0-9-]+:[0-9]+$'),
  constraint mcc_user_bookmarks_label_length check (char_length(label_name) <= 32),
  constraint mcc_user_bookmarks_memo_length check (char_length(memo) <= 500)
);
create index if not exists mcc_user_bookmarks_key_idx on public.mcc_user_bookmarks(catalogue_key);

-- Store only a one-way digest of the one-time recovery code. Never store the code itself.
create table if not exists public.mcc_user_recovery_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  recovery_code_hash bytea not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.mcc_bookmark_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  event_slug text not null references public.events(slug) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique check (invite_code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.mcc_bookmark_group_members (
  group_id uuid not null references public.mcc_bookmark_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists mcc_bookmark_group_members_user_idx on public.mcc_bookmark_group_members(user_id);

-- Basic abuse guard for the server action that creates synthetic-email accounts.
-- Only a keyed one-way digest of the request IP is stored, and counters roll over hourly.
create table if not exists public.mcc_account_signup_limits (
  ip_hash text primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0
);

-- Group pages share each member's saved bookmarks for the event selected when the group
-- was created. Keep these tables inaccessible to anon/authenticated Data API clients.
revoke all on public.mcc_usernames, public.mcc_user_bookmarks, public.mcc_user_recovery_codes, public.mcc_bookmark_groups, public.mcc_bookmark_group_members, public.mcc_account_signup_limits from public, anon, authenticated;

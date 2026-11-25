-- Track each username change so the server can enforce a rolling 24-hour limit.
alter table public.mcc_usernames
  add column if not exists username_changed_at timestamptz;

-- Shared-list renames use the existing name column. Owner authorization is enforced
-- in the server action by matching owner_user_id to the authenticated user.

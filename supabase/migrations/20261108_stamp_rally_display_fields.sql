-- Add the details needed by the event-level Stamp Rally catalogue tab.
alter table public.stamp_rallies
  add column if not exists social_post_url text,
  add column if not exists fandom text,
  add column if not exists prizes text;

-- Keep the current public archive readable and the Supabase dashboard fully editable.
grant select on public.stamp_rallies to anon;
grant select, insert, update, delete on public.stamp_rallies to authenticated;
grant select, insert, update, delete on public.stamp_rallies to service_role;

-- Allow manually managed interest-check status and optional fandom display.
alter table public.interest_checks add column if not exists fandom text;
alter table public.interest_checks add column if not exists status text;

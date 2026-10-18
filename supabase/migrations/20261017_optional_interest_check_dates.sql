-- Interest checks no longer store a start date; cutoff dates are optional.
alter table public.interest_checks drop column if exists start_date;
alter table public.interest_checks alter column cutoff_date drop not null;

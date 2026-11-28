-- Change existing pick-up catalogue labels from PU to PO.
-- This only updates pick-up entries and is safe to run more than once.
update public.catalogue_entries
set booth_number = regexp_replace(booth_number, '^PU', 'PO', 'i')
where catalogue_type = 'pickup_only'
  and booth_number ~* '^PU';

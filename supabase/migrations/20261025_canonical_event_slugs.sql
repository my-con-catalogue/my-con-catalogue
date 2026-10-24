-- Rename the existing VAX and CAFKL slugs without losing linked catalogue,
-- booth, legacy catalogue, or stamp-rally rows. Safe to rerun.
do $$
declare
  slug_change record;
  old_event public.events%rowtype;
  target_event_id integer;
  sequence_name text;
  highest_id bigint;
  sequence_value bigint;
begin
  for slug_change in
    select * from (values
      ('visual-arts-expo-2026', 'vax-2026'),
      ('comic-art-festival-kuala-lumpur-caf-kl-2027', 'caf-kl-2027')
    ) as changes(old_slug, new_slug)
  loop
    select * into old_event from public.events where slug = slug_change.old_slug;
    if not found then
      continue;
    end if;

    select id into target_event_id from public.events where slug = slug_change.new_slug;
    if target_event_id is null then
      sequence_name := pg_get_serial_sequence('public.events', 'id');
      if sequence_name is not null then
        execute 'select coalesce(max(id), 0) from public.events' into highest_id;
        execute format('select last_value from %s', sequence_name::regclass) into sequence_value;
        perform setval(sequence_name::regclass, greatest(highest_id, sequence_value), true);
      end if;

      insert into public.events (
        slug, name, year, display_order, logo_url, is_upcoming, start_date,
        end_date, location, instagram, entry_status, description, created_at
      ) values (
        slug_change.new_slug, old_event.name, old_event.year, old_event.display_order,
        old_event.logo_url, old_event.is_upcoming, old_event.start_date,
        old_event.end_date, old_event.location, old_event.instagram,
        old_event.entry_status, old_event.description, old_event.created_at
      ) returning id into target_event_id;
    end if;

    update public.catalogue_entries
      set event_slug = slug_change.new_slug
      where event_slug = slug_change.old_slug;
    delete from public.event_booths old_booth
      where old_booth.event_slug = slug_change.old_slug
        and exists (
          select 1 from public.event_booths new_booth
          where new_booth.event_slug = slug_change.new_slug
            and new_booth.booth_number = old_booth.booth_number
        );
    update public.event_booths
      set event_slug = slug_change.new_slug
      where event_slug = slug_change.old_slug;
    update public.catalogues
      set event_id = target_event_id
      where event_id = old_event.id;
    update public.stamp_rallies
      set event_id = target_event_id
      where event_id = old_event.id;

    delete from public.events where id = old_event.id;
  end loop;
end $$;

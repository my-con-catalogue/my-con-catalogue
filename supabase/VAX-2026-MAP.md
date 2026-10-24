# VAX 2026 interactive floor plan

The event page uses `vax-2026` as its event slug. To add the event if it is missing and populate its booth index in Supabase, run `migrations/20261025_vax_2026_floorplan.sql` in the SQL Editor.

Enter catalogue rows in `catalogue_entries` with `event_slug` set to `vax-2026`. Use booth labels `SA01`–`SA11`, `SB01`–`SB11`, `SC01`–`SC10`, `SD01`–`SD10`, `SE01`–`SE11`, `SF01`–`SF05`, and `R01`–`R30`. The right-side floorplan labels `01`–`30` map to catalogue booth codes `R01`–`R30`. Combined booth labels such as `R01-R02` are also recognized.

The yellow Standard Artist Alley and Rahmah-table squares become clickable when a matching booth catalogue exists. Purple C01–C06 Cosplayer booths remain gray and inactive.

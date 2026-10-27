# Yume ACG Fest 2026

Event slug: `yume-acg-2026`  
Event catalogue rows use `event_slug = yume-acg-2026` and booth labels `A01` through `A28`.

The interactive floor plan links A05 and A06 to a combined catalogue row entered as `A05-A06` (an en dash is also accepted). The setup migration adds the event and expected booth numbers to `events` and `event_booths`.

For a stamp-rally catalogue, set `stamp_rally` to `true` and optionally enter a public note in `stamp_rally_note`, such as `1. Miku Stamp Rally  2. Valko Stamp Rally`. The note appears on the catalogue card and detail page.

To set up an existing Supabase project, run the contents of `migrations/20261027_yume_acg_fest_2026.sql` in the SQL Editor before deploying the matching app code.

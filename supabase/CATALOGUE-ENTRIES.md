# Adding artist alley catalogue entries

Run `schema.sql` in the Supabase SQL Editor after setting up the project. The website reads its public event catalogue cards from the `catalogue_entries` table.

To add a booth, open **Supabase → Table Editor → catalogue_entries → Insert row** and fill in:

| Column | What to enter |
| --- | --- |
| `event_slug` | The event slug, such as `anime-fest-2026` |
| `catalogue_type` | `booth_catalogue` for an artist alley booth; `pickup_only` for a pick-up-only catalogue |
| `booth_number` | Booth number, such as `A01` |
| `pickup_note` | Optional pick-up details, such as an order cutoff or which day collection is available. Shown only for pick-up entries. |
| `artist_name` | Artist or circle name |
| `artist_instagrams` | Instagram handles, with or without `@`. This can be empty if you enter an account in `artist_social_links`. |
| `artist_social_links` | Full public profile URLs for X/Twitter, Facebook, or other social accounts. Example: `{"https://x.com/example","https://facebook.com/example"}`. Use full URLs because Facebook pages do not always have a simple handle. |
| `fandom_tags` | Array of fandom tags |
| `merch_tags` | Array of merchandise types |
| `stamp_rally` | `true` or `false` |
| `instagram_post_urls` | One to three public Instagram post URLs. Leave empty when using file URLs instead. |
| `catalogue_file_urls` | Public URLs to catalogue PDF/image files (for example, in a public Supabase Storage bucket). Use this when there are no Instagram catalogue posts. |

The event page separates `booth_catalogue` and `pickup_only` entries into tabs. Booth catalogues sort by booth number; pick-up entries can share `booth_number` set to `PO only` and sort by artist name. Only booth catalogues require a unique booth number per event. Each catalogue detail page embeds Instagram posts when provided, or displays PDF/image files from `catalogue_file_urls` when there are no Instagram catalogue posts. The artist directory combines matching Instagram handles and social URLs, removes duplicates, and displays every linked account. Put Instagram handles in `artist_instagrams`; put X, Facebook, and other account profile URLs in `artist_social_links`. At least one of these two social-account fields must have a value. Run `migrations/20261015_artist_social_links.sql` on an existing Supabase project before deploying this code. The database does not require catalogue material, so an entry can display “Catalogue unavailable” until you add a post, link, or file.

Artist catalogue uploads submitted through the public form are stored privately in `catalogue-submissions` for review. To publish an approved upload, copy it into a public bucket (for example, `catalogues`), copy its public URL into `catalogue_file_urls`, and leave `instagram_post_urls` empty. Do not make the private bucket public. The separate Stamp Rally form writes review data to `stamp_rally_submissions`; its optional upload stays private in the same bucket under `stamp-rally-submissions/`.

## Configure the booth-number list for an event

The event page also shows every booth number entered in the `event_booths` table. Booths with a catalogue are colored and link directly to that catalogue; booths without a catalogue are gray. Catalogue booths are also added automatically, so you do not need to duplicate them in `event_booths` unless you want to control their order.

In **Supabase → Table Editor → event_booths → Insert row**, add one row per expected booth:

| Column | What to enter |
| --- | --- |
| `event_slug` | The event slug, e.g. `anime-fest-2026` |
| `booth_number` | The exact booth label, e.g. `A-01` |
| `display_order` | Optional list position; use 1, 2, 3… to set the order |

Repeat for each booth at that event. Leave `display_order` as `0` to keep the booths in the order you added them, or use 1, 2, 3… to set a custom order. The same booth label may be used at another event because booth numbers are unique per event. To add many booths at once, use the Table Editor's CSV import with the columns `event_slug,booth_number,display_order`. The new table is created by `schema.sql` for a fresh database; for an existing site, run `migrations/20261011_event_booths.sql` if needed, followed by `migrations/20261012_pickup_and_stamp_rally_submissions.sql`, before deploying the matching code.

Keep the `DATABASE_URL` in the server-side environment only. Do not put database credentials in client-side code.

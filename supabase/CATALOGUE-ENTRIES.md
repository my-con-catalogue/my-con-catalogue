# Adding artist alley catalogue entries

Run `schema.sql` in the Supabase SQL Editor after setting up the project. The website reads its public event catalogue cards from the `catalogue_entries` table.

To add a booth, open **Supabase → Table Editor → catalogue_entries → Insert row** and fill in:

| Column | What to enter |
| --- | --- |
| `event_slug` | The event slug, such as `anime-fest-2026` |
| `booth_number` | Booth number, such as `A01` |
| `artist_name` | Artist or circle name |
| `artist_instagrams` | Array of Instagram handles, with or without `@` |
| `fandom_tags` | Array of fandom tags |
| `merch_tags` | Array of merchandise types |
| `stamp_rally` | `true` or `false` |
| `instagram_post_urls` | One to three public Instagram post URLs. Leave empty when using file URLs instead. |
| `catalogue_file_urls` | Public URLs to catalogue PDF/image files (for example, in a public Supabase Storage bucket). Use this when there are no Instagram catalogue posts. |

The event page sorts entries by booth number and displays catalogue links instead of artist logos. Each catalogue detail page embeds Instagram posts when provided, or displays PDF/image files from `catalogue_file_urls` when there are no Instagram catalogue posts. The artist directory combines handles from matching artist entries, removes duplicates, and displays every linked account. Enter all artist accounts in `artist_instagrams` on each relevant entry. The database requires at least one Instagram post URL or one public catalogue file URL.

Artist uploads submitted through the public form are stored privately for review. To publish an approved upload, copy it into a public bucket (for example, `catalogues`), copy its public URL into `catalogue_file_urls`, and leave `instagram_post_urls` empty. Do not make the private `catalogue-submissions` bucket public.

Keep the `DATABASE_URL` in the server-side environment only. Do not put database credentials in client-side code.

# Malaysia Convention Catalogue

MYConCatalogue is a community archive for Malaysian convention Artist Alleys, catalogues, Stamp Rallies, Fan Cafes, and artists. The site uses Next.js, Drizzle ORM, and Supabase Postgres.

## Run locally

1. Install Node.js and pnpm, then run `pnpm install`.
2. Create a Supabase project and run `supabase/schema.sql` in its SQL Editor.
3. Copy `.env.example` to `.env.local` and enter the Supabase database pooler URI and server-side Storage values. Never commit `.env.local`.
4. Create the private `catalogue-submissions` Storage bucket.
5. Run `pnpm dev`.

With `DATABASE_URL` configured, pages read event, catalogue, and fan cafe data from Supabase. Without it, the site uses local preview data and submissions cannot be saved. The public cafe submission form sends entries to `fan_cafe_submissions` for review; it does not publish them automatically.

Before pushing changes, run `pnpm typecheck` and `pnpm build`. The production build uses Webpack and Next.js `next/font/google`; it downloads and self-hosts DM Sans and Bricolage Grotesque during the build, so the build environment needs access to Google Fonts.

Event catalogue listings paginate at 20 booths per page; catalogue search and filters apply across the full event. Fan Cafe year filters are generated automatically from listing dates, so adding a future year to Supabase adds its year filter to the page.

## Adding fan cafes

To publish an approved cafe, open **Supabase → Table Editor → `fan_cafes` → Insert row** and enter its name, fandom, location, date, start/end time, and Instagram post URL. The site embeds the post and lists the event automatically. See [DEPLOYMENT.md](./DEPLOYMENT.md#adding-future-fan-cafes) for the columns and formats.

## Deploy

Follow [DEPLOYMENT.md](./DEPLOYMENT.md) to prepare Supabase, push the project to GitHub, connect it to Vercel, and configure environment variables.

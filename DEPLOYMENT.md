# Put MYConCatalogue online

This project is a Next.js website backed by Supabase Postgres. GitHub stores the source; Vercel builds and hosts the website; Supabase stores event, catalogue, fan cafe, and form data.

## 1. Put the project on GitHub

1. Download and unzip `malaysia-convention-catalogues-updated.zip`.
2. Install Node.js and pnpm if they are not installed, then open Terminal and change directory to the unzipped `malaysia-convention-catalogues` folder — the folder containing `package.json`.
3. Install dependencies and check the project before uploading:

   ```sh
   pnpm install
   pnpm typecheck
   pnpm build
   ```

   The production build uses Webpack and `next/font/google`. It fetches DM Sans and Bricolage Grotesque during the build, so the build machine needs outbound access to Google Fonts. On a timeout, check the build environment's network access; the project code should not need Google Fonts credentials.

4. Create a new, empty GitHub repository named `malaysia-convention-catalogue`. Do not add a README or license at creation; this project already has its own files.
5. In Terminal, run the following from the project folder, replacing the URL with the HTTPS URL shown by GitHub:

   ```sh
   git init -b main
   git add .
   git commit -m "Initial MYConCatalogue website"
   git remote add origin https://github.com/YOUR-USERNAME/malaysia-convention-catalogue.git
   git push -u origin main
   ```

`.env.local` is ignored by Git. Never commit database passwords or the Supabase service role key. The committed `.env.example` contains placeholders only.

If Git reports that your author identity is not set, configure your name and email with `git config --global user.name "Your Name"` and `git config --global user.email "you@example.com"`, then repeat the commit.

## 2. Create and prepare Supabase

1. Create a Supabase project and save its database password somewhere safe.
2. In the Supabase dashboard, open **SQL Editor** and run `supabase/schema.sql` from this project. To do this, open the local SQL file, copy its contents, paste them into a new SQL Editor query, and click **Run**. It creates the tables and initial event/cafe data.
3. Run `supabase/seed-catalogue-entries.sql` in the SQL Editor to add the two initial Anime Fest! catalogue records. The cafe rows are already included in `schema.sql`; `supabase/seed-fan-cafes.sql` is a safe, repeatable option to add just the two October cafes to an existing project.
4. Open **Storage** and create a **private** bucket named `catalogue-submissions`. Artist-submitted files are stored there; keep the bucket private.
5. If an approved artist has catalogue files without Instagram posts, create a separate **public** Storage bucket named `catalogues`. After reviewing a submission, copy its file from the private `catalogue-submissions` bucket into `catalogues`, then paste the public file URL into that entry&apos;s `catalogue_file_urls` array in **Table Editor → catalogue_entries**. Keep original submissions private; only publish files the artist has submitted for the archive.
6. In the dashboard, click **Connect** and copy the **Transaction pooler** URI for the database. Replace its password. If the password includes reserved URL characters, URL-encode them before using the URI. This connection mode is intended for serverless deployments such as Vercel. See [Supabase database connection strings](https://supabase.com/docs/guides/database/connecting-to-postgres).

### Adding future fan cafes

The public Fan Cafes page reads directly from the Supabase `fan_cafes` table. To add an event:

1. Open **Table Editor → fan_cafes → Insert row**.
2. Fill in `name`, `fandom`, `location`, `start_date`, `start_time`, and `end_time`.
3. Put the Instagram post URL in `instagram_post_url` (for example, `https://www.instagram.com/p/POSTCODE/`). The post is embedded on the event card. Add an Instagram handle to `instagram` if you have one; it is optional.
4. Leave `id` and `created_at` empty so Postgres fills them in. Use `end_date` only for multi-day events and `description` for optional details.
5. Save the row. The cafe appears under its year, sorted with the closest upcoming date first. The page revalidates after 300 seconds; once that interval has elapsed, the next visit refreshes the cached page in the background, so reload after a short moment if the new row is not visible yet.

The public submission form writes to `fan_cafe_submissions` for review; it does not publish submissions automatically. After checking one, copy its approved details into `fan_cafes` using Table Editor. This keeps unverified submissions out of the public archive.

The Fan Cafes page creates year filters automatically from each listing&apos;s `start_date`. All Fan Cafes shows every year; choosing a year narrows the page to that year. Catalogue event pages show 20 booths per page. Search and tag filters apply to the event&apos;s complete catalogue list, and the page count updates to match the filtered results.

Useful value formats:

| Column | Example |
| --- | --- |
| `start_date`, `end_date` | `2026-10-17` |
| `start_time`, `end_time` | `11:00 AM`, `4:00 PM` |
| `instagram_post_url` | `https://www.instagram.com/p/DdtwtsfzAdZ/` |
| `instagram` | `event_account` or `@event_account` |

## 3. Connect Vercel to GitHub

1. Sign in to Vercel and choose **Add New → Project**.
2. Connect your GitHub account if asked, then import `malaysia-convention-catalogue`.
3. Set the **Root Directory** to the folder containing this project&apos;s `package.json` if Vercel does not select it automatically. Leave the framework as Next.js and use the detected install/build settings.
   The project build script runs `next build --webpack`. It keeps the Next.js Google font optimizer enabled; `next/font/google` downloads the configured fonts during the build and serves the generated font files with the site. The build machine therefore needs outbound access to Google Fonts. Vercel documents this build-time download and self-hosting behavior in its [Next.js deployment guide](https://vercel.com/docs/frameworks/full-stack/nextjs).
4. Before deploying, add the following **Environment Variables** in the project setup. Choose **Production**; optionally add them to **Preview** if you want preview deployments connected to the database too.

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Supabase Transaction pooler URI from **Connect** |
   | `SUPABASE_URL` | Supabase project URL, such as `https://PROJECT_REF.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Server-side service role key from Supabase API settings |
   | `SUPABASE_STORAGE_BUCKET` | `catalogue-submissions` |

   Keep all four variables private. Do not prefix them with `NEXT_PUBLIC_`. The service role key grants privileged access and must only be used by the server.

5. Deploy. Vercel builds the `main` branch and gives you a production URL. Add a custom domain later from **Project Settings → Domains** if you have one.

Vercel creates preview deployments for other branches and production deployments from the configured production branch. See [Vercel Git deployments](https://vercel.com/docs/git), [Vercel environment variables](https://vercel.com/docs/environment-variables), and [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).

## 4. Check the live site

Open the Vercel URL and check the home page, `/events`, `/fan-cafes`, `/artists`, and `/contact`. Add a test cafe row in Supabase and confirm it appears on `/fan-cafes` after the route refreshes. Submit one test cafe suggestion and confirm it appears in `fan_cafe_submissions` for review. Remove test records afterward if needed.

## 5. Publish future changes

Edit the project locally, then commit and push to GitHub:

```sh
git add .
git commit -m "Describe the change"
git push
```

Vercel automatically creates a deployment for the push. Pushes to `main` update production; pushes to another branch create a preview. Supabase data is stored separately and is not overwritten by website deployments.

## Local development (optional)

Install Node.js and pnpm, copy `.env.example` to `.env.local`, fill in the server-only values above, then run:

```sh
pnpm install
pnpm dev
```

Without `DATABASE_URL`, the site uses built-in preview data and submitted forms cannot be saved. Do not upload `.env.local` to GitHub or include it in a shared ZIP.

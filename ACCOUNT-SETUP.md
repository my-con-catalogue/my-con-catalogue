# Username accounts and shared bookmark lists

## What this adds

- Visitors may continue using browser-only bookmarks without an account.
- After a visitor creates an account or signs in on their usual browser, existing local bookmarks, color labels, and visit notes are merged into the account automatically. If a bookmark exists in both places, that browser's label and note are kept during the first merge; cloud data fills any missing local values. Once merged, bookmarks sync across signed-in devices.
- Shared lists are limited to one event. Each member's saved catalogues for that event, including their labels and notes, are visible to all list members. The usual fandom, merch, stamp-rally, member, and color filters are available on the shared-list page.
- Group members join with an 8-character invite code. Anyone who receives that code can join, so share it only with people you trust.
- Account creation is limited to five attempts per network address per hour to slow automated sign-ups. The counter stores a keyed one-way digest of the address, not the raw address. This is a basic speed bump, not complete spam protection: VPNs and changing networks can bypass it, and people sharing one network share the limit.
- Account passwords must be at least 8 characters and include an uppercase letter, a number, and a special character. Supabase Auth applies its own sign-in protections; do not expose the service-role key.

## Supabase setup

1. In the Supabase SQL Editor, open `supabase/migrations/20261115_bookmark_accounts_and_groups.sql` from this project.
2. Paste the full contents into a new SQL query and run it. If you already ran the earlier ZIP's version of this migration, rerun this updated SQL so the recovery-code table is created too; its table/index statements use `if not exists`.
3. In Supabase Project Settings → API, copy the project URL, the public anon/publishable key, and the server secret/service-role key.
4. In Vercel → Project → Settings → Environment Variables, use the Vercel–Supabase integration variables: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and server-only `SUPABASE_SECRET_KEY`. Keep the secret key server-only; never prefix it with `NEXT_PUBLIC_` or put it in client code. Legacy `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are supported as fallbacks.
5. Redeploy the site after adding the variable.

`POSTGRES_URL` must point to the same Supabase project because the app uses it for bookmark and group queries. The older `DATABASE_URL` name remains supported as a fallback.

## Password and account recovery

The user enters only a username and password. The app creates a non-deliverable internal email identity for Supabase Auth; no user's real email is requested. Supabase Auth stores passwords as salted bcrypt hashes, not reversible encryption, so the site owner cannot read or recover the password. New passwords must be at least 8 characters and include an uppercase letter, a number, and a special character.

When an account is created, the site shows a one-time recovery code. The code is random and only its SHA-256 hash is stored. The user should save it somewhere private. If they forget their password, they choose “Forgot password?”, enter their username, recovery code, and a new password. A successful reset invalidates the old code and shows a replacement code once. Existing accounts without a recovery code can generate one while signed in; signed-in users can replace a code if they lose it.

If a user loses both the password and recovery code, they can contact the site owner. The owner can set a temporary password for the existing Auth user through Supabase's trusted admin controls; this preserves their account and bookmarks. Never ask the owner to send or reveal the old password. Deleting the user is only a last resort. Auth user deletion cascades to its bookmarks, username mapping, and owned groups/memberships.

“Remember me” keeps the sign-in refresh cookie on that browser for up to one year (subject to Supabase Auth session limits). Without it, the session cookie is temporary. Neither choice protects against the user logging out, clearing browser data, or the Supabase project being removed. Account bookmarks are stored in the project's database, but no online service can promise data will never be erased; keep normal database backups.

## Table access

The new `mcc_*` tables are private server-side tables. The website queries them through `POSTGRES_URL` only after checking the Supabase Auth session and ownership/membership. The migration revokes Data API access for `anon` and `authenticated`; no browser database key can read them directly.

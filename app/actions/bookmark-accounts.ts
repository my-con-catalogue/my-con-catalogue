'use server'

import { cookies, headers } from 'next/headers'
import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { pool } from '@/lib/db'

const ACCESS_COOKIE = 'mcc_account_access'
const REFRESH_COOKIE = 'mcc_account_refresh'
const REMEMBER_COOKIE = 'mcc_account_remember'
const YEAR_SECONDS = 60 * 60 * 24 * 365
const VALID_COLORS = new Set(['rose', 'blue', 'amber', 'green'])

type AuthTokens = { access_token: string; refresh_token: string; expires_in?: number }
type AuthUser = { id: string; user_metadata?: { username?: string } }
type BookmarkValue = { key: string; labelName: string; labelColor: 'rose' | 'blue' | 'amber' | 'green'; memo: string }

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '')
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!url || !serviceKey || !anonKey) throw new Error('Account login is not configured on the server.')
  return { url, serviceKey, anonKey }
}

function usernameInput(value: string) {
  return value.trim().toLowerCase()
}

function createRecoveryCode() {
  return randomBytes(20).toString('hex').toUpperCase().match(/.{1,8}/g)!.join('-')
}

function recoveryCodeHash(code: string) {
  return createHash('sha256').update(code.toUpperCase().replaceAll('-', '')).digest()
}

function recoveryCodeInputIsValid(code: string) {
  return /^(?:[0-9a-f]{8}-){4}[0-9a-f]{8}$/i.test(code.trim())
}

async function allowAccountCreation() {
  const requestHeaders = await headers()
  const ip = requestHeaders.get('x-real-ip') ?? requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ipHash = createHmac('sha256', config().serviceKey).update(ip).digest('hex')
  const result = await pool.query<{ allowed: boolean }>(
    `insert into public.mcc_account_signup_limits (ip_hash, window_started_at, attempts)
     values ($1, now(), 1)
     on conflict (ip_hash) do update set
       attempts = case when mcc_account_signup_limits.window_started_at < now() - interval '1 hour' then 1 else mcc_account_signup_limits.attempts + 1 end,
       window_started_at = case when mcc_account_signup_limits.window_started_at < now() - interval '1 hour' then now() else mcc_account_signup_limits.window_started_at end
     returning attempts <= 5 as allowed`,
    [ipHash],
  )
  return result.rows[0]?.allowed === true
}

function accountEmail(username: string) {
  // Supabase Auth requires an email identity. This non-deliverable address is generated
  // from the user's chosen username; the site never asks for or stores their real email.
  return `${username}@accounts.my-con-catalogue.invalid`
}

function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    ...(maxAge === undefined ? {} : { maxAge }),
  }
}

async function saveSession(tokens: AuthTokens, remember: boolean) {
  const jar = await cookies()
  jar.set(ACCESS_COOKIE, tokens.access_token, cookieOptions(remember ? Math.max(60, tokens.expires_in ?? 3600) : undefined))
  jar.set(REFRESH_COOKIE, tokens.refresh_token, cookieOptions(remember ? YEAR_SECONDS : undefined))
  jar.set(REMEMBER_COOKIE, remember ? '1' : '0', cookieOptions(remember ? YEAR_SECONDS : undefined))
}

async function clearSession() {
  const jar = await cookies()
  jar.delete(ACCESS_COOKIE)
  jar.delete(REFRESH_COOKIE)
  jar.delete(REMEMBER_COOKIE)
}

async function authFetch(path: string, init: RequestInit = {}, useAdminKey = false) {
  const { url, serviceKey, anonKey } = config()
  const apiKey = useAdminKey ? serviceKey : anonKey
  return fetch(`${url}/auth/v1/${path}`, {
    ...init,
    headers: {
      apikey: apiKey,
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })
}

async function refreshSession(refreshToken: string, remember: boolean) {
  const response = await authFetch('token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!response.ok) return null
  const tokens = await response.json() as AuthTokens
  await saveSession(tokens, remember)
  return tokens.access_token
}

async function currentUser(): Promise<AuthUser | null> {
  const jar = await cookies()
  let accessToken = jar.get(ACCESS_COOKIE)?.value
  const refreshToken = jar.get(REFRESH_COOKIE)?.value
  const remember = jar.get(REMEMBER_COOKIE)?.value === '1'
  if (!accessToken && refreshToken) accessToken = await refreshSession(refreshToken, remember) ?? undefined
  if (!accessToken) return null

  const response = await authFetch('user', { headers: { authorization: `Bearer ${accessToken}` } })
  if (response.ok) return await response.json() as AuthUser
  if (response.status === 401 && refreshToken) {
    const refreshed = await refreshSession(refreshToken, remember)
    if (refreshed) {
      const retry = await authFetch('user', { headers: { authorization: `Bearer ${refreshed}` } })
      if (retry.ok) return await retry.json() as AuthUser
    }
  }
  await clearSession()
  return null
}

function validateBookmark(value: BookmarkValue) {
  if (!value || typeof value.key !== 'string' || !/^[a-z0-9-]+:\d+$/i.test(value.key)) return false
  if (typeof value.labelName !== 'string' || value.labelName.length > 32) return false
  if (!VALID_COLORS.has(value.labelColor)) return false
  if (typeof value.memo !== 'string' || value.memo.length > 500) return false
  return true
}

async function upsertBookmarks(userId: string, values: BookmarkValue[]) {
  const sanitized = values.filter(validateBookmark).slice(0, 1000)
  if (!sanitized.length) return
  await pool.query(
    `insert into public.mcc_user_bookmarks (user_id, catalogue_key, label_name, label_color, memo)
     select $1::uuid, item.key, item.label_name, item.label_color, item.memo
     from jsonb_to_recordset($2::jsonb) as item(key text, label_name text, label_color text, memo text)
     join public.catalogue_entries entry
       on entry.event_slug = split_part(item.key, ':', 1)
      and entry.id::text = split_part(item.key, ':', 2)
     on conflict (user_id, catalogue_key) do update set
       label_name = excluded.label_name,
       label_color = excluded.label_color,
       memo = excluded.memo,
       updated_at = now()`,
    [userId, JSON.stringify(sanitized.map((item) => ({ ...item, label_name: item.labelName, label_color: item.labelColor })))],
  )
}

export type AccountActionResult = { ok: boolean; message: string; recoveryCode?: string }

export async function createUsernameAccount(usernameRaw: string, password: string, remember: boolean): Promise<AccountActionResult> {
  const username = usernameInput(usernameRaw)
  if (!/^[a-z0-9_]{3,24}$/.test(username)) return { ok: false, message: 'Use a username of 3–24 letters, numbers, or underscores.' }
  if (password.length < 12 || password.length > 128) return { ok: false, message: 'Choose a password between 12 and 128 characters.' }

  try {
    if (!await allowAccountCreation()) return { ok: false, message: 'Too many account attempts from this network. Please try again in an hour.' }
    const existing = await pool.query('select 1 from public.mcc_usernames where username_key = $1 limit 1', [username])
    if (existing.rowCount) return { ok: false, message: 'That username is already taken.' }
    const createResponse = await authFetch('admin/users', {
      method: 'POST',
      headers: { authorization: `Bearer ${config().serviceKey}` },
      body: JSON.stringify({ email: accountEmail(username), password, email_confirm: true, user_metadata: { username } }),
    }, true)
    if (!createResponse.ok) return { ok: false, message: 'We could not create that account. Check the username and password and try again.' }
    const created = await createResponse.json() as { id: string }
    const recoveryCode = createRecoveryCode()
    try {
      const client = await pool.connect()
      try {
        await client.query('begin')
        await client.query('insert into public.mcc_usernames (username, username_key, user_id) values ($1, $2, $3::uuid)', [usernameRaw.trim(), username, created.id])
        await client.query('insert into public.mcc_user_recovery_codes (user_id, recovery_code_hash) values ($1::uuid, $2)', [created.id, recoveryCodeHash(recoveryCode)])
        await client.query('commit')
      } catch (error) {
        await client.query('rollback')
        throw error
      } finally {
        client.release()
      }
    } catch (error) {
      await authFetch(`admin/users/${created.id}`, { method: 'DELETE', headers: { authorization: `Bearer ${config().serviceKey}` } }, true)
      const errorCode = (error as { code?: string })?.code
      return errorCode === '23505'
        ? { ok: false, message: 'That username is already taken.' }
        : { ok: false, message: 'Account setup could not finish. Please confirm the Supabase migration has been run, then try again.' }
    }
    const loginResponse = await authFetch('token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email: accountEmail(username), password }),
    })
    if (!loginResponse.ok) {
      await authFetch(`admin/users/${created.id}`, { method: 'DELETE', headers: { authorization: `Bearer ${config().serviceKey}` } }, true)
      return { ok: false, message: 'We could not finish account setup. Please try creating the account again.' }
    }
    await saveSession(await loginResponse.json() as AuthTokens, remember)
    return { ok: true, message: 'Your account is ready. Save the recovery code shown now; it cannot be shown again.', recoveryCode }
  } catch {
    return { ok: false, message: 'Account setup is temporarily unavailable. Please try again later.' }
  }
}

export async function createRecoveryCodeForCurrentUser(): Promise<AccountActionResult> {
  const user = await currentUser()
  if (!user) return { ok: false, message: 'Sign in first.' }
  const recoveryCode = createRecoveryCode()
  const result = await pool.query(
    `insert into public.mcc_user_recovery_codes (user_id, recovery_code_hash) values ($1::uuid, $2)
     on conflict (user_id) do update set recovery_code_hash = excluded.recovery_code_hash, updated_at = now()
     returning user_id`,
    [user.id, recoveryCodeHash(recoveryCode)],
  )
  return { ok: true, message: 'Save this recovery code somewhere safe. It cannot be shown again; any older code is now invalid.', recoveryCode }
}

export async function resetPasswordWithRecoveryCode(usernameRaw: string, recoveryCodeRaw: string, newPassword: string): Promise<AccountActionResult> {
  const username = usernameInput(usernameRaw)
  const recoveryCode = recoveryCodeRaw.trim()
  if (!/^[a-z0-9_]{3,24}$/.test(username) || !recoveryCodeInputIsValid(recoveryCode) || newPassword.length < 12 || newPassword.length > 128) {
    return { ok: false, message: 'Username, recovery code, or new password is invalid.' }
  }

  const client = await pool.connect()
  try {
    await client.query('begin')
    const found = await client.query<{ user_id: string; recovery_code_hash: Buffer }>(
      `select u.user_id, r.recovery_code_hash
       from public.mcc_usernames u
       join public.mcc_user_recovery_codes r on r.user_id = u.user_id
       where u.username_key = $1
       for update of r`, [username])
    if (!found.rowCount) {
      await client.query('rollback')
      return { ok: false, message: 'The username or recovery code is incorrect.' }
    }
    const suppliedHash = recoveryCodeHash(recoveryCode)
    const storedHash = found.rows[0].recovery_code_hash
    if (storedHash.length !== suppliedHash.length || !timingSafeEqual(storedHash, suppliedHash)) {
      await client.query('rollback')
      return { ok: false, message: 'The username or recovery code is incorrect.' }
    }

    const replacementCode = createRecoveryCode()
    const { serviceKey } = config()
    const updateResponse = await authFetch(`admin/users/${found.rows[0].user_id}`, {
      method: 'PUT',
      headers: { authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ password: newPassword }),
    }, true)
    if (!updateResponse.ok) {
      await client.query('rollback')
      return { ok: false, message: 'Password reset is temporarily unavailable. Please try again.' }
    }
    await client.query('update public.mcc_user_recovery_codes set recovery_code_hash = $2, updated_at = now() where user_id = $1::uuid', [found.rows[0].user_id, recoveryCodeHash(replacementCode)])
    await client.query('commit')

    // Sign in on this device after the reset. If this request fails, the password is
    // still reset and the user can log in normally with the new password.
    try {
      const login = await authFetch('token?grant_type=password', {
        method: 'POST', body: JSON.stringify({ email: accountEmail(username), password: newPassword }),
      })
      if (login.ok) await saveSession(await login.json() as AuthTokens, false)
    } catch { /* Reset already succeeded; the login form remains available. */ }
    return { ok: true, message: 'Password reset. Save your replacement recovery code now.', recoveryCode: replacementCode }
  } catch {
    await client.query('rollback').catch(() => undefined)
    return { ok: false, message: 'Password reset is temporarily unavailable. Please try again.' }
  } finally {
    client.release()
  }
}

export async function loginUsernameAccount(usernameRaw: string, password: string, remember: boolean): Promise<AccountActionResult> {
  const username = usernameInput(usernameRaw)
  if (!/^[a-z0-9_]{3,24}$/.test(username) || !password) return { ok: false, message: 'Username or password is incorrect.' }
  try {
    const response = await authFetch('token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email: accountEmail(username), password }),
    })
    if (!response.ok) return { ok: false, message: 'Username or password is incorrect.' }
    await saveSession(await response.json() as AuthTokens, remember)
    return { ok: true, message: 'You are signed in.' }
  } catch {
    return { ok: false, message: 'Sign-in is temporarily unavailable. Please try again later.' }
  }
}

export async function logoutUsernameAccount(): Promise<void> {
  const jar = await cookies()
  const accessToken = jar.get(ACCESS_COOKIE)?.value
  if (accessToken) {
    try { await authFetch('logout', { method: 'POST', headers: { authorization: `Bearer ${accessToken}` } }) } catch { /* clear local session regardless */ }
  }
  await clearSession()
}

export async function getAccountOverview() {
  const user = await currentUser()
  if (!user) return { signedIn: false as const, username: null, groups: [], events: [] }
  const username = user.user_metadata?.username ?? ''
  const [groupsResult, eventsResult, recoveryResult] = await Promise.all([
    pool.query<{ id: string; name: string; event_slug: string; event_name: string; year: number; invite_code: string; role: string }>(
      `select g.id, g.name, g.event_slug, e.name as event_name, e.year, g.invite_code, m.role
       from public.mcc_bookmark_group_members m
       join public.mcc_bookmark_groups g on g.id = m.group_id
       join public.events e on e.slug = g.event_slug
       where m.user_id = $1::uuid order by g.created_at desc`, [user.id]),
    pool.query<{ slug: string; name: string; year: number }>('select slug, name, year from public.events order by year desc, display_order, name'),
    pool.query('select 1 from public.mcc_user_recovery_codes where user_id = $1::uuid', [user.id]),
  ])
  return {
    signedIn: true as const,
    username,
    hasRecoveryCode: Boolean(recoveryResult.rowCount),
    groups: groupsResult.rows.map((row) => ({ id: row.id, name: row.name, eventSlug: row.event_slug, eventName: row.event_name, year: row.year, inviteCode: row.invite_code, role: row.role })),
    events: eventsResult.rows.map((row) => ({ slug: row.slug, name: row.name, year: row.year })),
  }
}

export async function getCloudBookmarks() {
  const user = await currentUser()
  if (!user) return null
  const result = await pool.query<{ catalogue_key: string; label_name: string; label_color: BookmarkValue['labelColor']; memo: string }>(
    'select catalogue_key, label_name, label_color, memo from public.mcc_user_bookmarks where user_id = $1::uuid', [user.id])
  return {
    username: user.user_metadata?.username ?? '',
    bookmarks: result.rows.map((row) => ({ key: row.catalogue_key, labelName: row.label_name, labelColor: row.label_color, memo: row.memo })),
  }
}

export async function syncCloudBookmarks(values: BookmarkValue[]): Promise<AccountActionResult> {
  const user = await currentUser()
  if (!user) return { ok: false, message: 'Sign in to sync bookmarks.' }
  try {
    await upsertBookmarks(user.id, values)
    return { ok: true, message: 'Bookmarks synced.' }
  } catch {
    return { ok: false, message: 'Bookmarks remain saved on this device; cloud sync can be retried.' }
  }
}

export async function saveCloudBookmark(value: BookmarkValue): Promise<AccountActionResult> {
  if (!validateBookmark(value)) return { ok: false, message: 'Bookmark details are invalid.' }
  return syncCloudBookmarks([value])
}

export async function removeCloudBookmark(key: string): Promise<void> {
  if (!/^[a-z0-9-]+:\d+$/i.test(key)) return
  const user = await currentUser()
  if (!user) return
  await pool.query('delete from public.mcc_user_bookmarks where user_id = $1::uuid and catalogue_key = $2', [user.id, key])
}

function newInviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from(randomBytes(8), (value) => alphabet[value % alphabet.length]).join('')
}

export async function createBookmarkGroup(nameRaw: string, eventSlug: string): Promise<AccountActionResult> {
  const user = await currentUser()
  if (!user) return { ok: false, message: 'Sign in to create a shared list.' }
  const name = nameRaw.trim().slice(0, 60)
  if (!name) return { ok: false, message: 'Enter a name for the shared list.' }
  const event = await pool.query('select 1 from public.events where slug = $1', [eventSlug])
  if (!event.rowCount) return { ok: false, message: 'Choose a listed event.' }
  const client = await pool.connect()
  try {
    await client.query('begin')
    const id = randomUUID()
    const code = newInviteCode()
    await client.query('insert into public.mcc_bookmark_groups (id, name, event_slug, owner_user_id, invite_code) values ($1::uuid, $2, $3, $4::uuid, $5)', [id, name, eventSlug, user.id, code])
    await client.query("insert into public.mcc_bookmark_group_members (group_id, user_id, role) values ($1::uuid, $2::uuid, 'owner')", [id, user.id])
    await client.query('commit')
    return { ok: true, message: 'Shared list created. Share its invite code with friends.' }
  } catch {
    await client.query('rollback')
    return { ok: false, message: 'Could not create the shared list. Please try again.' }
  } finally { client.release() }
}

export async function joinBookmarkGroup(codeRaw: string): Promise<AccountActionResult> {
  const user = await currentUser()
  if (!user) return { ok: false, message: 'Sign in to join a shared list.' }
  const code = codeRaw.trim().toUpperCase()
  if (!/^[A-HJ-NP-Z2-9]{8}$/.test(code)) return { ok: false, message: 'Enter a valid 8-character invite code.' }
  const group = await pool.query<{ id: string }>('select id from public.mcc_bookmark_groups where invite_code = $1', [code])
  if (!group.rowCount) return { ok: false, message: 'That invite code was not found.' }
  await pool.query("insert into public.mcc_bookmark_group_members (group_id, user_id, role) values ($1::uuid, $2::uuid, 'member') on conflict do nothing", [group.rows[0].id, user.id])
  return { ok: true, message: 'You joined the shared list.' }
}

export async function leaveBookmarkGroup(groupId: string): Promise<AccountActionResult> {
  if (!/^[0-9a-f-]{36}$/i.test(groupId)) return { ok: false, message: 'That shared list could not be found.' }
  const user = await currentUser()
  if (!user) return { ok: false, message: 'Sign in first.' }
  const result = await pool.query("delete from public.mcc_bookmark_group_members where group_id = $1::uuid and user_id = $2::uuid and role <> 'owner'", [groupId, user.id])
  if (!result.rowCount) return { ok: false, message: 'Owners must delete the group from the account that created it.' }
  return { ok: true, message: 'You left the shared list.' }
}

export async function deleteBookmarkGroup(groupId: string): Promise<AccountActionResult> {
  if (!/^[0-9a-f-]{36}$/i.test(groupId)) return { ok: false, message: 'That shared list could not be found.' }
  const user = await currentUser()
  if (!user) return { ok: false, message: 'Sign in first.' }
  const result = await pool.query('delete from public.mcc_bookmark_groups where id = $1::uuid and owner_user_id = $2::uuid', [groupId, user.id])
  return result.rowCount ? { ok: true, message: 'Shared list deleted.' } : { ok: false, message: 'Only the owner can delete this list.' }
}

export async function getSharedBookmarkGroup(groupId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(groupId)) return { ok: false as const, message: 'This shared list is private or no longer exists.' }
  const user = await currentUser()
  if (!user) return { ok: false as const, message: 'Sign in to view shared lists.' }
  const memberCheck = await pool.query('select 1 from public.mcc_bookmark_group_members where group_id = $1::uuid and user_id = $2::uuid', [groupId, user.id])
  if (!memberCheck.rowCount) return { ok: false as const, message: 'This shared list is private or no longer exists.' }
  const result = await pool.query<{
    group_id: string; group_name: string; event_slug: string; event_name: string; year: number; invite_code: string; owner_user_id: string;
    member_user_id: string; username: string; role: string; catalogue_key: string | null; label_name: string | null; label_color: BookmarkValue['labelColor'] | null; memo: string | null;
    catalogue_id: number | null; booth_number: string | null; artist_name: string | null; fandom_tags: string[] | null; merch_tags: string[] | null; stamp_rally: boolean | null;
  }>(
    `select g.id as group_id, g.name as group_name, g.event_slug, e.name as event_name, e.year, g.invite_code, g.owner_user_id,
            m.user_id as member_user_id, u.username, m.role,
            b.catalogue_key, b.label_name, b.label_color, b.memo,
            c.id as catalogue_id, c.booth_number, c.artist_name, c.fandom_tags, c.merch_tags, c.stamp_rally
     from public.mcc_bookmark_groups g
     join public.events e on e.slug = g.event_slug
     join public.mcc_bookmark_group_members m on m.group_id = g.id
     join public.mcc_usernames u on u.user_id = m.user_id
     left join public.mcc_user_bookmarks b on b.user_id = m.user_id and b.catalogue_key like g.event_slug || ':%'
     left join public.catalogue_entries c on c.event_slug = g.event_slug and c.id::text = split_part(b.catalogue_key, ':', 2)
     where g.id = $1::uuid
     order by lower(u.username), lower(c.booth_number)`, [groupId])
  if (!result.rowCount) return { ok: false as const, message: 'This shared list is unavailable.' }
  const first = result.rows[0]
  const members = new Map<string, { username: string; role: string }>()
  const bookmarks: Array<{ key: string; username: string; booth: string; artistName: string; fandoms: string[]; merchTypes: string[]; stampRally: boolean; labelName: string; labelColor: BookmarkValue['labelColor']; memo: string; catalogueId: number }> = []
  for (const row of result.rows) {
    members.set(row.member_user_id, { username: row.username, role: row.role })
    if (row.catalogue_id === null || !row.catalogue_key || !row.booth_number || !row.artist_name) continue
    bookmarks.push({
      key: row.catalogue_key, username: row.username, booth: row.booth_number, artistName: row.artist_name,
      fandoms: row.fandom_tags ?? [], merchTypes: row.merch_tags ?? [], stampRally: Boolean(row.stamp_rally),
      labelName: row.label_name ?? '', labelColor: row.label_color ?? 'blue', memo: row.memo ?? '', catalogueId: row.catalogue_id,
    })
  }
  return {
    ok: true as const,
    group: { id: first.group_id, name: first.group_name, eventSlug: first.event_slug, eventName: first.event_name, year: first.year, inviteCode: first.invite_code, isOwner: first.owner_user_id === user.id },
    members: [...members.values()],
    bookmarks,
  }
}

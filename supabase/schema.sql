-- Run in the Supabase SQL Editor to create the tables used by this website.
create table if not exists events (
  id serial primary key,
  slug text not null unique,
  name text not null,
  year integer not null,
  display_order integer not null default 0,
  logo_url text,
  is_upcoming boolean not null default false,
  start_date date,
  end_date date,
  location text,
  instagram text,
  entry_status text not null default 'TBA',
  description text,
  created_at timestamptz not null default now()
);

alter table events add column if not exists display_order integer not null default 0;
alter table events add column if not exists logo_url text;
alter table events add column if not exists is_upcoming boolean not null default false;
alter table events add column if not exists entry_status text not null default 'TBA';

insert into events (slug, name, year, display_order, is_upcoming, start_date, end_date, location, instagram, logo_url, entry_status) values
  ('anime-fest-2026', 'Anime Fest! 2026 / 3', 2026, 1, true, '2026-10-17', '2026-10-18', 'Lalaport Bukit Bintang City Centre', 'comic_fiesta', '/events/anime-fest.png', 'Free entry'),
  ('comic-fiesta-2026', 'Comic Fiesta 2026', 2026, 2, true, '2026-12-19', '2026-12-20', 'Kuala Lumpur Convention Centre', 'comic_fiesta', '/events/comic-fiesta.png', 'Ticketed'),
  ('anime-fest-2027', 'Anime Fest! (2027)', 2027, 1, true, null, null, null, 'comic_fiesta', '/events/anime-fest.png', 'TBA'),
  ('anime-fest-plus-2027', 'Anime Fest! Plus (2027)', 2027, 2, true, null, null, null, 'comic_fiesta', '/events/anime-fest-plus.png', 'TBA'),
  ('cos-mic-2027', 'Cos-Mic (2027)', 2027, 3, true, null, null, null, 'cosmic_asia', '/events/cos-mic.jpg', 'TBA'),
  ('comic-art-festival-kuala-lumpur-caf-kl-2027', 'Comic Art Festival Kuala Lumpur (caf_kl) (2027)', 2027, 4, true, null, null, null, 'caf_kl', '/events/caf-kl.png', 'TBA'),
  ('animangaki-2027', 'AniManGaki (2027)', 2027, 5, true, null, null, null, 'animangaki', '/events/animangaki.png', 'TBA'),
  ('acg-base-market-2027', 'ACG Base Market (2027)', 2027, 6, true, null, null, null, 'acgbase.lalaport', '/events/acg-base.jpg', 'TBA'),
  ('costime-2027', 'CosTime (2027)', 2027, 7, true, null, null, null, 'jcosclub', '/events/costime.png', 'TBA'),
  ('comic-fiesta-2027', 'Comic Fiesta (2027)', 2027, 8, true, null, null, null, 'comic_fiesta', '/events/comic-fiesta.png', 'TBA'),
  ('nijigen-expo-2027', 'Nijigen Expo (2027)', 2027, 9, true, null, null, null, 'nijigenexpo', '/events/nijigen-expo.png', 'TBA')
on conflict (slug) do update set
  name = excluded.name,
  year = excluded.year,
  display_order = excluded.display_order,
  is_upcoming = excluded.is_upcoming,
  start_date = coalesce(excluded.start_date, events.start_date),
  end_date = coalesce(excluded.end_date, events.end_date),
  location = coalesce(excluded.location, events.location),
  instagram = coalesce(excluded.instagram, events.instagram),
  logo_url = coalesce(excluded.logo_url, events.logo_url),
  entry_status = excluded.entry_status;

create table if not exists artists (
  id serial primary key,
  slug text not null unique,
  name text not null,
  instagram text,
  bio text,
  created_at timestamptz not null default now()
);

create table if not exists catalogues (
  id serial primary key,
  event_id integer not null references events(id) on delete cascade,
  artist_id integer not null references artists(id) on delete cascade,
  booth text,
  image_url text,
  instagram_posts text[] not null default '{}',
  fandoms text[] not null default '{}',
  merch_types text[] not null default '{}',
  stamp_rally boolean not null default false,
  created_at timestamptz not null default now(),
  unique (event_id, artist_id)
);

alter table catalogues add column if not exists stamp_rally boolean not null default false;
alter table catalogues drop column if exists artist_logo_url;

-- Use this flat table in Supabase Table Editor to add catalogue display rows.
create table if not exists catalogue_entries (
  id serial primary key,
  event_slug text not null references events(slug) on delete cascade,
  booth_number text not null,
  artist_name text not null,
  artist_instagrams text[] not null default '{}',
  fandom_tags text[] not null default '{}',
  merch_tags text[] not null default '{}',
  stamp_rally boolean not null default false,
  instagram_post_urls text[] not null default '{}',
  catalogue_file_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  check (cardinality(artist_instagrams) >= 1),
  check ((cardinality(instagram_post_urls) between 1 and 3) or cardinality(catalogue_file_urls) > 0)
);

alter table catalogue_entries add column if not exists artist_instagrams text[] not null default '{}';
alter table catalogue_entries add column if not exists catalogue_file_urls text[] not null default '{}';
alter table catalogue_entries drop constraint if exists catalogue_entries_check;
alter table catalogue_entries add constraint catalogue_entries_check
  check ((cardinality(instagram_post_urls) between 1 and 3) or cardinality(catalogue_file_urls) > 0);
alter table catalogue_entries drop column if exists artist_logo_url;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'catalogue_entries' and column_name = 'artist_instagram'
  ) then
    execute format(
      'update public.catalogue_entries set artist_instagrams = array[%I] where cardinality(artist_instagrams) = 0 and %I is not null and %I <> %L',
      'artist_instagram', 'artist_instagram', 'artist_instagram', ''
    );
    alter table public.catalogue_entries drop column artist_instagram;
  end if;
end
$$;

create unique index if not exists catalogue_entries_event_booth_idx on catalogue_entries(event_slug, booth_number);

create table if not exists stamp_rallies (
  id serial primary key,
  event_id integer not null references events(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  participants text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists fan_cafes (
  id serial primary key,
  name text not null,
  fandom text,
  location text,
  start_date date,
  end_date date,
  instagram text,
  instagram_post_url text,
  start_time text,
  end_time text,
  description text,
  created_at timestamptz not null default now()
);

alter table fan_cafes add column if not exists instagram_post_url text;
alter table fan_cafes add column if not exists start_time text;
alter table fan_cafes add column if not exists end_time text;

create index if not exists fan_cafes_start_date_idx on fan_cafes(start_date desc);

insert into fan_cafes (name, fandom, location, start_date, instagram_post_url, start_time, end_time)
select 'Alien Stage CSE: The Grand Birthday Banquet', 'Alien Stage', 'Doutor Coffee, LaLaport BBCC', '2026-11-22', 'https://www.instagram.com/p/DdgiZpEJsSo/', '11:00 AM', '5:00 PM'
where not exists (select 1 from fan_cafes where instagram_post_url = 'https://www.instagram.com/p/DdgiZpEJsSo/');

insert into fan_cafes (name, fandom, location, start_date, instagram_post_url, start_time, end_time)
select 'Twisted Wonderland CSE: A Nightmare Before Christmas', 'Twisted Wonderland', 'Spillstone Coffee, Jalan Pudu', '2026-10-31', 'https://www.instagram.com/p/DbfJPaIxT_1/', '12:00 PM', '5:00 PM'
where not exists (select 1 from fan_cafes where instagram_post_url = 'https://www.instagram.com/p/DbfJPaIxT_1/');

insert into fan_cafes (name, fandom, location, start_date, instagram_post_url, start_time, end_time)
select 'Batman: The Wayne Family''s Galaween', 'Batman', 'MM Cafe, LaLaport BBCC', '2026-10-17', 'https://www.instagram.com/p/DdtwtsfzAdZ/', '11:00 AM', '4:00 PM'
where not exists (select 1 from fan_cafes where instagram_post_url = 'https://www.instagram.com/p/DdtwtsfzAdZ/');

insert into fan_cafes (name, fandom, location, start_date, instagram_post_url, start_time, end_time)
select 'IDOLiSH7: HAPPY iN THE CUP!!', 'IDOLiSH7', 'MM Cafe, LaLaport BBCC', '2026-10-18', 'https://www.instagram.com/p/Dc8QsUdgYFX/', '12:00 PM', '6:00 PM'
where not exists (select 1 from fan_cafes where instagram_post_url = 'https://www.instagram.com/p/Dc8QsUdgYFX/');

create table if not exists suggestions (
  id serial primary key,
  name text,
  email text,
  social_media text,
  topic text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table suggestions add column if not exists social_media text;

create table if not exists artist_submissions (
  id serial primary key,
  submission_type text not null,
  artist_name text not null,
  instagram text,
  email text,
  event_name text not null,
  booth text,
  fandoms text,
  merch_types text,
  catalogue_url text,
  catalogue_file_path text,
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table artist_submissions add column if not exists catalogue_file_path text;
alter table artist_submissions alter column email drop not null;

create table if not exists fan_cafe_submissions (
  id serial primary key,
  name text not null,
  location text not null,
  start_date date not null,
  end_date date,
  social_platform text not null,
  social_account text not null,
  fandom text not null,
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create index if not exists catalogues_event_id_idx on catalogues(event_id);
create index if not exists catalogues_artist_id_idx on catalogues(artist_id);
create index if not exists catalogue_entries_event_slug_idx on catalogue_entries(event_slug);
create index if not exists stamp_rallies_event_id_idx on stamp_rallies(event_id);

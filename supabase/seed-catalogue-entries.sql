-- Seed the first two Anime Fest! 2026 / 3 catalogue entries.
-- Run after supabase/schema.sql in the Supabase SQL Editor.

insert into public.catalogue_entries (
  event_slug,
  booth_number,
  artist_name,
  artist_instagrams,
  fandom_tags,
  merch_tags,
  stamp_rally,
  instagram_post_urls
)
values
  (
    'anime-fest-2026',
    'A-01',
    'Mirimoco',
    array['mirimoco']::text[],
    array['Genshin Impact', 'The Amazing Digital Circus', 'Dungeon Meshi', 'Undertale', 'Witch Hat Atelier']::text[],
    array['Plush keychains', 'keychains', 'chocolate keychains', 'tote bags']::text[],
    false,
    array[
      'https://www.instagram.com/p/Dd6WaEYmCnA/',
      'https://www.instagram.com/p/DeHNmU6mMFM/'
    ]::text[]
  ),
  (
    'anime-fest-2026',
    'A-02',
    'WanTan Hime',
    array['wanqin_art', 'kinniku_hime']::text[],
    array['LADS', 'Hololive', 'Shugo Chara', 'Others']::text[],
    array['Commission', 'Stickers', 'photocards (poca)', 'badges', 'art prints', 'doujin', 'tapestry', 'shirts', 'standee', 'fridge magnet']::text[],
    false,
    array[
      'https://www.instagram.com/p/DeGk4EBgWXZ/',
      'https://www.instagram.com/p/DeI3wBnAdu3/'
    ]::text[]
  )
on conflict (event_slug, booth_number) do update set
  artist_name = excluded.artist_name,
  artist_instagrams = excluded.artist_instagrams,
  fandom_tags = excluded.fandom_tags,
  merch_tags = excluded.merch_tags,
  stamp_rally = excluded.stamp_rally,
  instagram_post_urls = excluded.instagram_post_urls,
  updated_at = now();

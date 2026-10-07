-- Add the two community-submitted October 2026 fan cafe listings.
-- Safe to run more than once; each Instagram post URL is inserted once.

insert into public.fan_cafes (name, fandom, location, start_date, instagram_post_url, start_time, end_time)
select 'Batman: The Wayne Family''s Galaween', 'Batman', 'MM Cafe, LaLaport BBCC', '2026-10-17', 'https://www.instagram.com/p/DdtwtsfzAdZ/', '11:00 AM', '4:00 PM'
where not exists (
  select 1 from public.fan_cafes where instagram_post_url = 'https://www.instagram.com/p/DdtwtsfzAdZ/'
);

insert into public.fan_cafes (name, fandom, location, start_date, instagram_post_url, start_time, end_time)
select 'IDOLiSH7: HAPPY iN THE CUP!!', 'IDOLiSH7', 'MM Cafe, LaLaport BBCC', '2026-10-18', 'https://www.instagram.com/p/Dc8QsUdgYFX/', '12:00 PM', '6:00 PM'
where not exists (
  select 1 from public.fan_cafes where instagram_post_url = 'https://www.instagram.com/p/Dc8QsUdgYFX/'
);

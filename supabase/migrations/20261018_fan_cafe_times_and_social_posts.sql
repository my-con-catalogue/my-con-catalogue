-- Fan cafe submission opening hours and platform-neutral post embeds.
alter table if exists fan_cafe_submissions
  add column if not exists start_time text,
  add column if not exists end_time text;

alter table if exists fan_cafes
  add column if not exists social_post_url text;

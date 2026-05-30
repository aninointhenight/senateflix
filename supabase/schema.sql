-- ============================================================
-- SENATEFLIX — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Categories table
create table if not exists categories (
  id            uuid        default gen_random_uuid() primary key,
  name          text        not null unique,
  display_order integer     default 0,
  created_at    timestamptz default now()
);

-- Shows table
create table if not exists shows (
  id                   uuid        default gen_random_uuid() primary key,
  title                text        not null,
  tagline              text,
  description          text,
  year                 integer,
  category_id          uuid        references categories(id) on delete set null,
  youtube_id           text        not null,
  thumbnail_horizontal text,                  -- custom horizontal/banner image URL
  thumbnail_vertical   text,                  -- custom vertical/poster image URL
  tags                 text[]      default '{}',
  badge_override       text        check (badge_override in ('leaving_soon', 'new_episode', 'coming_soon')),
  is_featured          boolean     default false,
  featured_order       integer     default 0,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table categories enable row level security;
alter table shows       enable row level security;

-- Public: read only
create policy "Public read categories"
  on categories for select using (true);

create policy "Public read shows"
  on shows for select using (true);

-- Authenticated (admin): full access
create policy "Admin manage categories"
  on categories for all using (auth.role() = 'authenticated');

create policy "Admin manage shows"
  on shows for all using (auth.role() = 'authenticated');

-- ============================================================
-- Seed default categories
-- ============================================================

insert into categories (name, display_order) values
  ('Hearings', 1),
  ('Sessions', 2),
  ('Viral',    3),
  ('Drama',    4),
  ('Comedy',   5),
  ('Thriller', 6)
on conflict (name) do nothing;

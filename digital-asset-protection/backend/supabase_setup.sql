-- Run this once in your Supabase SQL Editor (https://supabase.com → SQL Editor)
-- This creates the tables needed for ShieldSync to persist data across deploys.

create table if not exists assets (
  id            text primary key,
  name          text not null,
  description   text,
  media_type    text default 'image',
  original_url  text,
  watermarked_url text,
  phash         text,
  dhash         text,
  ahash         text,
  watermark_id  text,
  organization  text,
  tags          jsonb default '[]',
  status        text default 'monitoring',
  scan_count    integer default 0,
  violation_count integer default 0,
  created_at    timestamptz default now()
);

create table if not exists violations (
  id               text primary key,
  asset_id         text references assets(id) on delete cascade,
  source_url       text,
  source_platform  text,
  similarity_score float,
  evidence_url     text,
  ai_analysis      text,
  status           text default 'pending',
  detected_at      timestamptz default now()
);

-- Disable Row Level Security so the service key can read/write freely
alter table assets disable row level security;
alter table violations disable row level security;

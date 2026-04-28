-- Run this in the Supabase SQL Editor to set up your database

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    media_type TEXT DEFAULT 'image',
    original_url TEXT,
    watermarked_url TEXT,
    phash TEXT NOT NULL,
    dhash TEXT NOT NULL,
    ahash TEXT NOT NULL,
    watermark_id TEXT NOT NULL,
    organization TEXT DEFAULT 'Default Org',
    tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'monitoring',
    scan_count INTEGER DEFAULT 0,
    violation_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Violations table
CREATE TABLE IF NOT EXISTS violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    source_platform TEXT DEFAULT 'Unknown',
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    similarity_score FLOAT DEFAULT 0.0,
    status TEXT DEFAULT 'pending',
    evidence_url TEXT,
    ai_analysis TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_violations_asset_id ON violations(asset_id);
CREATE INDEX IF NOT EXISTS idx_violations_status ON violations(status);
CREATE INDEX IF NOT EXISTS idx_violations_detected_at ON violations(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_phash ON assets(phash);

-- Storage bucket for media (run in Supabase dashboard > Storage)
-- Create a bucket named "media" with public access enabled

-- Row Level Security (optional — enable if you add auth)
-- ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE violations ENABLE ROW LEVEL SECURITY;

-- Migration: Create brand_materials_pages table for Instagram automation materials hub
-- Allows creators to share brand & product materials (images, PDFs, docs, websites)
-- and generates a live page under their subdomain e.g. /u/[subdomain]/page

CREATE TABLE IF NOT EXISTS brand_materials_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  slug TEXT NOT NULL DEFAULT 'page',
  title TEXT NOT NULL DEFAULT 'Brand & Product Hub',
  tagline TEXT,
  description TEXT,
  primary_cta_label TEXT DEFAULT 'Visit Official Store',
  primary_cta_url TEXT,
  materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  theme JSONB DEFAULT '{"accentColor": "#8B5CF6"}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_brand_materials_workspace_slug ON brand_materials_pages(workspace_id, slug);

ALTER TABLE brand_materials_pages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'brand_materials_pages' AND policyname = 'Public read published brand materials pages'
  ) THEN
    CREATE POLICY "Public read published brand materials pages"
      ON brand_materials_pages FOR SELECT
      USING (is_published = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'brand_materials_pages' AND policyname = 'Service role all access brand materials pages'
  ) THEN
    CREATE POLICY "Service role all access brand materials pages"
      ON brand_materials_pages FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

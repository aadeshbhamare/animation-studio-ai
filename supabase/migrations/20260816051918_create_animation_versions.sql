/*
# Create animation_versions table (single-tenant, no auth)

1. New Tables
- `animation_versions`
  - `id` (uuid, primary key)
  - `label` (text, not null) — user-facing name for the version
  - `prompt` (text, not null) — the prompt used to generate this version
  - `styles` (text array, default empty) — selected animation style ids
  - `html` (text, not null) — the generated animation HTML document
  - `scene_count` (integer, default 0) — number of storyboard scenes
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `animation_versions`.
- Single-tenant app (no sign-in): allow anon + authenticated full CRUD because
  the data is intentionally shared/public across the single workspace.
*/

CREATE TABLE IF NOT EXISTS animation_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  prompt text NOT NULL,
  styles text[] NOT NULL DEFAULT '{}',
  html text NOT NULL,
  scene_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE animation_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_versions" ON animation_versions;
CREATE POLICY "anon_select_versions" ON animation_versions
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_versions" ON animation_versions;
CREATE POLICY "anon_insert_versions" ON animation_versions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_versions" ON animation_versions;
CREATE POLICY "anon_update_versions" ON animation_versions
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_versions" ON animation_versions;
CREATE POLICY "anon_delete_versions" ON animation_versions
  FOR DELETE TO anon, authenticated USING (true);

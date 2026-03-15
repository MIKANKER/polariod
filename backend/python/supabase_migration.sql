-- Migration: Custom Templates Infrastructure
-- Description: Creates table, bucket, RLS policies, and quota enforcement for custom templates

-- ============================================================================
-- 1. Create custom_templates table
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  file_size INTEGER NOT NULL,
  photo_rect_norm JSONB NOT NULL DEFAULT '{"x": 0.39, "y": 0.48, "w": 0.22, "h": 0.22}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_dimensions CHECK (
    width >= 500 AND width <= 4000 AND
    height >= 500 AND height <= 4000
  ),
  CONSTRAINT valid_file_size CHECK (file_size <= 10485760)
);

-- ============================================================================
-- 2. Create indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_custom_templates_user_id ON custom_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_templates_created_at ON custom_templates(created_at DESC);

-- ============================================================================
-- 3. Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE custom_templates ENABLE ROW LEVEL SECURITY;

-- Users can view own templates
DROP POLICY IF EXISTS "Users can view own templates" ON custom_templates;
CREATE POLICY "Users can view own templates"
  ON custom_templates FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own templates
DROP POLICY IF EXISTS "Users can insert own templates" ON custom_templates;
CREATE POLICY "Users can insert own templates"
  ON custom_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete own templates
DROP POLICY IF EXISTS "Users can delete own templates" ON custom_templates;
CREATE POLICY "Users can delete own templates"
  ON custom_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. Create quota enforcement function and trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION check_template_quota()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM custom_templates WHERE user_id = NEW.user_id) >= 20 THEN
    RAISE EXCEPTION 'Límite de 20 plantillas alcanzado. Elimina plantillas existentes antes de subir nuevas.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_template_quota ON custom_templates;
CREATE TRIGGER enforce_template_quota
  BEFORE INSERT ON custom_templates
  FOR EACH ROW
  EXECUTE FUNCTION check_template_quota();

-- ============================================================================
-- 5. Storage bucket configuration (manual step)
-- ============================================================================

-- NOTE: The following storage bucket and policies must be created manually
-- in the Supabase dashboard or via Supabase CLI:
--
-- Bucket name: custom-templates
-- Public: false
-- File size limit: 10485760 (10MB)
-- Allowed MIME types: image/png
--
-- Storage policies:
--
-- 1. Users can upload to their own folder:
-- CREATE POLICY "Users can upload own templates"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'custom-templates' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- 2. Users can read their own templates:
-- CREATE POLICY "Users can read own templates"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'custom-templates' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- 3. Users can delete their own templates:
-- CREATE POLICY "Users can delete own templates"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'custom-templates' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

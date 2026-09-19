-- BẮT BÀI ĐỐI THỦ — Production Workspace 2.0
-- Additive migration: giữ nguyên production_items contract cũ, chỉ bổ sung workspace metadata
-- và các bảng con cho checklist, tài sản, ghi chú, lịch sử, template.

ALTER TABLE production_items
  ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS assignee_label TEXT NULL,
  ADD COLUMN IF NOT EXISTS template_key TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_production_items_due_at
  ON production_items(due_at)
  WHERE due_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS production_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NULL,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS production_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_item_id UUID NOT NULL REFERENCES production_items(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN (
    'idea', 'research', 'script', 'thumbnail', 'production', 'editing', 'published'
  )),
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS production_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_item_id UUID NOT NULL REFERENCES production_items(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'reference', 'thumbnail', 'script', 'voice', 'footage', 'project', 'drive', 'youtube', 'other'
  )),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS production_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_item_id UUID NOT NULL REFERENCES production_items(id) ON DELETE CASCADE,
  stage TEXT NULL CHECK (stage IS NULL OR stage IN (
    'idea', 'research', 'script', 'thumbnail', 'production', 'editing', 'published'
  )),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
    'general', 'research', 'script', 'thumbnail', 'production', 'editing', 'seo'
  )),
  body TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS production_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_item_id UUID NOT NULL REFERENCES production_items(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  stage_from TEXT NULL,
  stage_to TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_production_tasks_item
  ON production_tasks(production_item_id, stage, sort_order);
CREATE INDEX IF NOT EXISTS idx_production_assets_item
  ON production_assets(production_item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_notes_item
  ON production_notes(production_item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_activity_item
  ON production_activity(production_item_id, created_at DESC);

DROP TRIGGER IF EXISTS trigger_production_templates_set_updated_at ON production_templates;
CREATE TRIGGER trigger_production_templates_set_updated_at
BEFORE UPDATE ON production_templates
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_production_tasks_set_updated_at ON production_tasks;
CREATE TRIGGER trigger_production_tasks_set_updated_at
BEFORE UPDATE ON production_tasks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_production_assets_set_updated_at ON production_assets;
CREATE TRIGGER trigger_production_assets_set_updated_at
BEFORE UPDATE ON production_assets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_production_notes_set_updated_at ON production_notes;
CREATE TRIGGER trigger_production_notes_set_updated_at
BEFORE UPDATE ON production_notes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE production_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phép đọc production_templates công khai" ON production_templates;
CREATE POLICY "Cho phép đọc production_templates công khai"
ON production_templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Cho phép đọc production_tasks công khai" ON production_tasks;
CREATE POLICY "Cho phép đọc production_tasks công khai"
ON production_tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Cho phép đọc production_assets công khai" ON production_assets;
CREATE POLICY "Cho phép đọc production_assets công khai"
ON production_assets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Cho phép đọc production_notes công khai" ON production_notes;
CREATE POLICY "Cho phép đọc production_notes công khai"
ON production_notes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Cho phép đọc production_activity công khai" ON production_activity;
CREATE POLICY "Cho phép đọc production_activity công khai"
ON production_activity FOR SELECT USING (true);

-- System templates. Checklist structure:
-- [{ "stage": "...", "title": "...", "sortOrder": 10 }, ...]
INSERT INTO production_templates (template_key, name, description, checklist, is_system)
VALUES
(
  'diy_remake',
  'DIY Remake',
  'Quy trình đầy đủ cho video DIY/remake từ phân tích nguồn đến xuất bản.',
  '[
    {"stage":"research","title":"Phân tích video nguồn","sortOrder":10},
    {"stage":"research","title":"Xác định hook và điểm giữ người xem","sortOrder":20},
    {"stage":"research","title":"Tìm điểm có thể remake khác biệt","sortOrder":30},
    {"stage":"script","title":"Viết hook 5 giây đầu","sortOrder":10},
    {"stage":"script","title":"Hoàn thiện outline và script","sortOrder":20},
    {"stage":"thumbnail","title":"Lên ít nhất 2 concept thumbnail","sortOrder":10},
    {"stage":"thumbnail","title":"Chọn thumbnail cuối và kiểm tra mobile","sortOrder":20},
    {"stage":"production","title":"Chuẩn bị vật liệu / đạo cụ","sortOrder":10},
    {"stage":"production","title":"Quay footage chính và B-roll","sortOrder":20},
    {"stage":"editing","title":"Rough cut + âm thanh + subtitle","sortOrder":10},
    {"stage":"editing","title":"Color + kiểm tra final export","sortOrder":20},
    {"stage":"published","title":"Title + description + thumbnail + URL xuất bản","sortOrder":10}
  ]'::jsonb,
  true
),
(
  'quick_tips',
  'Quick Tips',
  'Quy trình gọn cho video mẹo nhanh, ưu tiên tốc độ sản xuất.',
  '[
    {"stage":"research","title":"Chốt mẹo và kiểm chứng cách làm","sortOrder":10},
    {"stage":"script","title":"Viết hook + 3 ý chính","sortOrder":10},
    {"stage":"thumbnail","title":"Chốt thumbnail đơn giản, dễ hiểu","sortOrder":10},
    {"stage":"production","title":"Quay demo rõ thao tác","sortOrder":10},
    {"stage":"editing","title":"Edit nhanh + subtitle","sortOrder":10},
    {"stage":"published","title":"Hoàn thiện metadata và URL xuất bản","sortOrder":10}
  ]'::jsonb,
  true
),
(
  'fast_remake',
  'Remake nhanh',
  'Pipeline tối giản cho nội dung remake cần xử lý nhanh.',
  '[
    {"stage":"research","title":"Chốt angle khác biệt","sortOrder":10},
    {"stage":"script","title":"Chốt hook và flow","sortOrder":10},
    {"stage":"thumbnail","title":"Chốt thumbnail","sortOrder":10},
    {"stage":"production","title":"Quay nội dung","sortOrder":10},
    {"stage":"editing","title":"Edit và export","sortOrder":10},
    {"stage":"published","title":"Đăng và lưu URL","sortOrder":10}
  ]'::jsonb,
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  checklist = EXCLUDED.checklist,
  is_system = EXCLUDED.is_system,
  updated_at = now();

-- Không tạo INSERT/UPDATE/DELETE policy cho anon.
-- Toàn bộ ghi V2 vẫn bắt buộc đi qua manage-production-items + APP_WRITE_ACCESS_KEY.

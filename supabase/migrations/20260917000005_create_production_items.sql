-- BẮT BÀI ĐỐI THỦ — Migration Giai đoạn 9
-- Bảng production_items: Quản lý tiến độ sản xuất nội dung dựa trên video đối thủ

CREATE TABLE IF NOT EXISTS production_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    working_title TEXT NULL,
    notes TEXT NULL,
    status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN (
        'idea', 'research', 'script', 'thumbnail', 'production', 'editing', 'published', 'archived'
    )),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_url TEXT NULL,
    published_at TIMESTAMPTZ NULL
);

-- Ràng buộc chống trùng lặp: Một video đối thủ chỉ được có tối đa 1 active production item
-- Sử dụng partial unique index để cho phép nhiều dòng có source_video_id NULL (nếu video bị xóa)
CREATE UNIQUE INDEX IF NOT EXISTS uq_production_items_source_video
ON production_items (source_video_id)
WHERE source_video_id IS NOT NULL;

-- Chỉ mục tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_production_items_status ON production_items(status);
CREATE INDEX IF NOT EXISTS idx_production_items_priority ON production_items(priority);
CREATE INDEX IF NOT EXISTS idx_production_items_updated_at ON production_items(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_items_source_video_id ON production_items(source_video_id);

-- Trigger tự động cập nhật updated_at
DROP TRIGGER IF EXISTS trigger_production_items_set_updated_at ON production_items;
CREATE TRIGGER trigger_production_items_set_updated_at
BEFORE UPDATE ON production_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Thiết lập Row Level Security (RLS)
ALTER TABLE production_items ENABLE ROW LEVEL SECURITY;

-- 1. Cho phép đọc công khai (SELECT) từ trình duyệt
DROP POLICY IF EXISTS "Cho phép đọc production_items công khai" ON production_items;
CREATE POLICY "Cho phép đọc production_items công khai"
ON production_items FOR SELECT
USING (true);

-- 2. KHÓA HOÀN TOÀN QUYỀN GHI (INSERT, UPDATE, DELETE) TỪ PUBLIC ANON
-- Toàn bộ thay đổi bắt buộc phải qua Edge Function 'manage-production-items'
-- sử dụng SERVICE_ROLE_KEY server-side và xác thực qua APP_WRITE_ACCESS_KEY.
-- Tuyệt đối không tạo policy INSERT, UPDATE, DELETE cho anon/public.

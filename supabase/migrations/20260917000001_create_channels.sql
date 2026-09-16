-- BẮT BÀI ĐỐI THỦ — Database Migration
-- Bảng channels: Quản lý danh sách kênh YouTube đối thủ được theo dõi

CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youtube_channel_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    handle TEXT,
    url TEXT NOT NULL,
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    scan_limit INTEGER NOT NULL DEFAULT 15 CHECK (scan_limit >= 1 AND scan_limit <= 50),
    alert_vph_threshold INTEGER NOT NULL DEFAULT 5000 CHECK (alert_vph_threshold >= 1),
    source TEXT NOT NULL DEFAULT 'manual',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_scan_at TIMESTAMPTZ NULL
);

-- Chỉ mục tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_channels_status ON channels(status);
CREATE INDEX IF NOT EXISTS idx_channels_youtube_id ON channels(youtube_channel_id);
CREATE INDEX IF NOT EXISTS idx_channels_created_at ON channels(created_at DESC);

-- Trigger cập nhật updated_at tự động
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_channels_set_updated_at ON channels;
CREATE TRIGGER trigger_channels_set_updated_at
BEFORE UPDATE ON channels
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Thiết lập Row Level Security (RLS)
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- 1. Cho phép đọc danh sách kênh công khai (SELECT)
CREATE POLICY "Cho phép đọc kênh công khai"
ON channels FOR SELECT
USING (true);

-- 2. KHÓA TOÀN BỘ QUYỀN WRITE CÔNG KHAI
-- Mọi thao tác INSERT, UPDATE, DELETE bắt buộc phải đi qua Edge Function 'manage-channels'
-- sử dụng SERVICE_ROLE_KEY server-side và xác thực qua APP_WRITE_ACCESS_KEY.
-- Không tạo policy INSERT, UPDATE, DELETE cho anon/authenticated.

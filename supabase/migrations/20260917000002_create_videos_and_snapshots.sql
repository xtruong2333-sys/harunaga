-- BẮT BÀI ĐỐI THỦ — Migration Giai đoạn 2A
-- 1. Mở rộng bảng channels: thêm uploads_playlist_id và youtube_checked_at
ALTER TABLE channels
ADD COLUMN IF NOT EXISTS uploads_playlist_id TEXT NULL,
ADD COLUMN IF NOT EXISTS youtube_checked_at TIMESTAMPTZ NULL;

-- 2. Bảng videos: Lưu trữ các video đối thủ được quét
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youtube_video_id TEXT NOT NULL UNIQUE,
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    duration TEXT NULL,
    is_short BOOLEAN NULL,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    latest_view_count BIGINT NOT NULL DEFAULT 0,
    latest_measured_vph NUMERIC NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chỉ mục tối ưu cho bảng videos
CREATE INDEX IF NOT EXISTS idx_videos_channel_id ON videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_videos_published_at ON videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_latest_vph ON videos(latest_measured_vph DESC);
CREATE INDEX IF NOT EXISTS idx_videos_youtube_id ON videos(youtube_video_id);

-- Trigger cập nhật updated_at cho videos
DROP TRIGGER IF EXISTS trigger_videos_set_updated_at ON videos;
CREATE TRIGGER trigger_videos_set_updated_at
BEFORE UPDATE ON videos
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 3. Bảng video_snapshots: Lịch sử lượt xem theo mốc thời gian (dùng để tính VPH đo được)
CREATE TABLE IF NOT EXISTS video_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    view_count BIGINT NOT NULL,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    measured_vph NUMERIC NULL,
    view_delta BIGINT NULL,
    elapsed_seconds INTEGER NULL,
    CONSTRAINT uq_video_snapshots_video_checked UNIQUE (video_id, checked_at)
);

-- Chỉ mục tối ưu cho video_snapshots
CREATE INDEX IF NOT EXISTS idx_video_snapshots_video_checked ON video_snapshots(video_id, checked_at DESC);

-- 4. Bảng scan_runs: Lưu lịch sử các lần quét dữ liệu
CREATE TABLE IF NOT EXISTS scan_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ NULL,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'partial', 'failed')),
    channels_total INTEGER NOT NULL DEFAULT 0,
    channels_success INTEGER NOT NULL DEFAULT 0,
    channels_failed INTEGER NOT NULL DEFAULT 0,
    videos_found INTEGER NOT NULL DEFAULT 0,
    snapshots_created INTEGER NOT NULL DEFAULT 0,
    error_summary TEXT NULL,
    trigger_source TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_source IN ('manual', 'schedule'))
);

CREATE INDEX IF NOT EXISTS idx_scan_runs_started_at ON scan_runs(started_at DESC);

-- 5. Thiết lập Row Level Security (RLS)
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_runs ENABLE ROW LEVEL SECURITY;

-- Quyền đọc công khai (SELECT) cho client để phục vụ hiển thị dữ liệu nếu cần
CREATE POLICY "Cho phép đọc videos công khai"
ON videos FOR SELECT
USING (true);

CREATE POLICY "Cho phép đọc video_snapshots công khai"
ON video_snapshots FOR SELECT
USING (true);

CREATE POLICY "Cho phép đọc scan_runs công khai"
ON scan_runs FOR SELECT
USING (true);

-- Khóa toàn bộ quyền WRITE từ phía public/browser
-- Mọi thao tác ghi dữ liệu (INSERT, UPDATE, DELETE) bắt buộc chạy qua Edge Function
-- sử dụng server secret key và APP_WRITE_ACCESS_KEY.

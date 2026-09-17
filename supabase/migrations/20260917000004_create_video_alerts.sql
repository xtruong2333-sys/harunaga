-- BẮT BÀI ĐỐI THỦ — Migration Giai đoạn 2C
-- Cảnh báo Discord khi VPH đo được đạt ngưỡng (Mỗi video chỉ cảnh báo một lần)

-- 1. Bảng video_alerts: Quản lý lịch sử và trạng thái gửi cảnh báo Discord
CREATE TABLE IF NOT EXISTS video_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    snapshot_id UUID NULL REFERENCES video_snapshots(id) ON DELETE SET NULL,
    threshold_vph NUMERIC NOT NULL,
    measured_vph NUMERIC NOT NULL,
    view_count BIGINT NOT NULL,
    view_delta BIGINT NULL,
    elapsed_seconds INTEGER NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 0,
    discord_message_id TEXT NULL,
    last_error TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- RULE ANTI-SPAM BẮT BUỘC: Mỗi video chỉ được tạo tối đa 1 alert duy nhất
    CONSTRAINT uq_video_alerts_video_id UNIQUE (video_id)
);

-- Chỉ mục tối ưu cho video_alerts
CREATE INDEX IF NOT EXISTS idx_video_alerts_status ON video_alerts(status);
CREATE INDEX IF NOT EXISTS idx_video_alerts_video_id ON video_alerts(video_id);
CREATE INDEX IF NOT EXISTS idx_video_alerts_created_at ON video_alerts(created_at DESC);

-- Trigger cập nhật updated_at tự động cho video_alerts
DROP TRIGGER IF EXISTS trigger_video_alerts_set_updated_at ON video_alerts;
CREATE TRIGGER trigger_video_alerts_set_updated_at
BEFORE UPDATE ON video_alerts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 2. Mở rộng bảng scan_runs để ghi nhận số liệu cảnh báo
ALTER TABLE scan_runs
ADD COLUMN IF NOT EXISTS alert_candidates INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS alerts_sent INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS alerts_failed INTEGER NOT NULL DEFAULT 0;

-- 3. Thiết lập Row Level Security (RLS) cho video_alerts
ALTER TABLE video_alerts ENABLE ROW LEVEL SECURITY;

-- Khóa toàn bộ quyền WRITE từ public browser.
-- Chỉ Edge Function (server-side secret) có quyền thao tác trên video_alerts.

-- BẮT BÀI ĐỐI THỦ — Migration Giai đoạn 18
-- Tối ưu hóa lưu trữ và truy vấn snapshot dài hạn (Long-term Data Scale & Snapshot Optimization)
-- 1. Denormalized metadata fields trên bảng videos
-- 2. Backfill dữ liệu snapshot hiện có
-- 3. Chỉ mục tối ưu truy vấn
-- 4. View channel_video_current_stats
-- 5. SQL Function get_channel_vph_hourly

-- ============================================================
-- 1. THÊM CỘT METADATA SNAPSHOT VÀO BẢNG VIDEOS
-- ============================================================
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS latest_view_delta BIGINT NULL,
ADD COLUMN IF NOT EXISTS latest_snapshot_checked_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS first_snapshot_checked_at TIMESTAMPTZ NULL;

-- ============================================================
-- 2. BACKFILL DỮ LIỆU SET-BASED TỪ VIDEO_SNAPSHOTS
-- ============================================================
-- Backfill snapshot mới nhất và đồng bộ current state
WITH latest_snaps AS (
    SELECT DISTINCT ON (video_id)
        video_id,
        view_count,
        measured_vph,
        view_delta,
        checked_at
    FROM video_snapshots
    ORDER BY video_id, checked_at DESC
),
earliest_snaps AS (
    SELECT DISTINCT ON (video_id)
        video_id,
        checked_at
    FROM video_snapshots
    ORDER BY video_id, checked_at ASC
)
UPDATE videos v
SET
    latest_view_count = COALESCE(ls.view_count, v.latest_view_count),
    latest_measured_vph = ls.measured_vph,
    latest_view_delta = ls.view_delta,
    latest_snapshot_checked_at = ls.checked_at,
    first_snapshot_checked_at = es.checked_at
FROM latest_snaps ls
JOIN earliest_snaps es ON es.video_id = ls.video_id
WHERE v.id = ls.video_id;

-- ============================================================
-- 3. CHỈ MỤC TỐI ƯU TRUY VẤN
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_videos_channel_published ON videos(channel_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_snapshots_checked_at ON video_snapshots(checked_at DESC);

-- ============================================================
-- 4. VIEW: channel_video_current_stats
-- ============================================================
CREATE OR REPLACE VIEW channel_video_current_stats
WITH (security_invoker = true)
AS
SELECT
    channel_id,
    COUNT(*) AS total_videos,
    COUNT(*) FILTER (WHERE latest_measured_vph > 0) AS rising_video_count,
    MAX(latest_measured_vph) AS max_vph
FROM videos
GROUP BY channel_id;

-- Phân quyền SELECT view cho anon và authenticated
GRANT SELECT ON channel_video_current_stats TO anon, authenticated;

-- ============================================================
-- 5. FUNCTION: get_channel_vph_hourly
-- ============================================================
CREATE OR REPLACE FUNCTION get_channel_vph_hourly(
    p_channel_ids UUID[],
    p_since TIMESTAMPTZ
)
RETURNS TABLE (
    channel_id UUID,
    hour_bucket TIMESTAMPTZ,
    avg_vph NUMERIC,
    sample_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT
        v.channel_id,
        date_trunc('hour', vs.checked_at) AS hour_bucket,
        ROUND(AVG(vs.measured_vph), 2) AS avg_vph,
        COUNT(vs.measured_vph) AS sample_count
    FROM video_snapshots vs
    JOIN videos v ON v.id = vs.video_id
    WHERE v.channel_id = ANY(p_channel_ids)
      AND vs.checked_at >= p_since
      AND vs.measured_vph IS NOT NULL
    GROUP BY v.channel_id, date_trunc('hour', vs.checked_at)
    ORDER BY hour_bucket ASC;
$$;

-- Phân quyền EXECUTE hàm cho anon và authenticated
GRANT EXECUTE ON FUNCTION get_channel_vph_hourly(UUID[], TIMESTAMPTZ) TO anon, authenticated;

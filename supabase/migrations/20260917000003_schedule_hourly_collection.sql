-- BẮT BÀI ĐỐI THỦ — Migration Giai đoạn 2B
-- Tự động kiểm tra dữ liệu mỗi giờ qua Supabase Cron (pg_cron + pg_net + Vault)

-- 1. Kích hoạt các extensions cần thiết (an toàn khi chạy lại)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- 2. Chống chạy chồng ở cấp database: Chỉ cho phép tối đa 1 phiên scan có status = 'running'
CREATE UNIQUE INDEX IF NOT EXISTS idx_scan_runs_single_running
ON scan_runs ((status))
WHERE status = 'running';

-- 3. Xóa lịch cũ nếu đã tồn tại để tránh duplicate job
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'bat-bai-doi-thu-hourly-collector') THEN
    PERFORM cron.unschedule('bat-bai-doi-thu-hourly-collector');
  END IF;
END $$;

-- 4. Đăng ký Supabase Cron job: bat-bai-doi-thu-hourly-collector
-- Lịch chạy: 5 * * * * (mỗi giờ vào phút thứ 5)
-- Sử dụng pg_net để gọi Edge Function 'collect-youtube-data' với triggerSource = 'schedule'
-- Đọc URL, Publishable Key và Access Key an toàn từ Supabase Vault (không hard-code)
SELECT cron.schedule(
  'bat-bai-doi-thu-hourly-collector',
  '5 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'collector_project_url') || '/functions/v1/collect-youtube-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'collector_publishable_key')
    ),
    body := jsonb_build_object(
      'accessKey', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'collector_access_key'),
      'triggerSource', 'schedule'
    )
  );
  $$
);

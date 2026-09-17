# BẮT BÀI ĐỐI THỦ

> **Theo dõi đối thủ • Phát hiện video tăng nhanh**  
> Website: [https://batbaidoithu.click/](https://batbaidoithu.click/)

---

## 1. Giới thiệu

**Bắt Bài Đối Thủ** là hệ thống theo dõi và phát hiện xu hướng video dành riêng cho các nhà sáng tạo nội dung YouTube. Hệ thống hỗ trợ người dùng theo dõi động danh sách các kênh đối thủ trong ngách, định kỳ kiểm tra lượt xem và cảnh báo khi có video tăng tốc độ đột biến.

---

## 2. Tiến độ triển khai

### ✅ Giai đoạn 1: Nền Móng & Kênh Theo Dõi (Đã hoàn thành)
- Giao diện thuần Tiếng Việt tự nhiên, tối giản và hiện đại.
- Quản lý kênh đối thủ: thêm kênh, thêm nhiều kênh, tạm dừng, lưu trữ, scan_limit, alert_vph_threshold.
- Supabase Edge Functions: `resolve-youtube-channel` (xác thực kênh thật) và `manage-channels` (thao tác ghi server-side).
- Row Level Security (RLS) bảo vệ nghiêm ngặt cơ sở dữ liệu.

### ✅ Giai đoạn 2A: Thu Thập Video + Lịch Sử Lượt Xem + VPH Đo Được (Đã hoàn thành)
- **Thu thập video thật**: Tích hợp YouTube Data API v3 qua Edge Function `collect-youtube-data`.
- **Tối ưu Quota**:
  - Cache `uploads_playlist_id` vào cơ sở dữ liệu (chỉ gọi `channels.list` 1 lần duy nhất).
  - Lấy video mới nhất theo `scan_limit` động qua `playlistItems.list`.
  - Gom nhóm (batch) tối đa 50 video IDs / request cho `videos.list`.
- **Lịch sử lượt xem (Video Snapshots)**: Lưu mốc thời gian và lượt xem thực tế theo chuẩn UTC.
- **Công thức VPH Đo Được (Strict Measured VPH)**:
  - `view_delta = current_views - previous_views`
  - `elapsed_hours = elapsed_seconds / 3600`
  - `measured_vph = view_delta / elapsed_hours`
  - Snapshot đầu: `measured_vph = null` (không sinh VPH giả).
  - Lượt xem giảm: `measured_vph = 0` (không có VPH âm).
- **Kích hoạt thủ công**: Cho phép quản trị viên bấm nút "Kiểm Tra Dữ Liệu" trên trang Kênh Theo Dõi.

### ✅ Giai đoạn 2B: Tự Động Kiểm Tra Dữ Liệu Mỗi Giờ (Đã hoàn thành)
- **Tự động hóa 100% trên đám mây**: Sử dụng **Supabase Cron** (`pg_cron` + `pg_net` + `supabase_vault`).
- **Lịch chạy**: Mỗi giờ vào phút thứ 5 (`5 * * * *`), hoàn toàn độc lập, **không cần treo máy tính hay mở trình duyệt**.
- **Bảo mật tuyệt đối**: URL, Publishable Key và Mã truy cập được lưu trữ an toàn trong Supabase Vault.
- **Chống chạy chồng & Phục hồi phiên treo**:
  - Khóa mức database bằng Partial Unique Index trên `scan_runs` (`status = 'running'`).
  - Tự động bỏ qua (skip) nếu phiên trước đang hoạt động (< 30 phút).
  - Tự động phục hồi (mark failed) nếu phiên trước bị treo quá 30 phút.
  - Phân biệt minh bạch nguồn chạy: `trigger_source = 'manual'` hoặc `'schedule'`.

### 🚀 Giai đoạn 2C: VPH Đo Được Đạt Ngưỡng → Cảnh Báo Discord (Hiện tại)
- **Tiêu chí cảnh báo duy nhất**: `measured_vph >= channel.alert_vph_threshold` (mặc định 5.000 VPH).
- **Nguyên tắc an toàn & chống spam**:
  - **Mỗi video chỉ cảnh báo 1 lần duy nhất**: Ràng buộc `UNIQUE(video_id)` trên bảng `video_alerts`.
  - **Snapshot đầu tiên (`measured_vph = null`) KHÔNG bao giờ cảnh báo**.
  - **Không gửi trùng lặp**, không tạo milestone 10K/20K, không dùng ước lượng.
- **Hàng đợi & Phục hồi gửi cảnh báo (Reliability Loop)**:
  - Chu trình trạng thái: `pending` -> `sending` -> `sent` / `failed`.
  - Tối đa 5 lần thử (`attempts < 5`).
  - Tự động phục hồi trạng thái `sending` bị treo quá 15 phút về `failed` để thử lại.
  - Lỗi gửi Discord **không làm rollback hay ảnh hưởng tới dữ liệu video đã quét**.
- **Định dạng thông báo Discord Embed**:
  - Chuẩn Tiếng Việt tự nhiên 100%, định dạng số chuẩn Việt Nam (ngăn cách hàng nghìn bằng dấu chấm, ví dụ `6.420`, `78.400`, `+6.400`).
  - 8 trường thông tin đầy đủ: Kênh, VPH đo được, Ngưỡng cảnh báo, Video, Lượt xem hiện tại, Tăng từ lần trước, Khoảng thời gian đo, Xuất bản.
  - Tuyệt đối **không chứa `@everyone` hay `@here`**.
- **Bảo mật**:
  - `DISCORD_WEBHOOK_URL` được lưu ở cấp Secret máy chủ Supabase, tuyệt đối không xuất hiện trong bundle client, log, hoặc mã nguồn.
- **Khả năng quan sát (Observability)**:
  - Cột `alert_candidates`, `alerts_sent`, `alerts_failed` trên bảng `scan_runs`.

> [!IMPORTANT]
> **Giới hạn giai đoạn 2C**:
> - **CHƯA** hiển thị giao diện danh sách cảnh báo hoặc trang "Video Đang Tăng" trên frontend (dành cho Giai đoạn tiếp theo).
> - **CHƯA** sử dụng AI, Radar Score hay phân tích kịch bản.

---

## 3. Lộ trình phát triển tương lai

```
KÊNH ĐANG THEO DÕI
        ↓
MỖI KÊNH LẤY 15 VIDEO MỚI NHẤT
        ↓
KIỂM TRA ĐỊNH KỲ (1 GIỜ / LẦN)
        ↓
LƯU LỊCH SỬ LƯỢT XEM
        ↓
TÍNH VPH ĐO ĐƯỢC
        ↓
VPH >= 5.000
        ↓
GỬI CẢNH BÁO DISCORD
```

---

## 4. Cấu hình & Phát triển

### Yêu cầu môi trường
- Node.js >= 20
- npm >= 10

### Cài đặt dependencies
```bash
npm install
```

### Cấu hình biến môi trường
Tạo file `.env` từ `.env.example`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Chạy ứng dụng (Development)
```bash
npm run dev
```

### Chạy kiểm thử tự động
```bash
npm test
```

### Build sản phẩm
```bash
npm run build
```

---

## 5. Hướng Dẫn Vận Hành & Bảo Mật

### ⚠️ Đồng bộ Mã Truy Cập Quản Trị (`APP_WRITE_ACCESS_KEY`) & Supabase Vault
- **Cơ chế hoạt động**:
  - Giao diện frontend và các Edge Function sử dụng biến môi trường máy chủ `APP_WRITE_ACCESS_KEY` (được cấu hình trong Supabase Secrets).
  - Tiến trình Cron tự động mỗi giờ (`bat-bai-doi-thu-hourly-collector`) chạy từ bên trong PostgreSQL (`pg_cron` + `pg_net`) và đọc mã này từ bảng mã hóa **Supabase Vault** (`collector_access_key`).
- **Nguyên tắc bắt buộc**:
  - Khi thay đổi `APP_WRITE_ACCESS_KEY` trên Supabase Secrets, **bắt buộc phải đồng bộ lại** vào Supabase Vault:
    ```sql
    SELECT vault.update_secret(
      (SELECT id FROM vault.secrets WHERE name = 'collector_access_key'),
      new_secret := 'MÃ_TRUY_CẬP_MỚI'
    );
    ```
  - Nếu không đồng bộ, Cron job sẽ gửi mã cũ và bị Edge Function từ chối với lỗi **HTTP 401 Unauthorized**.

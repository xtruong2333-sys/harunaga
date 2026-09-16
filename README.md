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

### 🚀 Giai đoạn 2A: Thu Thập Video + Lịch Sử Lượt Xem + VPH Đo Được (Hiện tại)
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

> [!IMPORTANT]
> **Giới hạn giai đoạn 2A**:
> - **CHƯA** tự động quét mỗi giờ (chưa có cron scheduler).
> - **CHƯA** gửi cảnh báo Discord.
> - **CHƯA** hiển thị bảng Video Đang Tăng trên giao diện người dùng.

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

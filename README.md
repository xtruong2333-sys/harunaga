# BẮT BÀI ĐỐI THỦ

> **Theo dõi đối thủ • Phát hiện video tăng nhanh**  
> Website: [https://batbaidoithu.click/](https://batbaidoithu.click/)

---

## 1. Giới thiệu

**Bắt Bài Đối Thủ** là hệ thống theo dõi và phát hiện xu hướng video dành riêng cho các nhà sáng tạo nội dung YouTube. Hệ thống hỗ trợ người dùng theo dõi động danh sách các kênh đối thủ trong ngách, định kỳ kiểm tra lượt xem và cảnh báo khi có video tăng tốc độ đột biến.

---

## 2. Giai đoạn hiện tại: GIAI ĐOẠN 1 — NỀN MÓNG & KÊNH THEO DÕI

Trong Giai đoạn 1, hệ thống tập trung hoàn thiện nền móng ứng dụng và quản lý danh sách kênh theo dõi:

- **Giao diện thuần Tiếng Việt tự nhiên**, tối giản, hiện đại và thân thiện.
- **Quản lý kênh đối thủ**:
  - Thêm kênh đơn qua URL hoặc `@tênkênh`.
  - Thêm nhiều kênh cùng lúc qua danh sách dòng văn bản.
  - Tạm dừng / Bật lại theo dõi.
  - Lưu trữ kênh (giữ dữ liệu, không xóa vật lý).
  - Tùy chỉnh số video kiểm tra (mặc định 15, từ 1 đến 50).
  - Tùy chỉnh ngưỡng cảnh báo VPH (mặc định 5.000 lượt xem/giờ).
- **Cơ sở dữ liệu**: Supabase PostgreSQL.
- **Bộ giải quyết kênh**: Chuẩn hóa Channel ID, tên kênh, handle và avatar thật từ YouTube.
- **Không có dữ liệu giả (demo data)** — hệ thống bắt đầu hoàn toàn sạch từ 0 kênh.

> [!NOTE]
> **Lưu ý quan trọng**: Bot quét video, tính toán VPH tự động và cảnh báo Discord **CHƯA ĐƯỢC TRIỂN KHAI** trong giai đoạn này và sẽ được thực hiện ở các giai đoạn tiếp theo.

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

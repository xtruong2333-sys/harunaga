# 🚀 Competitor Video Tracker 24/7 (Discord Alert & GitHub Pages Dashboard)

Hệ thống tự động theo dõi **15 video mới nhất** từ các kênh đối thủ trên YouTube, tính toán tốc độ tăng trưởng (`views/h`), gửi cảnh báo ngay lập tức qua **Discord Webhook** khi có video đạt $\ge 5.000\text{ view/h}$, và hiển thị toàn bộ lên trang **Web Dashboard** trực quan.

* **Chi phí:** 0 VNĐ (Không cần thuê VPS, không tốn tiền API).
* **Hoạt động:** Chạy ngầm 24/7 trên máy chủ GitHub (tắt máy tính hệ thống vẫn hoạt động).
* **Tần suất:** Quét tự động mỗi 1 giờ.

---

## 📁 Cấu Trúc Dự Án

```text
competitor-tracker/
├── .github/
│   └── workflows/
│       └── tracker_cron.yml   # Lập lịch chạy tự động mỗi 1 tiếng trên GitHub
├── data/
│   ├── videos.json            # Dữ liệu 15 video mới nhất & chỉ số view
│   └── history.json           # Lịch sử lưu trữ view để tính delta theo giờ
├── channels.json              # Danh sách kênh đối thủ & ngưỡng cảnh báo
├── tracker.py                 # Engine chính quét RSS và tính toán view/h
├── discord_notifier.py        # Module gửi cảnh báo qua Discord Webhook
├── index.html                 # Giao diện Web Dashboard (GitHub Pages)
└── README.md                  # Hướng dẫn chi tiết
```

---

## 🛠 HƯỚNG DẪN THIẾT LẬP TỪ A ĐẾN Z (CHỈ MẤT 3 PHÚT)

### BƯỚC 1: Lấy Discord Webhook URL (30 Giây)
1. Mở ứng dụng **Discord** (trên điện thoại hoặc máy tính).
2. Tạo một Server riêng (hoặc dùng Server có sẵn của bạn) $\rightarrow$ Tạo một kênh chat (ví dụ: `#canh-bao-video`).
3. Bấm vào biểu tượng **Bánh răng (Cài đặt kênh / Edit Channel)** bên cạnh tên kênh.
4. Chọn tab **Tích hợp (Integrations)** $\rightarrow$ Bấm **Tạo Webhook (Create Webhook)**.
5. Đổi tên thành `Competitor Bot` $\rightarrow$ Bấm **Sao chép URL Webhook (Copy Webhook URL)**.

---

### BƯỚC 2: Đẩy Dự Án Lên GitHub
1. Đăng nhập vào [GitHub.com](https://github.com) và tạo một Repository mới (ví dụ đặt tên: `competitor-tracker`).
   * Chọn chế độ **Public** (để dùng GitHub Pages miễn phí).
2. Mở Terminal / PowerShell tại thư mục `competitor-tracker` trên máy tính và chạy các lệnh:
   ```bash
   git init
   git add .
   git commit -m "Khoi tao he thong theo doi doi thu"
   git branch -M main
   git remote add origin https://github.com/<TEN-TAI-KHOAN-CUA-BAN>/competitor-tracker.git
   git push -u origin main
   ```

---

### BƯỚC 3: Cấu Hình Discord Webhook Trên GitHub (Bảo Mật 100%)
1. Trong repository trên GitHub, vào mục **Settings** $\rightarrow$ Kéo xuống chọn **Secrets and variables** $\rightarrow$ **Actions**.
2. Bấm nút **New repository secret**.
3. Điền thông tin:
   * **Name:** `DISCORD_WEBHOOK_URL`
   * **Secret:** Dán đường link Webhook URL bạn vừa sao chép ở Bước 1 vào.
4. Bấm **Add secret**.

---

### BƯỚC 4: Bật Quyền Cho GitHub Actions Commit Dữ Liệu
1. Vẫn ở trang **Settings** của repository $\rightarrow$ Chọn mục **Actions** ở menu bên trái $\rightarrow$ **General**.
2. Kéo xuống phần **Workflow permissions**:
   * Tích chọn **Read and write permissions**.
   * Tích chọn **Allow GitHub Actions to create and approve pull requests**.
3. Bấm **Save**.

---

### BƯỚC 5: Bật Web Dashboard Trên GitHub Pages
1. Ở trang **Settings** của repository $\rightarrow$ Chọn mục **Pages** ở menu bên trái.
2. Tại mục **Build and deployment**:
   * **Source:** Chọn `Deploy from a branch`.
   * **Branch:** Chọn `main` và thư mục `/ (root)`.
3. Bấm **Save**.
4. Sau khoảng 1-2 phút, bạn sẽ nhận được đường link Web Dashboard riêng dạng:  
   `https://<TEN-TAI-KHOAN-CUA-BAN>.github.io/competitor-tracker/`  
   *(Bạn có thể mở link này trên điện thoại hoặc máy tính bất kỳ lúc nào để xem)*.

---

## 🎯 CÁCH QUẢN LÝ KÊNH ĐỐI THỦ

Bạn chỉ cần chỉnh sửa file `channels.json` trực tiếp trên web GitHub hoặc trên máy tính:

```json
[
  {
    "name": "Tên Kênh Đối Thủ A",
    "handle_or_url": "@TenHandleKenhA",
    "min_views_per_hour": 5000
  },
  {
    "name": "Kênh Đối Thủ B",
    "handle_or_url": "https://www.youtube.com/@TenHandleKenhB",
    "min_views_per_hour": 10000
  }
]
```

* **`handle_or_url`**: Hỗ trợ link kênh đầy đủ, `@handle`, hoặc mã Channel ID (`UC...`).
* **`min_views_per_hour`**: Ngưỡng cảnh báo riêng cho kênh đó (ví dụ: kênh nhỏ đặt 1.000, kênh lớn đặt 50.000).

---

## ⚡ CÁCH KÍCH HOẠT QUÉT NGAY LẬP TỨC
Nếu bạn không muốn đợi đến giờ quét tự động:
1. Vào tab **Actions** trên GitHub.
2. Chọn workflow **24/7 Competitor Video Tracker** ở cột bên trái.
3. Bấm nút **Run workflow** $\rightarrow$ Bấm **Run workflow** màu xanh.
4. Hệ thống sẽ quét ngay lập tức và gửi Discord nếu có video viral!

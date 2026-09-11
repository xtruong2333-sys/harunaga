# PROMPT & SYSTEM ARCHITECTURE DESIGN BRIEF: YOUTUBE RADAR ENTERPRISE UI
> **File:** `youtube-radar-enterprise-ui.md`  
> **Dành cho:** ChatGPT / Claude / v0.dev / AI UI Designer  
> **Mục tiêu:** Tái thiết kế toàn diện giao diện (UI/UX) cho hệ thống **Bắt Bài Đối Thủ - YouTube Radar Intelligence & AI Remake Studio**.

---

## 📋 HƯỚNG DẪN SỬ DỤNG
1. Mở ChatGPT (khuyên dùng GPT-4o, Canvas hoặc Claude 3.5 Sonnet).
2. Copy toàn bộ nội dung từ phần **BẮT ĐẦU PROMPT** bên dưới và dán vào ChatGPT.
3. ChatGPT sẽ tự động hiểu 100% logic dữ liệu, các chỉ số đo lường, cấu trúc phân hệ và viết cho bạn bản thiết kế UI code Tailwind CSS / Vue 3 đẳng cấp nhất.

---

```markdown
# PROMPT YÊU CẦU THIẾT KẾ LẠI GIAO DIỆN (UI/UX DESIGN BRIEF)

Bạn là một chuyên gia UI/UX Designer và Senior Frontend Architect hàng đầu thế giới (chuyên phong cách Enterprise Dark Mode hiện đại kiểu Linear.app, Vercel, Raycast, Stripe Dashboard).

Tôi có một hệ thống Web App đã hoàn thiện 100% logic tính toán, thuật toán phân tích và nguồn dữ liệu realtime. Bây giờ tôi cần bạn TÁI THIẾT KẾ TOÀN BỘ GIAO DIỆN (UI/UX) cho hệ thống này sao cho đạt đẳng cấp phần mềm SaaS Enterprise chuyên nghiệp, trực quan, thẩm mỹ cao và trải nghiệm người dùng mượt mà nhất.

---

## 1. TỔNG QUAN HỆ THỐNG
- **Tên hệ thống:** Bắt Bài Đối Thủ - YouTube Radar Intelligence & AI Remake Studio (by Truongday).
- **Mục đích:** Nền tảng phân tích tình báo đối thủ cạnh tranh YouTube trong ngành DIY & Sáng tạo nội dung (hiện đang quét tự động 46 kênh đối thủ lớn, lưu trữ ~700 video).
- **Tính năng cốt lõi:**
  1. Tự động nhận diện video bão view, đo vận tốc dòng tiền traffic thời gian thực.
  2. Đo chỉ số đột biến chuẩn **vidIQ Outlier** và điểm động lực xu hướng **Momentum Score (0-100)**.
  3. Tích hợp AI Bot (Gemini) bóc tách kịch bản, lời thoại và xuất kịch bản "Remake 1-Click" để tạo video ăn theo đề xuất.
  4. Quản lý kho ý tưởng, bảng xếp hạng phong độ kênh đối thủ và phân quyền Admin/Pro.

- **Công nghệ nền tảng:**
  - Single-Page Web App (SPA) chạy trực tiếp trên GitHub Pages / Static Hosting.
  - Vue.js 3 (Composition API) + Tailwind CSS + Phosphor Icons.
  - Hỗ trợ Dark Mode (mặc định) và Light Mode.

---

## 2. CẤU TRÚC DỮ LIỆU & CÁC CHỈ SỐ TOÁN HỌC CỐT LÕI

Khi thiết kế lại giao diện, bạn PHẢI bố trí trực quan các chỉ số đo lường sau:

1. **Vận Tốc Lượt Xem (Velocity):**
   - Hỗ trợ công tắc chuyển đổi: **Theo Ngày (24h)** (mặc định) và **Theo Giờ (1h)**.
   - Đơn vị: `+... view/ngày` (VPD = VPH * 24) hoặc `+... view/h` (VPH).
2. **Hệ Số Đột Biến vidIQ (Outlier Multiplier):**
   - Công thức: `Lượt xem video / Lượt xem trung vị thông thường của kênh (Channel Median)`.
   - Phân cấp Huy hiệu (Badges):
     - `👑 x10+ vs TB kênh` (Breakout - Siêu bão đột biến vượt bậc).
     - `🔥 x3 - x10 vs TB kênh` (Viral - Đột biến mạnh).
     - `⚡ x1.5 - x3 vs TB kênh` (Rising - Đang tăng tốc).
     - `⚪ x0.8 - x1.5 vs TB kênh` (Normal - Bình thường).
   - Kèm mốc so sánh: `(TB: ... view)` để người dùng biết mức trung bình thông thường của kênh đối thủ.
3. **Điểm Động Lực Xu Hướng (Momentum Score: 0 - 100 điểm):**
   - Kết hợp 3 yếu tố: Độ đột biến vidIQ (40đ) + Tốc độ lưu lượng tức thì (40đ) + Độ mới xuất bản (20đ).
   - Thể hiện dạng Pill/Thanh đo năng lượng: `🚀 85đ Xu Hướng`.

---

## 3. CÁC KHU VỰC VÀ PHÂN HỆ GIAO DIỆN HIỆN TẠI

Hệ thống bao gồm 6 màn hình (Views) và 2 Modal điều khiển chính:

### A. THANH ĐIỀU HƯỚNG TRÊN CÙNG (NAVBAR & HEADER)
- **Logo thương hiệu:** "Bắt Bài Đối Thủ" kèm tag trạng thái quét `Radar 24/7`.
- **Menu chuyển đổi 6 Tab:**
  1. `📊 Tổng Quan` (Dashboard điều hành & Top 5)
  2. `🎬 Radar Video` (Lưới video toàn cảnh kèm bộ lọc thông minh)
  3. `🏆 Đua Top Kênh` (Bảng xếp hạng 46 kênh đối thủ)
  4. `🔥 Xu Hướng Hot` (Top 15 video đột biến cao nhất)
  5. `🤖 Kho AI Remake` (Quản lý các kịch bản AI đã phân tích)
  6. `🔖 Kho Ý Tưởng` (Bộ sưu tập các video đã đánh dấu lưu lại)
- **Tiện ích bên phải:** Nút bật/tắt Dark/Light Mode, Trạng thái máy chủ Cloud 24/7, Nút "Quản Lý Data & Key", Avatar Người dùng/Admin (Role Admin có khung viền hào quang RGB chuyển màu).

### B. HERO BANNER TÌNH BÁO TOÀN CẢNH
- Tiêu đề định vị công nghệ: "Radar Tình Báo YouTube & Phân Tích Đối Thủ".
- **4 Thẻ số liệu KPI chính:**
  - `KÊNH QUÉT: 46`
  - `VIDEO MỚI: 676`
  - `BÃO VIEW: 39`
  - `Ý TƯỞNG LƯU: ...`

### C. SECTION CHỈ SỐ RADAR LƯU LƯỢNG (4 BENTO CARDS TƯƠNG TÁC)
- **Thanh điều khiển:** Nút Switcher chuyển đổi `[ 📅 Theo Ngày (24h) ]` và `[ ⏱ Theo Giờ (1h) ]`.
- **4 Thẻ Bento (Có hiệu ứng Hào quang RGB Wave khi rê chuột):**
  - **Bento 1 (#1 Tốc Độ Đỉnh):** Tên kênh, Handle, Vận tốc đỉnh (`+364.8K view/ngày`), Video chạy nhanh nhất.
  - **Bento 2 (#1 Gom Traffic):** Kênh hút nhiều lượt xem nhất cả kênh (`+837.6K view/ngày`).
  - **Bento 3 (#1 Tỷ Lệ Bùng Nổ):** Kênh có tỷ lệ video nổ cao nhất (`73.3%`, kèm số lượng video viral).
  - **Bento 4 (Quy Mô Ngành):** Tổng lưu lượng toàn ngành DIY (`+5.86M view/ngày`).

### D. SECTION TOP 5 SO SÁNH SONG HÀNH (2-COLUMN SPLIT)
- **Cột Trái - Top 5 Siêu Video Tăng Tốc Đột Biến:**
  - Hiển thị từng video: Thứ hạng (#1 đến #5), Ảnh Thumbnail 16:9, Tên kênh, Tiêu đề video, Vận tốc realtime (`+.../ngày`), Lượt xem, Badge đột biến `👑 x... vs TB kênh` kèm mốc `(TB: ... view)`, Nút gọi AI Remake và Nút Lưu Bookmark.
- **Cột Phải - Top 5 Kênh Thống Trị Lưu Lượng:**
  - Thứ hạng (#1 đến #5), Tên kênh, Tổng lưu lượng hút view (`+.../ngày`), Số video bão view, Video đại diện và Nút lọc nhanh video của kênh đó.

### E. MÀN HÌNH CHÍNH "RADAR VIDEO" (LƯỚI VIDEO NÂNG CAO)
- **Toolbar đa tầng:**
  - Ô tìm kiếm từ khóa realtime (tiêu đề, tên kênh, handle).
  - Thanh Tabs Lọc thông minh: `Tất Cả`, `👑 Đột Biến x3+`, `🔥 Bão View`, `⚡ Tăng Tốc`, `🚀 Xu Hướng 70đ+`, `⭐ Đã Lưu`.
  - Dropdown lọc theo từng kênh cụ thể.
  - Dropdown sắp xếp: Tốc độ cao nhất, Đột biến nhất (vidIQ), Điểm xu hướng (Momentum), Lượt xem nhiều nhất, Mới nhất.
- **Lưới Video Card (Card Luxury):**
  - Thumbnail 16:9 sắc nét, Badge vidIQ góc trên trái, Badge vận tốc nhấp nháy góc trên phải, Tên kênh góc dưới trái, Thời gian đăng góc dưới phải.
  - Phần thân: Tiêu đề video (click xem YouTube), Tổng view, Vận tốc view, Điểm Momentum `🚀 ...đ`, Chỉ số TB kênh `(TB: ... view)`.
  - Nút bấm hành động: Nút lớn gradient "Phân Tích AI Remake (1-Click)", Nút mở YouTube, Nút Bookmark lưu trữ.

### F. CÁC MODAL HỆ THỐNG
1. **Modal Studio AI Remake Kịch Bản:**
   - Xem video YouTube nhúng trực tiếp.
   - Bảng phân tích AI chuyên sâu: Góc tiếp cận (Angle Hook), Điểm nghẽn giữ chân khán giả (Retention Loop), Lời thoại gốc bóc tách, và Kịch bản AI Remake chi tiết (phân cảnh, góc quay, hành động, mẹo giật tít tiêu đề).
2. **Modal Quản Lý Data & API Key (3 Tab):**
   - Tab 1: Bản quyền, trạng thái gói dịch vụ (Pro / Enterprise).
   - Tab 2: Quản lý danh sách kênh đối thủ và cấu hình Webhook thông báo Discord 24/7.
   - Tab 3: Cấu hình Gemini API Key và Lịch sử hệ thống.

---

## 4. YÊU CẦU BẠN CẦN THỰC HIỆN CHO BẢN THIẾT KẾ LẠI:

1. **Phong cách thiết kế (Design Language):**
   - Đưa ra bản thiết kế UI phong cách **Enterprise Dark Mode** cực kỳ hiện đại, sang trọng, đẳng cấp (kết hợp tông nền Slate-950/Dark Navy, đường viền siêu mảnh Subtle Borders, hiệu ứng ánh sáng Neon Glow / Gradient viền tinh tế, Glassmorphism).
2. **Tối ưu Bố cục (Layout Architecture):**
   - Tái sắp xếp các khu vực hiển thị (Dashboard Overview, Bento Cards, Top 5 Split, Radar Grid) sao cho khoa học, tiết kiệm diện tích nhưng làm nổi bật rõ nét 2 chỉ số độc quyền: **Vận tốc theo Ngày/Giờ** và **Hệ số Đột biến vidIQ (Outlier Multiplier)**.
3. **Mã nguồn hoàn chỉnh (HTML/Tailwind CSS/Vue 3):**
   - Hãy viết mã HTML template kết hợp Tailwind CSS hoàn chỉnh, có class rõ ràng, chú thích chi tiết từng khối giao diện để tôi có thể tích hợp trực tiếp vào dự án.
   - Đảm bảo responsive mượt mà từ Mobile (375px), Tablet (768px), Laptop (1440px) đến Màn hình lớn (2K/4K).
```

# BẮT BÀI ĐỐI THỦ — RADAR ENTERPRISE V2

## Mục tiêu
Đại tu trực tiếp trên production source hiện có, giữ nguyên Vue 3 CDN + Tailwind CDN + Chart.js + Phosphor + Python Radar/Data pipeline. Không chuyển framework và không thay schema JSON.

## Nâng cấp giao diện
- Design language mới: Military Intelligence Terminal × Enterprise SaaS × Esports Command Center.
- Nền slate/black sâu hơn, grid/noise cực nhẹ, ambient cyan/indigo/emerald có kiểm soát.
- Sidebar thu gọn 264px / 76px, active rail tinh tế, hover spotlight, icon collapse rõ ràng.
- Topbar 68px gọn hơn, trạng thái RADAR LIVE, Cloud Online, Command Search, Bot Scan, Admin, notifications và account.
- Page header có live source, signal count, target count và countdown phiên scan.
- Glass surfaces giảm cảm giác “template neon”, border/shadow/depth đồng nhất hơn.
- KPI, video cards, tables, podium, heatmap, Kanban và modal dùng cùng một visual system.
- Modal animation chuyển sang spring-like cubic-bezier; mobile modal thành full-screen workspace để tránh tràn.
- Mobile có command dock: Tổng quan / Radar / AI Lab / Pipeline / Thêm.
- Light mode vẫn được giữ và có override tương thích V2.

## Nâng cấp UX / Performance
- Video Radar chỉ render 48 video đầu và “Hiển thị thêm” theo batch 48, nhưng filter/sort vẫn chạy trên toàn bộ dataset.
- Thumbnail động dùng lazy loading + async decoding ở các vùng nặng.
- Pipeline desktop hỗ trợ kéo-thả giữa 4 stage; nút ← / → cũ vẫn hoạt động để giữ workflow và mobile compatibility.
- Active tab và trạng thái collapse sidebar được nhớ qua localStorage.
- Toast trên mobile tự né command dock.
- Tablet Pipeline chuyển sang 2 cột thay vì ép một cột dài.

## Persistence V2, tương thích ngược
Bổ sung key theo tài khoản, đồng thời vẫn đọc/ghi các key cũ:
- `RADAR_CHANNELS_{user}`
- `RADAR_ACCOUNT_SETTINGS_{user}`
- `USER_AVATAR_{user}`
- `RADAR_ACTIVE_TAB`
- `RADAR_SIDEBAR_COLLAPSED`
- `RADAR_UI_VERSION=2`

Các key cũ như `SAVED_IDEA_IDS_{user}`, `PIPELINE_TASKS_{user}`, `youtube-radar:{user}`, `GH_PAT_TOKEN`, `GEMINI_API_KEY`, `DISCORD_WEBHOOK_URL...` vẫn được hỗ trợ.

Đã sửa edge case: bookmark/task rỗng `[]` giờ được khôi phục đúng, không tự bật lại dữ liệu demo sau F5.

## Lỗi source cũ được sửa an toàn
- `MetricScore` có object computed chứa biến ngoài scope, có thể gây ReferenceError khi render component. Đã sửa map accent thuần.
- `ChannelPicker` và `SidebarContent` dùng `handleImgError` nhưng component không nhận helper đúng scope. Đã inject helper qua Radar context.
- Khi đổi/login account, state trong RAM được reset trước khi load workspace mới để tránh dữ liệu user trước “rò” sang user sau.

## Những gì KHÔNG đổi
- Data schema JSON.
- Python Radar scripts / GitHub Actions logic.
- Core filter/sort/business functions.
- Bookmark / Pipeline / AI / Simulator / Battle / Channel Detail / Admin integrations.
- CSV export UTF-8 BOM.
- 8 tab chính.
- 11 modal đang có trong source thật.

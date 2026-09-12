import os
import sys
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone

def send_discord_alert(webhook_url: str, video_info: dict, channel_name: str, threshold: int, dashboard_url: str = "", alert_type: str = "viral"):
    """
    Gửi tin nhắn cảnh báo video viral tới một hoặc nhiều Discord Webhook dưới dạng Rich Embed.
    Hỗ trợ Webhook đơn lẻ hoặc danh sách phân tách bằng dấu phẩy.
    Phân loại màu sắc & tiêu đề theo alert_type: 'viral' (Bão View), 'outlier' (Đột Biến), 'rising' (Kênh Mới Nổi).
    """
    if not webhook_url or not webhook_url.strip():
        print("⚠️ [DISCORD] Chưa cấu hình Discord Webhook. Bỏ qua gửi thông báo.")
        return False

    # Hỗ trợ truyền nhiều webhook phân tách bằng dấu phẩy
    urls = [u.strip() for u in webhook_url.split(",") if u.strip().startswith("http")]
    if not urls:
        print("⚠️ [DISCORD] Không tìm thấy URL Webhook hợp lệ.")
        return False

    vph = video_info.get("effective_vph", 0)
    views = video_info.get("views", 0)
    title = video_info.get("title", "Không có tiêu đề")
    url = video_info.get("url", "")
    thumbnail = video_info.get("thumbnail", "")
    published_ago = video_info.get("hours_ago_formatted", "")
    ai_data = video_info.get("ai_analysis")
    outlier_score = video_info.get("outlier_score", 1.0)

    # Tùy chỉnh màu và tiêu đề theo loại cảnh báo
    if alert_type == "rising" or "mới nổi" in channel_name.lower():
        embed_color = 1097857  # Xanh ngọc Emerald #10B981
        alert_badge = "🌱 KÊNH MỚI NỔI BÙNG NỔ"
        alert_desc = f"Kênh mới nổi **{channel_name}** vừa có video ăn đề xuất mạnh: **+{vph:,} view/h**!"
    elif alert_type == "outlier" or outlier_score >= 3.0:
        embed_color = 16103179  # Vàng cam #F59E0B
        alert_badge = f"👑 VIDEO ĐỘT BIẾN GẤP {outlier_score}X"
        alert_desc = f"Video của **{channel_name}** đang có lượng xem gấp **{outlier_score}x** so với mức bình thường của kênh!"
    else:
        embed_color = 16724787  # Đỏ cam #FF3333
        alert_badge = "🚨 SIÊU BÃO VIEW YOUTUBE"
        alert_desc = f"Video mới của kênh **{channel_name}** đang tăng trưởng vượt ngưỡng **{threshold:,} views/giờ**!"

    # Embed 1: Cảnh báo chính
    embed1 = {
        "title": f"{alert_badge}: {title}",
        "url": url,
        "color": embed_color,
        "description": alert_desc,
        "fields": [
            {"name": "📺 Kênh", "value": f"**{channel_name}**", "inline": True},
            {"name": "⚡ Tốc Độ Xem", "value": f"🔥 **+{vph:,} view/h**", "inline": True},
            {"name": "👀 Tổng Lượt Xem", "value": f"**{views:,}** views", "inline": True},
            {"name": "👑 Độ Đột Biến", "value": f"**Gấp {outlier_score}x bình thường**", "inline": True},
            {"name": "⏱ Thời Gian Đăng", "value": published_ago or "Vừa phát hiện", "inline": True},
            {"name": "🔗 Xem Trực Tiếp", "value": f"[Mở trên YouTube ↗]({url})", "inline": True}
        ],
        "image": {"url": thumbnail},
        "footer": {
            "text": "Bắt Bài Đối Thủ 24/7 • Harunaga Studio by Truongday",
            "icon_url": "https://cdn-icons-png.flaticon.com/512/1384/1384060.png"
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    embeds = [embed1]

    # Embed 2: Kịch bản AI Remake (nếu có)
    if ai_data and isinstance(ai_data, dict):
        remake_vi = ai_data.get("remake_angle_vi", "Đang phân tích...")
        hook_en = ai_data.get("english_hook_script", "")
        titles = ai_data.get("english_titles", [])
        thumb_info = ai_data.get("thumbnail_design", {})
        thumb_text = thumb_info.get("text_overlay_en", "")

        title_lines = []
        for i, t in enumerate(titles[:3]):
            title_text = t.get("title", "")
            meaning = t.get("vi_meaning", "")
            title_lines.append(f"**{i+1}.** {title_text}\n   *(Nghĩa: {meaning})*")
        title_block = "\n".join(title_lines) if title_lines else "Đang cập nhật"

        ai_fields = [
            {"name": "💡 Chiến Lược Làm Lại (Góc Quay / Ý Tưởng Mới)", "value": remake_vi[:500], "inline": False},
            {"name": "🎯 Top 3 Tiêu Đề Gợi Ý (High-CTR)", "value": title_block[:800], "inline": False}
        ]

        if hook_en:
            ai_fields.append({"name": "🎙️ Mẫu Câu Mở Đầu 15s (English Hook)", "value": f"_{hook_en[:300]}_", "inline": False})

        if thumb_text:
            ai_fields.append({"name": "🖼️ Chữ Trên Thumbnail Gợi Ý", "value": f"**\"{thumb_text}\"**", "inline": True})

        if dashboard_url:
            ai_fields.append({"name": "📋 Xem Chi Tiết & Copy 1-Click", "value": f"[Mở Web Dashboard]({dashboard_url})", "inline": False})

        embed2 = {
            "title": "🤖 Gợi Ý Làm Lại Video (AI Remake Blueprint)",
            "color": 9133302,
            "description": "Chiến lược làm lại video vượt trội đối thủ & đóng gói thành phẩm chuẩn quốc tế:",
            "fields": ai_fields,
            "footer": {
                "text": "Bắt Bài Đối Thủ • Phân Tích Độc Quyền bởi Truongday",
                "icon_url": "https://cdn-icons-png.flaticon.com/512/2103/2103832.png"
            }
        }
        embeds.append(embed2)

    payload = {
        "content": f"{alert_badge}: Kênh **{channel_name}** đang bùng nổ **+{vph:,} view/h**!",
        "embeds": embeds
    }

    success_count = 0
    req_data = json.dumps(payload).encode("utf-8")

    for target_url in urls:
        try:
            request = urllib.request.Request(
                target_url,
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CompetitorTracker/2.0"
                }
            )
            with urllib.request.urlopen(request, timeout=15) as response:
                if response.status in (200, 204):
                    print(f"✅ [DISCORD] Đã gửi cảnh báo thành công tới: '{title[:30]}...' (+{vph:,} view/h)")
                    success_count += 1
                else:
                    print(f"⚠️ [DISCORD] Phản hồi bất thường từ {target_url[:35]}...: {response.status}")
        except urllib.error.HTTPError as e:
            print(f"❌ [DISCORD ERROR] HTTP {e.code}: {e.read().decode('utf-8', errors='ignore')}")
        except Exception as ex:
            print(f"❌ [DISCORD ERROR] Lỗi gửi webhook: {ex}")

    return success_count > 0

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--test':
        target = sys.argv[2] if len(sys.argv) > 2 else os.environ.get('DISCORD_WEBHOOK_URL', '')
        test_video = {
            'title': 'Attach an Old Toothbrush to a Plastic Bottle — Every Home Needs It!',
            'url': 'https://www.youtube.com/watch?v=K2m3eNtFPK0',
            'thumbnail': 'https://i.ytimg.com/vi/K2m3eNtFPK0/hqdefault.jpg',
            'views': 25400,
            'effective_vph': 2850,
            'hours_ago_formatted': '3 giờ trước',
            'outlier_score': 4.5,
            'ai_analysis': {
                'remake_angle_vi': 'Thay vì gắn bàn chải thông thường, hãy biến thành vòi phun nước mini có thể điều chỉnh tia nước để cọ rửa góc hẹp.',
                'english_titles': [
                    {'title': 'Attach a Toothbrush to a Bottle - Genius Cleaning Hack!', 'vi_meaning': 'Gắn bàn chải vào chai - Mẹo dọn dẹp thiên tài'},
                    {'title': 'Why Everyone Is Putting Old Toothbrushes on Bottles', 'vi_meaning': 'Tại sao ai cũng gắn bàn chải cũ vào chai'}
                ],
                'english_hook_script': 'Never throw away your old toothbrush! Watch what happens when you screw it onto a plastic bottle.',
                'thumbnail_design': {'text_overlay_en': 'GENIUS IDEA!'}
            }
        }
        print(f"Đang gửi tin nhắn thử nghiệm tới: {target[:45]}...")
        result = send_discord_alert(target, test_video, 'Clever Home Hacks', 1000, 'https://xtruong2333-sys.github.io/harunaga/', 'outlier')
        print("Kết quả test:", "THÀNH CÔNG 🎉" if result else "THẤT BÀI ❌")

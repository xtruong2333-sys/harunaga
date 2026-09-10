import os
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone

def send_discord_alert(webhook_url: str, video_info: dict, channel_name: str, threshold: int, dashboard_url: str = ""):
    """
    Gửi tin nhắn cảnh báo video viral tới Discord Webhook dưới dạng Rich Embed.
    Nếu có dữ liệu AI Analysis, sẽ đính kèm Embed phân tích chiến lược & kịch bản quốc tế.
    """
    if not webhook_url or not webhook_url.strip():
        print("⚠️ [DISCORD] Chưa cấu hình DISCORD_WEBHOOK_URL. Bỏ qua gửi thông báo.")
        return False

    vph = video_info.get("effective_vph", 0)
    views = video_info.get("views", 0)
    title = video_info.get("title", "Không có tiêu đề")
    url = video_info.get("url", "")
    thumbnail = video_info.get("thumbnail", "")
    published_ago = video_info.get("hours_ago_formatted", "")
    ai_data = video_info.get("ai_analysis")

    # Embed 1: Cảnh báo Viral chính
    embed1 = {
        "title": f"🚨 {title}",
        "url": url,
        "color": 16724787,  # Đỏ cam #FF3333
        "description": f"Video mới của kênh **{channel_name}** đang tăng trưởng vượt ngưỡng **{threshold:,} views/giờ**!",
        "fields": [
          {
            "name": "📺 Kênh Đối Thủ",
            "value": f"**{channel_name}**",
            "inline": True
          },
          {
            "name": "📈 Tốc Độ Tăng Trưởng",
            "value": f"🔥 **+{vph:,} view/h**",
            "inline": True
          },
          {
            "name": "👀 Tổng Lượt Xem",
            "value": f"**{views:,}** views",
            "inline": True
          },
          {
            "name": "⏱ Thời Gian Đăng",
            "value": published_ago,
            "inline": True
          },
          {
            "name": "🔗 Link Video Gốc",
            "value": f"[Xem trên YouTube]({url})",
            "inline": False
          }
        ],
        "image": {
            "url": thumbnail
        },
        "footer": {
            "text": "Competitor Video Tracker 24/7 • GitHub Actions",
            "icon_url": "https://cdn-icons-png.flaticon.com/512/1384/1384060.png"
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    embeds = [embed1]

    # Embed 2: Bản Phân Tích & Kịch Bản Remake Quốc Tế (Nếu AI đã phân tích xong)
    if ai_data and isinstance(ai_data, dict):
        remake_vi = ai_data.get("remake_angle_vi", "Đang cập nhật...")
        hook_en = ai_data.get("english_hook_script", "")
        titles = ai_data.get("english_titles", [])
        thumb_info = ai_data.get("thumbnail_design", {})
        thumb_text = thumb_info.get("text_overlay_en", "")

        # Format 3 tiêu đề tiếng Anh mẫu
        title_lines = []
        for i, t in enumerate(titles[:3]):
            title_text = t.get("title", "")
            meaning = t.get("vi_meaning", "")
            title_lines.append(f"**{i+1}.** {title_text}\n   *(Nghĩa: {meaning})*")
        title_block = "\n".join(title_lines) if title_lines else "Đang cập nhật"

        ai_fields = [
            {
                "name": "💡 Chiến Lược Cải Tiến (Góc Nhìn Mới)",
                "value": remake_vi[:500],
                "inline": False
            },
            {
                "name": "🎯 Top 3 Tiêu Đề Tiếng Anh (High-CTR)",
                "value": title_block[:800],
                "inline": False
            }
        ]

        if hook_en:
            ai_fields.append({
                "name": "🎙️ Mẫu Câu Mở Đầu 15s (English Hook)",
                "value": f"_{hook_en[:300]}_",
                "inline": False
            })

        if thumb_text:
            ai_fields.append({
                "name": "🖼️ Chữ Trên Thumbnail (English)",
                "value": f"**\"{thumb_text}\"**",
                "inline": True
            })

        if dashboard_url:
            ai_fields.append({
                "name": "📋 Xem Chi Tiết & Copy 1-Click",
                "value": f"[Mở Web Dashboard]({dashboard_url})",
                "inline": False
            })

        embed2 = {
            "title": "🤖 AI Content Strategist: Bản Đóng Gói Kênh Quốc Tế",
            "color": 9133302,  # Tím hiện đại #8B5CF6
            "description": "Chiến lược làm lại video vượt trội đối thủ & đóng gói thành phẩm chuẩn US/Global:",
            "fields": ai_fields,
            "footer": {
                "text": "Powered by Google Gemini 1.5 Flash • 0đ",
                "icon_url": "https://cdn-icons-png.flaticon.com/512/2103/2103832.png"
            }
        }
        embeds.append(embed2)

    payload = {
        "content": f"🔥 **CẢNH BÁO VIRAL & KỊCH BẢN REMAKE:** Kênh **{channel_name}** vừa bùng nổ **+{vph:,} views/giờ**!",
        "embeds": embeds
    }

    try:
        req_data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            webhook_url.strip(),
            data=req_data,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CompetitorTracker/1.0"
            }
        )
        with urllib.request.urlopen(request, timeout=15) as response:
            if response.status in (200, 204):
                print(f"✅ [DISCORD] Đã gửi cảnh báo thành công cho video: '{title[:30]}...' (+{vph:,} view/h)")
                return True
            else:
                print(f"⚠️ [DISCORD] Phản hồi bất thường: {response.status}")
                return False
    except urllib.error.HTTPError as e:
        print(f"❌ [DISCORD ERROR] HTTP {e.code}: {e.read().decode('utf-8', errors='ignore')}")
        return False
    except Exception as ex:
        print(f"❌ [DISCORD ERROR] Lỗi gửi webhook: {ex}")
        return False

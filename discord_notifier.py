import os
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone

def send_discord_alert(webhook_url: str, video_info: dict, channel_name: str, threshold: int):
    """
    Gửi tin nhắn cảnh báo video viral tới Discord Webhook dưới dạng Rich Embed.
    Hoàn toàn sử dụng thư viện chuẩn urllib (không cần cài thêm pip packages).
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

    # Màu đỏ cam cảnh báo viral: 0xFF3333
    embed = {
        "title": f"🚨 {title}",
        "url": url,
        "color": 16724787,  # #FF3333
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
            "name": "🔗 Link Video",
            "value": f"[Bấm vào đây để xem ngay]({url})",
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

    payload = {
        "content": f"🔥 **CẢNH BÁO VIRAL:** Kênh **{channel_name}** vừa có video tăng trưởng **+{vph:,} views/giờ**!",
        "embeds": [embed]
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

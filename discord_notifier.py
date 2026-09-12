import os
import sys
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

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

    # Tên định danh & Ảnh đại diện riêng cho từng loại Bot trên Discord
    if alert_type == "outlier" or outlier_score >= 3.0:
        bot_username = "chạy đâu con sâu"
        bot_avatar = "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Bug/3D/bug_3d.png"
    elif alert_type == "rising" or "mới nổi" in channel_name.lower():
        bot_username = "chạy đâu con sâu"
        bot_avatar = "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Bug/3D/bug_3d.png"
    else:
        bot_username = "Đi đâu con lợn này"
        bot_avatar = "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Pig%20face/3D/pig_face_3d.png"

    payload = {
        "username": bot_username,
        "avatar_url": bot_avatar,
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

def send_channel_discovery_alert(webhook_url: str, channel_data: dict, star_video: dict = None, ai_data: dict = None, dashboard_url: str = "", alert_type: str = "new_channel") -> bool:
    """
    Gửi tin nhắn cảnh báo KÊNH MỚI NỔI (YouTube Emerging Channel Radar) tới một hoặc nhiều Discord Webhook.
    alert_type:
      - 'new_channel': Phát hiện kênh mới đạt chuẩn (<10k subs, <120 ngày, metrics đột biến)
      - 'breakout': Kênh bùng nổ Breakout (Radar score > 75, view tăng phi mã)
      - 'test': Tin nhắn kiểm tra kết nối Webhook
    """
    if not webhook_url or not webhook_url.strip():
        print("⚠️ [DISCORD RADAR] Chưa cấu hình Discord Webhook. Bỏ qua gửi thông báo kênh mới.")
        return False

    urls = [u.strip() for u in webhook_url.split(",") if u.strip().startswith("http")]
    if not urls:
        print("⚠️ [DISCORD RADAR] Không tìm thấy URL Webhook hợp lệ.")
        return False

    title = channel_data.get("title", "Kênh Mới Nổi")
    handle = channel_data.get("handle", "")
    channel_id = channel_data.get("channel_id", "")
    subs_formatted = channel_data.get("subscribers_formatted") or f"{channel_data.get('subscriber_count', 0):,}"
    active_age = channel_data.get("active_age_days", 0)
    last_upload_age = channel_data.get("last_upload_age_days", 0)
    radar_score = channel_data.get("radar_score", 0.0)
    views_90d = channel_data.get("views_90d", 0)
    median_views = channel_data.get("median_views_90d", 0)
    median_vps = channel_data.get("median_views_per_sub", 0.0)
    max_vps = channel_data.get("max_views_per_sub", 0.0)
    viral_repeats = channel_data.get("viral_repeat_count", 0)
    hit_rate = channel_data.get("hit_rate", 0.0)
    velocity = channel_data.get("median_view_velocity", 0.0)
    presets = channel_data.get("presets", [])
    query = channel_data.get("discovery_query", "")
    ch_thumbnail = channel_data.get("thumbnail", "")

    if not star_video:
        star_video = channel_data.get("star_video") or {}
    sv_title = star_video.get("title", "Chưa có video nổi bật")
    sv_url = star_video.get("url", f"https://www.youtube.com/channel/{channel_id}" if channel_id else "https://www.youtube.com")
    sv_views = star_video.get("views", 0)
    sv_vps = star_video.get("views_per_sub", 0.0)
    sv_velocity = star_video.get("view_velocity", 0.0)
    sv_thumb = star_video.get("thumbnail") or ch_thumbnail

    channel_url = f"https://www.youtube.com/channel/{channel_id}" if channel_id.startswith("UC") else f"https://www.youtube.com/{handle}"
    radar_page_url = f"{dashboard_url}#radar" if dashboard_url else "https://xtruong2333-sys.github.io/harunaga/#radar"

    # Tên định danh & Ảnh đại diện Bot Rắn không độc trên Discord
    bot_username = "Rắn không độc"
    bot_avatar = "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Snake/3D/snake_3d.png"

    # Định dạng theo loại cảnh báo
    if alert_type == "breakout":
        embed_color = 16103179  # Vàng cam đậm #F59E0B
        badge = "🚨 [RADAR BREAKOUT] KÊNH BÙNG NỔ ĐỘT BIẾN"
        desc = f"Kênh **{title}** (`{handle}`) vừa kích hoạt trạng thái **EARLY BREAKOUT**! Tốc độ tăng trưởng và hiệu suất view/sub đang bứt phá phi mã."
    elif alert_type == "test":
        embed_color = 5793266   # Indigo tím #5865F2
        badge = "🧪 [RADAR TEST] KẾT NỐI DISCORD THÀNH CÔNG"
        desc = f"Hệ thống **YouTube Emerging Channel Radar** đã kết nối thành công với phòng chat Discord của bạn! Khi phát hiện kênh mới hoặc kênh bùng nổ, bot sẽ gửi cảnh báo ngay vào đây."
    else:
        embed_color = 1097857   # Xanh ngọc Emerald #10B981
        badge = "🌱 [RADAR] PHÁT HIỆN KÊNH MỚI NỔI TIỀM NĂNG"
        desc = f"Radar vừa quét phát hiện kênh mới **{title}** (`{handle}`) thỏa mãn tiêu chí kênh nhỏ view khủng (<10K subs, hoạt động {active_age} ngày)."

    preset_text = " • ".join([f"`{p}`" for p in presets[:3]]) if presets else "`EMERGING`"

    fields = [
        {"name": "📺 Kênh YouTube", "value": f"**[{title}]({channel_url})**\n`{handle}`", "inline": True},
        {"name": "🎯 Radar Score", "value": f"⭐ **{radar_score}/100**\n{preset_text}", "inline": True},
        {"name": "👥 Người Đăng Ký", "value": f"**{subs_formatted}** Subs\nTuổi kênh: `{active_age} ngày`", "inline": True},

        {"name": "⚡ Lượt Xem 90 Ngày", "value": f"**{views_90d:,}** views\n(Median: **{median_views:,}**)", "inline": True},
        {"name": "📈 Tỷ Lệ View / Sub", "value": f"🔥 **x{median_vps:.1f} lần**\n(Max: **x{max_vps:.1f}**)", "inline": True},
        {"name": "🚀 Tần Suất Viral", "value": f"🏆 **{viral_repeats} video**\n(Hit Rate: **{int(hit_rate*100)}%**)", "inline": True},
    ]

    if velocity > 0:
        fields.append({"name": "⏱️ Vận Tốc View", "value": f"⚡ **+{velocity:,.0f} view/ngày**", "inline": True})
    if query:
        fields.append({"name": "🔍 Từ Khóa Tìm Ra", "value": f"`{query}`", "inline": True})
    if last_upload_age is not None:
        fields.append({"name": "📅 Đăng Gần Nhất", "value": f"`{last_upload_age} ngày trước`", "inline": True})

    # Mục Star Video
    if sv_title and sv_title != "Chưa có video nổi bật":
        star_field_val = (
            f"🎬 **[{sv_title}]({sv_url})**\n"
            f"👀 **{sv_views:,}** views • 🔥 **x{sv_vps:.1f} Sub** • ⚡ **+{sv_velocity:,.0f} view/ngày**"
        )
        fields.append({"name": "🌟 Video Bùng Nổ Nhất (Star Video)", "value": star_field_val, "inline": False})

    fields.append({"name": "📊 Xem Chi Tiết Radar", "value": f"[Mở Web Radar Intelligence ↗]({radar_page_url})", "inline": False})

    embed1 = {
        "title": f"{badge}: {title}",
        "url": channel_url,
        "color": embed_color,
        "description": desc,
        "fields": fields,
        "thumbnail": {"url": ch_thumbnail} if ch_thumbnail else {},
        "image": {"url": sv_thumb} if sv_thumb else {},
        "footer": {
            "text": "Bắt Bài Đối Thủ • YouTube Emerging Channel Radar by Truongday",
            "icon_url": "https://cdn-icons-png.flaticon.com/512/1384/1384060.png"
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    embeds = [embed1]

    # Embed 2: Phân tích AI chuyên sâu nếu có trong cache
    if ai_data and isinstance(ai_data, dict):
        res_ai = ai_data.get("result") if "result" in ai_data else ai_data
        summary = res_ai.get("executive_summary") or res_ai.get("summary", "")
        playbook = res_ai.get("actionable_remake_playbook") or {}
        angles = playbook.get("direct_angles") or []
        growth_info = res_ai.get("why_channel_is_growing", {})
        drivers = growth_info.get("primary_growth_drivers") if isinstance(growth_info, dict) else []

        ai_fields = []
        if summary:
            ai_fields.append({"name": "🤖 Nhận Định AI Về Kênh", "value": summary[:500], "inline": False})
        if drivers:
            drivers_text = "\n".join([f"• {d}" for d in drivers[:3]])
            ai_fields.append({"name": "💡 Động Lực Tăng Trưởng Cốt Lõi", "value": drivers_text[:500], "inline": False})
        if angles:
            angles_text = "\n".join([f"**{i+1}.** {a.get('angle_name', 'Góc làm lại')}: {a.get('hook_concept', '')}" for i, a in enumerate(angles[:2])])
            ai_fields.append({"name": "🎯 Đề Xuất Chiến Lược Remake", "value": angles_text[:600], "inline": False})

        if ai_fields:
            embed2 = {
                "title": "🧠 Bóc Tách Tình Báo AI (Channel Intelligence)",
                "color": 9133302, # Tím Neon #8B5CF6
                "description": f"Phân tích chuyên sâu công thức thành công & kịch bản remake cho kênh **{title}**:",
                "fields": ai_fields,
                "footer": {
                    "text": "AI Channel Intelligence • Harunaga Studio by Truongday",
                    "icon_url": "https://cdn-icons-png.flaticon.com/512/2103/2103832.png"
                }
            }
            embeds.append(embed2)

    payload = {
        "username": bot_username,
        "avatar_url": bot_avatar,
        "content": f"{badge}: Kênh **{title}** ({handle}) vừa xuất hiện trên Radar! ⭐ Score: **{radar_score}/100**",
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
                    print(f"✅ [DISCORD RADAR] Đã gửi thông báo thành công cho kênh: '{title}'")
                    success_count += 1
                else:
                    print(f"⚠️ [DISCORD RADAR] Phản hồi bất thường từ {target_url[:35]}...: {response.status}")
        except urllib.error.HTTPError as e:
            print(f"❌ [DISCORD RADAR ERROR] HTTP {e.code}: {e.read().decode('utf-8', errors='ignore')}")
        except Exception as ex:
            print(f"❌ [DISCORD RADAR ERROR] Lỗi gửi webhook: {ex}")

    return success_count > 0

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--test-radar':
        target = sys.argv[2] if len(sys.argv) > 2 else os.environ.get('DISCORD_WEBHOOK_URL', '')
        sample_channel = {
            'title': 'Smart Scrap Lab',
            'handle': '@SmartScrapLab',
            'channel_id': 'UC_demo_smart_scrap_123',
            'thumbnail': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop&q=80',
            'subscriber_count': 3420,
            'subscribers_formatted': '3.42K',
            'active_age_days': 48,
            'last_upload_age_days': 2,
            'radar_score': 88.5,
            'views_90d': 640000,
            'median_views_90d': 92000,
            'median_views_per_sub': 26.9,
            'max_views_per_sub': 105.2,
            'viral_repeat_count': 5,
            'hit_rate': 0.83,
            'median_view_velocity': 14200.0,
            'presets': ['SUPER_EARLY_BREAKOUT', 'HIGH_EFFICIENCY'],
            'discovery_query': 'waste metal recycling hack',
            'star_video': {
                'title': "Don't Throw Away Broken Drill Bits! Genius Recycling Hack",
                'url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'thumbnail': 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80',
                'views': 360000,
                'view_velocity': 28500.0,
                'views_per_sub': 105.2
            }
        }
        sample_ai = {
            'executive_summary': 'Smart Scrap Lab bùng nổ nhờ định dạng ASMR no-talking kết hợp tiêu đề đánh trúng tâm lý tiếc nuối khi vứt đồ kim loại cũ.',
            'why_channel_is_growing': {
                'primary_growth_drivers': [
                    'Visual hook cuốn hút ngay 3 giây đầu tiên với máy cắt phôi',
                    'Đánh trúng từ khóa tìm kiếm "Don\'t Throw Away" đang thịnh hành',
                    'Thumbnail phóng to chi tiết điểm nhấn gây tò mò cao'
                ]
            },
            'actionable_remake_playbook': {
                'direct_angles': [
                    {'angle_name': 'Tái Chế Mũi Khoan Gãy Thành Dao Khắc', 'hook_concept': 'Đừng vứt mũi khoan gãy vào thùng rác, đây là cách thợ già biến nó thành lưỡi cắt siêu cứng!'}
                ]
            }
        }
        print(f"Đang gửi tin nhắn thử nghiệm Radar tới: {target[:45]}...")
        result = send_channel_discovery_alert(target, sample_channel, sample_channel['star_video'], sample_ai, 'https://xtruong2333-sys.github.io/harunaga/', 'new_channel')
        print("Kết quả test Radar:", "THÀNH CÔNG 🎉" if result else "THẤT BÀI ❌")

    elif len(sys.argv) > 1 and sys.argv[1] == '--test':
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

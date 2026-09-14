import os
import sys
import re
import json
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta

# Fix Windows console unicode encoding
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from discord_notifier import send_discord_alert
from ai_analyst import analyze_viral_video

# Đường dẫn file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHANNELS_FILE = os.path.join(BASE_DIR, "channels.json")
DATA_DIR = os.path.join(BASE_DIR, "data")
VIDEOS_FILE = os.path.join(DATA_DIR, "videos.json")
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")
AVATARS_FILE = os.path.join(DATA_DIR, "channel_avatars.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def load_json(filepath, default_val):
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️ Lỗi đọc file {filepath}: {e}")
    return default_val

def save_json(filepath, data):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def resolve_channel_id(handle_or_url: str, cache: dict) -> str | None:
    """
    Phân giải link kênh, handle @... hoặc channel ID thành channel ID chuẩn 24 ký tự (UC...).
    Sử dụng cache để không cần request lại nhiều lần.
    """
    cleaned = handle_or_url.strip()
    if cleaned in cache:
        return cache[cleaned]

    # Nếu đã là Channel ID (bắt đầu bằng UC và 24 ký tự)
    if cleaned.startswith("UC") and len(cleaned) == 24:
        cache[cleaned] = cleaned
        return cleaned

    # Chuẩn hóa URL
    url = cleaned
    if not url.startswith("http"):
        if not cleaned.startswith("@"):
            cleaned = "@" + cleaned
        url = f"https://www.youtube.com/{cleaned}"

    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="ignore")

        # Tìm channel_id trong mã nguồn trang
        m = re.search(r'channel_id=([a-zA-Z0-9_-]{24})', html)
        if m:
            cid = m.group(1)
            cache[cleaned] = cid
            return cid

        m2 = re.search(r'"channelId":"([a-zA-Z0-9_-]{24})"', html)
        if m2:
            cid = m2.group(1)
            cache[cleaned] = cid
            return cid

        # Tìm qua link rss trong header HTML
        m3 = re.search(r'href="https://www\.youtube\.com/feeds/videos\.xml\?channel_id=([a-zA-Z0-9_-]{24})"', html)
        if m3:
            cid = m3.group(1)
            cache[cleaned] = cid
            return cid

    except Exception as e:
        print(f"❌ Lỗi phân giải kênh '{handle_or_url}': {e}")

    return None

def resolve_channel_avatar(handle_or_url: str, cache: dict) -> str | None:
    """
    Lấy link ảnh avatar đại diện chính thức của kênh YouTube từ YouTube HTML.
    Không tốn quota API.
    """
    cleaned = handle_or_url.strip()
    if cleaned in cache and cache[cleaned]:
        return cache[cleaned]

    url = cleaned
    if not url.startswith("http"):
        if not cleaned.startswith("@"):
            cleaned = "@" + cleaned
        url = f"https://www.youtube.com/{cleaned}"

    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode("utf-8", errors="ignore")

        # 1. Thẻ meta og:image chuẩn
        m = re.search(r'<meta property="og:image" content="([^"]+)">', html)
        if m and "yt3.googleusercontent.com" in m.group(1):
            av = m.group(1)
            cache[cleaned] = av
            return av

        # 2. Trong JSON ytInitialData
        m2 = re.search(r'"avatar":\{"thumbnails":\[\{"url":"([^"]+)"', html)
        if m2:
            av = m2.group(1)
            cache[cleaned] = av
            return av

        # 3. Bất kỳ link yt3.googleusercontent.com nào
        m3 = re.search(r'(https://yt3\.googleusercontent\.com/[a-zA-Z0-9_-]+=[^"\s&]+)', html)
        if m3:
            av = m3.group(1)
            cache[cleaned] = av
            return av
    except Exception as e:
        print(f"⚠️ Không thể lấy avatar cho '{handle_or_url}': {e}")

    return None

def fetch_channel_videos(channel_id: str) -> list[dict]:
    """
    Lấy danh sách 15 video mới nhất từ RSS Feed chính thức của YouTube.
    Hoàn toàn miễn phí, không tốn quota API.
    """
    rss_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    req = urllib.request.Request(rss_url, headers=HEADERS)
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            xml_data = resp.read().decode("utf-8", errors="ignore")
            
        root = ET.fromstring(xml_data)
        ns = {
            "atom": "http://www.w3.org/2005/Atom",
            "media": "http://search.yahoo.com/mrss/",
            "yt": "http://www.youtube.com/xml/schemas/2015"
        }

        videos = []
        for entry in root.findall("atom:entry", ns):
            # Video ID
            yt_id_el = entry.find("yt:videoId", ns)
            video_id = yt_id_el.text if yt_id_el is not None else ""
            if not video_id:
                atom_id = entry.find("atom:id", ns)
                if atom_id is not None and atom_id.text:
                    video_id = atom_id.text.replace("yt:video:", "")

            title_el = entry.find("atom:title", ns)
            title = title_el.text if title_el is not None else "Không có tiêu đề"

            pub_el = entry.find("atom:published", ns)
            pub_str = pub_el.text if pub_el is not None else ""

            # Lượt xem và thumbnail từ media:group
            media_group = entry.find("media:group", ns)
            views = 0
            thumbnail = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
            desc = ""

            if media_group is not None:
                community = media_group.find("media:community", ns)
                if community is not None:
                    stats = community.find("media:statistics", ns)
                    if stats is not None and "views" in stats.attrib:
                        try:
                            views = int(stats.attrib["views"])
                        except ValueError:
                            views = 0

                thumb_el = media_group.find("media:thumbnail", ns)
                if thumb_el is not None and "url" in thumb_el.attrib:
                    thumbnail = thumb_el.attrib["url"]

                desc_el = media_group.find("media:description", ns)
                if desc_el is not None and desc_el.text:
                    desc = desc_el.text

            # Nhận diện YouTube Shorts vs Video Dài
            is_short = ("#shorts" in title.lower() or "#short" in title.lower() or "#shorts" in desc.lower())
            content_type = "SHORT" if is_short else "LONG_FORM"

            link = f"https://www.youtube.com/watch?v={video_id}"

            videos.append({
                "video_id": video_id,
                "title": title,
                "url": link,
                "thumbnail": thumbnail,
                "published_at": pub_str,
                "views": views,
                "content_type": content_type
            })

        return videos
    except Exception as e:
        print(f"❌ Lỗi tải RSS cho channel_id '{channel_id}': {e}")
        return []

def calculate_channel_median(views_list: list[int]) -> int:
    """Tính lượt xem trung vị (Median) của kênh để làm mốc so sánh đột biến."""
    if not views_list:
        return 1000
    sorted_views = sorted([v for v in views_list if v > 0] or views_list)
    n = len(sorted_views)
    if n == 0:
        return 1000
    mid = n // 2
    if n % 2 == 1:
        return sorted_views[mid]
    else:
        return int((sorted_views[mid - 1] + sorted_views[mid]) / 2)

def format_time_ago(hours: float) -> str:
    if hours < 1:
        minutes = max(1, int(hours * 60))
        return f"{minutes} phút trước"
    elif hours < 24:
        return f"{round(hours, 1)} giờ trước"
    else:
        days = int(hours / 24)
        rem_hours = int(hours % 24)
        return f"{days} ngày {rem_hours}h trước"

def run():
    print(f"🚀 [TRACKER] Bắt đầu phiên quét lúc: {datetime.now(timezone.utc).isoformat()}")
    
    # 1. Tải cấu hình và lịch sử
    channels_config = load_json(CHANNELS_FILE, [])
    if not channels_config:
        print("⚠️ [TRACKER] Không tìm thấy kênh nào trong channels.json!")
        return

    # Tải dữ liệu hiện có để bảo vệ không bị mất nếu RSS gặp lỗi
    existing_videos_data = load_json(VIDEOS_FILE, {})
    existing_channels_map = {}
    for c in existing_videos_data.get("channels", []):
        cid = c.get("channel_id") or c.get("handle_or_url")
        if cid:
            existing_channels_map[cid] = c
        if c.get("name"):
            existing_channels_map[c.get("name")] = c

    history = load_json(HISTORY_FILE, {"channel_cache": {}, "videos": {}})
    channel_cache = history.setdefault("channel_cache", {})
    video_history = history.setdefault("videos", {})
    avatars_cache = load_json(AVATARS_FILE, {})

    discord_webhook = os.environ.get("DISCORD_WEBHOOK_URL", "").strip()
    discord_webhook_2 = os.environ.get("DISCORD_WEBHOOK_URL_2", "").strip()
    discord_webhook_3 = os.environ.get("DISCORD_WEBHOOK_URL_3", "").strip() or os.environ.get("RADAR_DISCORD_WEBHOOK", "").strip()

    # Tự động nạp webhook dự phòng từ radar_settings.json nếu biến môi trường chưa được truyền
    radar_settings_file = os.path.join(DATA_DIR, "radar_settings.json")
    radar_settings = load_json(radar_settings_file, {})
    if not discord_webhook_2 and radar_settings.get("discord_webhook_2"):
        discord_webhook_2 = radar_settings.get("discord_webhook_2").strip()
    if not discord_webhook_3 and radar_settings.get("discord_webhook"):
        discord_webhook_3 = radar_settings.get("discord_webhook").strip()

    if not discord_webhook and not discord_webhook_2 and not discord_webhook_3:
        print("ℹ️ [DISCORD] Biến môi trường DISCORD_WEBHOOK_URL, DISCORD_WEBHOOK_URL_2 hoặc DISCORD_WEBHOOK_URL_3 chưa được truyền.")
    else:
        print(f"🔔 [DISCORD] Đã kết nối Webhook: Kênh 1 {'(Có)' if discord_webhook else '(Chưa)'} | Kênh 2 {'(Có)' if discord_webhook_2 else '(Chưa)'} | Kênh 3 {'(Có)' if discord_webhook_3 else '(Chưa)'}")

    gh_repo = os.environ.get("GITHUB_REPOSITORY", "").strip()
    dashboard_url = os.environ.get("DASHBOARD_URL", "")
    if not dashboard_url and "/" in gh_repo:
        owner, repo = gh_repo.split("/", 1)
        dashboard_url = f"https://{owner}.github.io/{repo}/"

    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    all_channels_data = []
    total_videos_count = 0
    viral_videos_count = 0

    # 2. Quét từng kênh
    for ch in channels_config:
        ch_name = ch.get("name", "Kênh đối thủ")
        handle_or_url = ch.get("handle_or_url", "")
        threshold = ch.get("min_views_per_hour", 5000)

        print(f"\n🔍 Đang kiểm tra kênh: {ch_name} ({handle_or_url}) - Ngưỡng: {threshold:,} view/h")

        channel_id = resolve_channel_id(handle_or_url, channel_cache)
        if not channel_id:
            print(f"⚠️ Bỏ qua {ch_name}: Không tìm thấy Channel ID.")
            continue

        ch_avatar = (
            ch.get("avatar")
            or existing_channels_map.get(channel_id, {}).get("avatar")
            or existing_channels_map.get(ch_name, {}).get("avatar")
            or avatars_cache.get(ch_name)
            or avatars_cache.get(handle_or_url)
        )
        if not ch_avatar:
            ch_avatar = resolve_channel_avatar(handle_or_url, avatars_cache)
            if ch_avatar:
                avatars_cache[ch_name] = ch_avatar
                avatars_cache[handle_or_url] = ch_avatar

        raw_videos = fetch_channel_videos(channel_id)
        print(f"   -> Lấy được {len(raw_videos)} video mới nhất.")

        # Cơ chế khiên bảo vệ: Nếu RSS bị lỗi/rate-limit trả về 0 video, giữ nguyên dữ liệu video hiện có
        if not raw_videos:
            cached_ch = existing_channels_map.get(channel_id) or existing_channels_map.get(handle_or_url) or existing_channels_map.get(ch_name)
            if cached_ch and cached_ch.get("videos"):
                print(f"   🛡️ Giữ lại {len(cached_ch['videos'])} video từ dữ liệu đã có để tránh mất số liệu.")
                c_videos = cached_ch["videos"]
                c_median = cached_ch.get("channel_median", 1000)
                total_videos_count += len(c_videos)
                for pv in c_videos:
                    if pv.get("is_viral"):
                        viral_videos_count += 1
                        pvid = pv.get("video_id")
                        prev_pinfo = video_history.get(pvid)
                        p_already_alerted = prev_pinfo.get("alerted", False) if prev_pinfo else False
                        if not p_already_alerted and (discord_webhook or discord_webhook_2):
                            p_outlier = pv.get("outlier_score", 0) >= 3.0 or "clever" in ch_name.lower()
                            p_sent_1 = False
                            p_sent_2 = False

                            # Phòng 1: Toàn bộ video bão view (bot Đi đâu con lợn này)
                            wh_1 = discord_webhook or discord_webhook_2
                            if wh_1:
                                p_sent_1 = send_discord_alert(wh_1, pv, ch_name, threshold, dashboard_url, "viral")

                            # Phòng 2: Chỉ nhận video Đột Biến x3 hoặc kênh Clever (bot chạy đâu con sâu)
                            if discord_webhook_2 and p_outlier and wh_1 != discord_webhook_2:
                                p_sent_2 = send_discord_alert(discord_webhook_2, pv, ch_name, threshold, dashboard_url, "outlier")

                            p_alert_sent = p_sent_1 or p_sent_2
                            video_history[pvid] = {
                                "last_views": pv.get("views", 0),
                                "last_checked": now_iso,
                                "alerted": bool(p_alert_sent),
                                "alerted_at": now_iso if p_alert_sent else None,
                                "alerted_vph": pv.get("effective_vph", 0) if p_alert_sent else 0,
                                "ai_analysis": pv.get("ai_analysis")
                            }
                all_channels_data.append({
                    "name": ch_name,
                    "handle_or_url": handle_or_url,
                    "channel_id": channel_id,
                    "threshold": threshold,
                    "channel_median": c_median,
                    "avatar": ch_avatar,
                    "videos": c_videos
                })
                continue

        # Tính toán Baseline Median của kênh để đo Outlier Multiplier
        channel_views = [v["views"] for v in raw_videos]
        channel_median = calculate_channel_median(channel_views)
        channel_avg_vph = max(100, int(sum(channel_views) / max(1, len(channel_views)) / 48))

        processed_videos = []
        for v in raw_videos:
            vid = v["video_id"]
            views = v["views"]
            pub_str = v["published_at"]

            # Tính số giờ kể từ thời điểm xuất bản
            try:
                pub_time = datetime.fromisoformat(pub_str.replace("Z", "+00:00"))
                hours_since_pub = max(0.1, (now - pub_time).total_seconds() / 3600.0)
            except Exception:
                hours_since_pub = 1.0

            # 1. Tốc độ trung bình (Lifetime VPH)
            lifetime_vph = int(views / hours_since_pub)

            # 2. Tốc độ tăng theo giờ (Hourly Delta VPH)
            prev_info = video_history.get(vid)
            if prev_info and "last_views" in prev_info and "last_checked" in prev_info:
                try:
                    prev_time = datetime.fromisoformat(prev_info["last_checked"])
                    delta_hours = max(0.1, (now - prev_time).total_seconds() / 3600.0)
                    delta_views = max(0, views - prev_info["last_views"])
                    hourly_delta_vph = int(delta_views / delta_hours)
                except Exception:
                    hourly_delta_vph = lifetime_vph
            else:
                hourly_delta_vph = lifetime_vph

            effective_vph = max(lifetime_vph, hourly_delta_vph)

            # 3. Thuật toán Outlier Multiplier (Hệ số đột biến chuẩn 1of10)
            outlier_score = round(views / max(100, channel_median), 1)

            # 4. Phân cấp bậc đột biến (Viral Tier)
            if outlier_score >= 10.0:
                viral_tier = "breakout" # 👑 Siêu bão đột biến
            elif outlier_score >= 3.0:
                viral_tier = "viral"    # 🔥 Đột biến mạnh
            elif outlier_score >= 1.5:
                viral_tier = "rising"   # ⚡ Đang lên
            elif outlier_score >= 0.8:
                viral_tier = "normal"   # ⚪ Bình thường
            else:
                viral_tier = "under"    # 💤 Dưới trung bình

            # 5. Điểm động lực xu hướng Momentum Score (0 - 100)
            score_outlier = min(40, int(round(outlier_score * 4)))
            v_ratio = effective_vph / max(100, channel_avg_vph)
            score_velocity = min(40, int(round(v_ratio * 10)))
            recency_factor = max(0.0, 1.0 - (hours_since_pub / 168.0))
            score_recency = int(round(20 * recency_factor))
            momentum_score = min(100, max(0, score_outlier + score_velocity + score_recency))

            # Tiêu chí báo nổ chuẩn: Đột biến >= 3x HOẶC VPH >= Threshold (trong vòng 7 ngày)
            # Hỗ trợ cả Late Bloomers (video > 7 ngày nhưng bất ngờ được thuật toán đẩy ăn đề xuất mạnh)
            is_recent = (hours_since_pub <= 168)
            is_late_bloomer = (not is_recent) and (hourly_delta_vph >= threshold * 1.5 and views >= threshold * 2)
            is_viral = (is_recent or is_late_bloomer) and (outlier_score >= 3.0 or effective_vph >= threshold)

            v_entry = {
                "video_id": vid,
                "title": v["title"],
                "url": v["url"],
                "thumbnail": v["thumbnail"],
                "published_at": pub_str,
                "views": views,
                "content_type": v.get("content_type", "LONG_FORM"),
                "hours_since_pub": round(hours_since_pub, 2),
                "hours_ago_formatted": format_time_ago(hours_since_pub),
                "lifetime_vph": lifetime_vph,
                "hourly_delta_vph": hourly_delta_vph,
                "effective_vph": effective_vph,
                "channel_median": channel_median,
                "outlier_score": outlier_score,
                "momentum_score": momentum_score,
                "viral_tier": viral_tier,
                "is_viral": is_viral
            }

            processed_videos.append(v_entry)
            total_videos_count += 1
            if is_viral:
                viral_videos_count += 1

            # Giữ lại phân tích AI nếu đã có từ lần quét trước
            existing_ai = prev_info.get("ai_analysis") if prev_info else None
            if existing_ai:
                v_entry["ai_analysis"] = existing_ai

            # Tự động phân tích AI kịch bản Remake cho mọi video nổ (Viral) chưa có phân tích
            if is_viral and not v_entry.get("ai_analysis"):
                print(f"🔥 VIDEO BÁO NỔ CHƯA CÓ KỊCH BẢN: [{v['title'][:40]}] - Tốc độ: +{effective_vph:,} view/h -> Đang gọi AI...")
                ai_result = analyze_viral_video(vid, v["title"], ch_name, views, effective_vph)
                if ai_result:
                    v_entry["ai_analysis"] = ai_result

            # Kiểm tra cảnh báo Discord & Cơ chế Milestone Escalation Alert
            already_alerted = prev_info.get("alerted", False) if prev_info else False
            prev_alerted_vph = prev_info.get("alerted_vph", 0) if prev_info else 0
            prev_alerted_tier = prev_info.get("alerted_tier", "normal") if prev_info else "normal"

            # Đột phá nâng cấp: Đã báo rồi nhưng tốc độ tăng gấp đôi (+100%) so với lần trước và >= 3000 view/h
            # HOẶC video bứt phá lên bậc Breakout (>=10x) mà lần trước chưa đạt
            is_escalation = already_alerted and (
                (effective_vph >= max(3000, int(prev_alerted_vph * 2.0))) or
                (viral_tier == "breakout" and prev_alerted_tier != "breakout" and effective_vph >= threshold)
            )

            should_alert = is_viral and (not already_alerted or is_escalation)
            
            if should_alert:
                is_outlier = (outlier_score >= 3.0 or "clever" in ch_name.lower())
                sent_1 = False
                sent_2 = False

                alert_kind = "escalation" if is_escalation else ("outlier" if is_outlier else "viral")
                v_entry["prev_alerted_vph"] = prev_alerted_vph if is_escalation else 0

                # 🐷 PHÒNG 1: Bão View (Đi đâu con lợn này)
                wh_1 = discord_webhook or discord_webhook_2
                if wh_1:
                    sent_1 = send_discord_alert(wh_1, v_entry, ch_name, threshold, dashboard_url, alert_kind)

                # 🐛 PHÒNG 2: Siêu Đột Biến x3 hoặc kênh Clever (chạy đâu con sâu)
                if discord_webhook_2 and is_outlier and wh_1 != discord_webhook_2:
                    sent_2 = send_discord_alert(discord_webhook_2, v_entry, ch_name, threshold, dashboard_url, "outlier" if not is_escalation else "escalation")

                alert_sent = sent_1 or sent_2
                
                # Cập nhật lịch sử cảnh báo
                video_history[vid] = {
                    "last_views": views,
                    "last_checked": now_iso,
                    "alerted": bool(alert_sent) or already_alerted,
                    "alerted_at": now_iso if alert_sent else prev_info.get("alerted_at"),
                    "alerted_vph": effective_vph if alert_sent else prev_alerted_vph,
                    "alerted_tier": viral_tier if alert_sent else prev_alerted_tier,
                    "ai_analysis": v_entry.get("ai_analysis")
                }
            else:
                # Cập nhật chỉ số kiểm tra lần này
                if vid not in video_history:
                    video_history[vid] = {
                        "last_views": views,
                        "last_checked": now_iso,
                        "alerted": False,
                        "ai_analysis": v_entry.get("ai_analysis")
                    }
                else:
                    video_history[vid]["last_views"] = views
                    video_history[vid]["last_checked"] = now_iso
                    if v_entry.get("ai_analysis"):
                        video_history[vid]["ai_analysis"] = v_entry.get("ai_analysis")

        # Sắp xếp video theo thời gian xuất bản mới nhất
        all_channels_data.append({
            "name": ch_name,
            "handle_or_url": handle_or_url,
            "channel_id": channel_id,
            "threshold": threshold,
            "channel_median": channel_median,
            "avatar": ch_avatar,
            "videos": processed_videos
        })

    # 3. Ghi kết quả ra file data
    now_vn = now.astimezone(timezone(timedelta(hours=7))) if hasattr(now, 'astimezone') else now
    output_payload = {
        "last_updated": now_iso,
        "last_updated_formatted": now_vn.strftime("%H:%M:%S - %d/%m/%Y (Giờ VN)"),
        "scan_schedule": {
            "section_1_frequency": "1h",
            "section_2_frequency": "daily_midnight",
            "status": "active_247"
        },
        "total_channels": len(all_channels_data),
        "total_videos": total_videos_count,
        "viral_count": viral_videos_count,
        "channels": all_channels_data
    }

    # 🛡️ KHIÊN BẢO VỆ DỮ LIỆU: Tuyệt đối không ghi đè nếu tổng video bằng 0 (lỗi mạng/chặn IP YouTube)
    prev_total = existing_videos_data.get("total_videos", 0)
    if total_videos_count == 0 and prev_total > 0:
        print(f"\n🚨 [CẢNH BÁO BẢO VỆ DỮ LIỆU] Quét được 0 video trong khi hệ thống đang có {prev_total} video!")
        print("🚨 HỦY BỎ việc lưu file data/videos.json để bảo vệ dữ liệu hiện có, ngăn chặn xóa trắng giao diện!")
        return

    # 🧹 Tự động thanh lọc lịch sử (Database Pruning): giữ video viral, có AI hoặc trong 60 ngày gần nhất
    cutoff_dt = now - timedelta(days=60)
    cleaned_v_history = {}
    for vid_k, v_meta in video_history.items():
        if v_meta.get("ai_analysis") or v_meta.get("alerted"):
            cleaned_v_history[vid_k] = v_meta
            continue
        l_chk = v_meta.get("last_checked")
        if l_chk:
            try:
                l_dt = datetime.fromisoformat(l_chk.replace("Z", "+00:00"))
                if l_dt >= cutoff_dt:
                    cleaned_v_history[vid_k] = v_meta
                    continue
            except Exception:
                pass
        if len(cleaned_v_history) < 1500:
            cleaned_v_history[vid_k] = v_meta
    history["videos"] = cleaned_v_history

    save_json(VIDEOS_FILE, output_payload)
    save_json(HISTORY_FILE, history)
    save_json(AVATARS_FILE, avatars_cache)

    print(f"\n✨ [HOÀN TẤT] Đã quét {len(all_channels_data)} kênh, tổng {total_videos_count} video ({viral_videos_count} video viral).")
    print(f"📁 Dữ liệu lưu tại: {VIDEOS_FILE}")

    # 4. Tự động kích hoạt quy trình YouTube Emerging Radar (Kênh Nhỏ View Khủng & Breakout)
    try:
        from emerging_radar import run_emerging_radar_pipeline
        print("\n" + "="*70)
        print("🛰️ [PIPELINE] Bắt đầu phiên quét radar kênh mới nổi (Emerging Radar)...")
        print("="*70)
        run_emerging_radar_pipeline()
    except Exception as e:
        print(f"⚠️ [EMERGING RADAR ERROR] Lỗi khi chạy radar kênh mới nổi: {e}")

if __name__ == "__main__":
    run()

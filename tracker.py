import os
import sys
import re
import json
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

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

            link = f"https://www.youtube.com/watch?v={video_id}"

            videos.append({
                "video_id": video_id,
                "title": title,
                "url": link,
                "thumbnail": thumbnail,
                "published_at": pub_str,
                "views": views
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

    history = load_json(HISTORY_FILE, {"channel_cache": {}, "videos": {}})
    channel_cache = history.setdefault("channel_cache", {})
    video_history = history.setdefault("videos", {})

    discord_webhook = os.environ.get("DISCORD_WEBHOOK_URL", "").strip()
    if not discord_webhook:
        print("ℹ️ [DISCORD] Biến môi trường DISCORD_WEBHOOK_URL chưa được truyền (chế độ Test / Quét dữ liệu).")

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

        raw_videos = fetch_channel_videos(channel_id)
        print(f"   -> Lấy được {len(raw_videos)} video mới nhất.")

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
            is_recent = (hours_since_pub <= 168)
            is_viral = is_recent and (outlier_score >= 3.0 or effective_vph >= threshold)

            v_entry = {
                "video_id": vid,
                "title": v["title"],
                "url": v["url"],
                "thumbnail": v["thumbnail"],
                "published_at": pub_str,
                "views": views,
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

            # Kiểm tra và gửi cảnh báo Discord nếu chưa gửi
            already_alerted = prev_info.get("alerted", False) if prev_info else False
            
            if is_viral and is_recent and not already_alerted:
                alert_sent = send_discord_alert(discord_webhook, v_entry, ch_name, threshold, dashboard_url)
                
                # Cập nhật lịch sử cảnh báo
                video_history[vid] = {
                    "last_views": views,
                    "last_checked": now_iso,
                    "alerted": True if alert_sent or discord_webhook else False,
                    "alerted_at": now_iso,
                    "alerted_vph": effective_vph,
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
            "videos": processed_videos
        })

    # 3. Ghi kết quả ra file data
    output_payload = {
        "last_updated": now_iso,
        "last_updated_formatted": now.strftime("%H:%M:%S - %d/%m/%Y (UTC)"),
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

    save_json(VIDEOS_FILE, output_payload)
    save_json(HISTORY_FILE, history)

    print(f"\n✨ [HOÀN TẤT] Đã quét {len(all_channels_data)} kênh, tổng {total_videos_count} video ({viral_videos_count} video viral).")
    print(f"📁 Dữ liệu lưu tại: {VIDEOS_FILE}")

if __name__ == "__main__":
    run()

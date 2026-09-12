# ==============================================================================
# BẮT BÀI ĐỐI THỦ — YOUTUBE EMERGING CHANNEL RADAR & BREAKOUT ENGINE
# Architecture: Discovery Pipeline -> Quantitative Metrics -> Radar Score -> Snapshots
# ==============================================================================

import os
import sys
import re
import json
import time
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
import statistics

from discord_notifier import send_channel_discovery_alert

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
QUERIES_FILE = os.path.join(DATA_DIR, "discovery_queries.json")
SETTINGS_FILE = os.path.join(DATA_DIR, "radar_settings.json")
RUNS_FILE = os.path.join(DATA_DIR, "discovery_runs.json")
SNAPSHOTS_FILE = os.path.join(DATA_DIR, "channel_snapshots.json")
EMERGING_CHANNELS_FILE = os.path.join(DATA_DIR, "emerging_channels.json")
AI_CACHE_FILE = os.path.join(DATA_DIR, "channel_ai_cache.json")
VIDEOS_FILE = os.path.join(DATA_DIR, "videos.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9,vi;q=0.8"
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

# ==============================================================================
# PHẦN A: THUẬT TOÁN ĐỊNH LƯỢNG (QUANTITATIVE METRICS & RADAR SCORE)
# ==============================================================================

def calculate_median(values: list[int | float]) -> float:
    """Tính trung vị (Median) chuẩn xác, xử lý an toàn mảng rỗng."""
    if not values:
        return 0.0
    valid = sorted([float(v) for v in values if v is not None])
    if not valid:
        return 0.0
    n = len(valid)
    mid = n // 2
    if n % 2 == 1:
        return float(valid[mid])
    else:
        return float((valid[mid - 1] + valid[mid]) / 2.0)

def parse_iso_datetime(dt_str: str) -> datetime:
    """Parse string ngày giờ ISO sang đối tượng datetime timezone-aware (UTC)."""
    if not dt_str:
        return datetime.now(timezone.utc)
    try:
        clean = dt_str.replace("Z", "+00:00")
        return datetime.fromisoformat(clean)
    except Exception:
        return datetime.now(timezone.utc)

def calculate_upload_consistency(intervals_days: list[float]) -> float:
    """
    Tính điểm Upload Consistency (0 - 100) dựa trên độ biến động (CV - Coefficient of Variation)
    khoảng cách giữa các lần đăng video. Đăng đều đặn = điểm cao (80-100).
    Đăng 20 video 1 ngày rồi bỏ bẵng = biến động cao = điểm thấp.
    """
    if not intervals_days or len(intervals_days) < 2:
        return 65.0 # Mức trung tính khi mới có 1-2 video
    
    mean_val = statistics.mean(intervals_days)
    if mean_val <= 0.01:
        return 20.0 # Quá nhiều video trong cùng 1 giờ
    
    std_dev = statistics.stdev(intervals_days)
    cv = std_dev / mean_val # Hệ số biến thiên
    # CV = 0 (cách đều tăm tắp) -> 100 điểm. CV >= 1.5 -> 10 điểm.
    consistency = max(10.0, min(100.0, (1.0 - min(1.0, cv / 1.5)) * 90.0 + 10.0))
    return round(consistency, 1)

def compute_radar_score(metrics: dict, active_age_days: int, upload_consistency: float) -> tuple[float, dict]:
    """
    Tính RADAR SCORE (0 - 100) chuẩn theo Phần 14:
    A. Repeatability (30đ): Viral Repeat count (15đ) + Hit Rate (15đ)
    B. Velocity (20đ): Median View Velocity / 10,000 (20đ)
    C. View/Sub (15đ): Median Views per Sub / 20 (15đ)
    D. Views 90D (15đ): Views 90D / 500,000 (15đ)
    E. Freshness (10đ): <=30d: 10, <=60d: 8, <=90d: 6, <=120d: 3, >120d: 0
    F. Upload Consistency (10đ): Upload Consistency / 100 * 10
    """
    # A. Repeatability (30)
    viral_repeat_count = metrics.get("viral_repeat_count", 0)
    hit_rate = metrics.get("hit_rate", 0.0)
    viral_repeat_score = min(viral_repeat_count / 5.0, 1.0) * 15.0
    hit_rate_score = min(hit_rate / 0.70, 1.0) * 15.0
    repeatability_score = round(viral_repeat_score + hit_rate_score, 1)

    # B. Velocity (20)
    median_velocity = metrics.get("median_view_velocity", 0.0)
    velocity_score = round(min(median_velocity / 10000.0, 1.0) * 20.0, 1)

    # C. View/Sub (15)
    median_vps = metrics.get("median_views_per_sub", 0.0)
    view_sub_score = round(min(median_vps / 20.0, 1.0) * 15.0, 1)

    # D. Views 90D (15)
    views_90d = metrics.get("views_90d", 0)
    views_90d_score = round(min(views_90d / 500000.0, 1.0) * 15.0, 1)

    # E. Freshness (10)
    if active_age_days <= 30:
        freshness_score = 10.0
    elif active_age_days <= 60:
        freshness_score = 8.0
    elif active_age_days <= 90:
        freshness_score = 6.0
    elif active_age_days <= 120:
        freshness_score = 3.0
    else:
        freshness_score = 0.0

    # F. Upload Consistency (10)
    consistency_score = round((upload_consistency / 100.0) * 10.0, 1)

    total_radar = round(repeatability_score + velocity_score + view_sub_score + views_90d_score + freshness_score + consistency_score, 1)
    clamped_radar = max(0.0, min(100.0, total_radar))

    breakdown = {
        "repeatability_score": repeatability_score,
        "velocity_score": velocity_score,
        "view_sub_score": view_sub_score,
        "views_90d_score": views_90d_score,
        "freshness_score": freshness_score,
        "consistency_score": consistency_score
    }
    return clamped_radar, breakdown

def classify_presets_and_breakout(
    subscriber_count: int,
    active_age_days: int,
    views_90d: int,
    median_views_90d: float,
    max_views_90d: int,
    viral_repeat_count: int,
    median_views_per_sub: float,
    radar_score: float,
    radar_score_change_7d: float,
    first_discovered_at: str | None = None
) -> tuple[list[str], bool]:
    """
    Phân loại các Presets chuẩn theo Phần 13 & Breakout Detection theo Phần 15:
    1. EXPLODING: subs < 10K, active_age <= 90, views_90d >= 200K, median >= 10K, viral_repeat >= 3, median_views_per_sub >= 5
    2. EMERGING: subs < 10K, active_age <= 90, views_90d >= 50K, median >= 5K, viral_repeat >= 2
    3. HIDDEN_GEM: subs < 3K, active_age <= 120, views_90d >= 100K, viral_repeat >= 2
    4. ONE_HIT_WONDER: viral_repeat <= 1, max_views_90d >= 100K, median_views_90d < 5000
    5. NEW_DISCOVERED: first_discovered_at <= 7 days
    6. BREAKOUT: radar_score >= 75 OR radar_score_change_7d >= 15
    """
    presets = []

    # 1. EXPLODING
    if (subscriber_count < 10000 and active_age_days <= 90 and views_90d >= 200000 and
        median_views_90d >= 10000 and viral_repeat_count >= 3 and median_views_per_sub >= 5.0):
        presets.append("EXPLODING")

    # 2. EMERGING
    if (subscriber_count < 10000 and active_age_days <= 90 and views_90d >= 50000 and
        median_views_90d >= 5000 and viral_repeat_count >= 2):
        presets.append("EMERGING")

    # 3. HIDDEN_GEM
    if (subscriber_count < 3000 and active_age_days <= 120 and views_90d >= 100000 and viral_repeat_count >= 2):
        presets.append("HIDDEN_GEM")

    # 4. ONE_HIT_WONDER
    if (viral_repeat_count <= 1 and max_views_90d >= 100000 and median_views_90d < 5000):
        presets.append("ONE_HIT_WONDER")

    # 5. NEW_DISCOVERED
    if first_discovered_at:
        try:
            disc_dt = parse_iso_datetime(first_discovered_at)
            now_dt = datetime.now(timezone.utc)
            if (now_dt - disc_dt).total_seconds() <= 7 * 86400:
                presets.append("NEW")
        except Exception:
            pass

    # 6. BREAKOUT DETECTION (Phần 15)
    is_breakout = (radar_score >= 75.0 or radar_score_change_7d >= 15.0)
    if is_breakout:
        presets.append("BREAKOUT")

    return presets, is_breakout

# ==============================================================================
# PHẦN B: YOUTUBE DATA FETCHING & DISCOVERY ENGINE
# ==============================================================================

def search_youtube_videos_by_query(query: str, max_results: int = 20) -> list[dict]:
    """
    Tìm kiếm video trên YouTube theo từ khóa sử dụng giao thức web scraping.
    Không tốn Quota YouTube Data API. Trích xuất videoId, channelId, title.
    """
    encoded = urllib.parse.quote_plus(query)
    # sp=CAISAhAB -> Lọc kết quả tải lên gần đây dạng Video
    url = f"https://www.youtube.com/results?search_query={encoded}&sp=CAISAhAB"
    req = urllib.request.Request(url, headers=HEADERS)

    results = []
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode("utf-8", errors="ignore")

        # Trích xuất JSON ytInitialData
        m = re.search(r"var ytInitialData\s*=\s*({.*?});</script>", html)
        if not m:
            m = re.search(r'window\["ytInitialData"\]\s*=\s*({.*?});', html)

        if m:
            data = json.loads(m.group(1))
            # Điều hướng tìm videoRenderer trong contents
            contents = []
            try:
                contents = data["contents"]["twoColumnSearchResultsRenderer"]["primaryContents"]["sectionListRenderer"]["contents"]
            except Exception:
                pass

            for sec in contents:
                items = sec.get("itemSectionRenderer", {}).get("contents", [])
                for it in items:
                    v_rend = it.get("videoRenderer")
                    if not v_rend:
                        continue
                    vid = v_rend.get("videoId")
                    title = ""
                    for r in v_rend.get("title", {}).get("runs", []):
                        title += r.get("text", "")
                    
                    cid = ""
                    owner_runs = v_rend.get("ownerText", {}).get("runs", [])
                    c_title = owner_runs[0].get("text", "") if owner_runs else ""
                    if owner_runs:
                        nav = owner_runs[0].get("navigationEndpoint", {}).get("browseEndpoint", {})
                        cid = nav.get("browseId", "")

                    if vid and cid:
                        results.append({
                            "video_id": vid,
                            "title": title,
                            "channel_id": cid,
                            "channel_title": c_title
                        })
                    if len(results) >= max_results:
                        break
                if len(results) >= max_results:
                    break

    except Exception as e:
        print(f"⚠️ Lỗi tìm kiếm từ khóa '{query}': {e}")

    return results

def fetch_channel_about(channel_id: str) -> dict:
    """
    Lấy thông tin profile kênh YouTube: subscriberCount, videoCount, joinDate, avatar.
    """
    url = f"https://www.youtube.com/channel/{channel_id}"
    req = urllib.request.Request(url, headers=HEADERS)
    profile = {
        "channel_id": channel_id,
        "title": "",
        "handle": "",
        "description": "",
        "subscribers": 1000,
        "subscribers_formatted": "1K",
        "video_count": 10,
        "joined_date": None,
        "thumbnail": ""
    }

    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode("utf-8", errors="ignore")

        # Handle title
        t_match = re.search(r'<meta property="og:title" content="(.*?)"', html)
        if t_match:
            profile["title"] = t_match.group(1)

        # Handle image
        img_match = re.search(r'<meta property="og:image" content="(.*?)"', html)
        if img_match:
            profile["thumbnail"] = img_match.group(1)

        # Handle description
        d_match = re.search(r'<meta property="og:description" content="(.*?)"', html)
        if d_match:
            profile["description"] = d_match.group(1)

        # Parse subscribers: e.g. "1.45K subscribers" or "890 subscribers"
        sub_match = re.search(r'([0-9.,]+)\s*([KkMm]?)\s*subscribers', html)
        if sub_match:
            num_part = float(sub_match.group(1).replace(",", ""))
            unit = sub_match.group(2).upper()
            multiplier = 1000 if unit == "K" else (1000000 if unit == "M" else 1)
            subs = int(num_part * multiplier)
            profile["subscribers"] = subs
            profile["subscribers_formatted"] = f"{sub_match.group(1)}{unit}"

        # Parse handle: e.g. "@SmartScrapLab"
        h_match = re.search(r'"canonicalBaseUrl":"/(@[a-zA-Z0-9_.-]+)"', html)
        if h_match:
            profile["handle"] = h_match.group(1)
        elif profile["title"]:
            profile["handle"] = "@" + re.sub(r'[^a-zA-Z0-9]', '', profile["title"]).lower()

    except Exception as e:
        print(f"⚠️ Lỗi fetch profile kênh {channel_id}: {e}")

    return profile

def fetch_channel_videos_rss(channel_id: str) -> list[dict]:
    """
    Lấy danh sách video từ RSS Feed YouTube chính thức (Tối đa 15 video mới nhất).
    Hoàn toàn miễn phí, không tốn quota API.
    """
    rss_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    req = urllib.request.Request(rss_url, headers=HEADERS)

    videos = []
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            xml_data = resp.read().decode("utf-8", errors="ignore")

        root = ET.fromstring(xml_data)
        ns = {
            "atom": "http://www.w3.org/2005/Atom",
            "media": "http://search.yahoo.com/mrss/",
            "yt": "http://www.youtube.com/xml/schemas/2015"
        }

        for entry in root.findall("atom:entry", ns):
            yt_id_el = entry.find("yt:videoId", ns)
            vid = yt_id_el.text if yt_id_el is not None else ""
            if not vid:
                atom_id = entry.find("atom:id", ns)
                if atom_id is not None and atom_id.text:
                    vid = atom_id.text.replace("yt:video:", "")

            title_el = entry.find("atom:title", ns)
            title = title_el.text if title_el is not None else "Untitled"

            pub_el = entry.find("atom:published", ns)
            pub_str = pub_el.text if pub_el is not None else ""

            views = 0
            thumbnail = f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
            desc = ""

            media_group = entry.find("media:group", ns)
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

            # Heuristic xác định Short vs Long-form
            is_short = ("#shorts" in title.lower() or "#short" in title.lower() or "#shorts" in desc.lower())
            content_type = "SHORT" if is_short else "LONG_FORM"

            videos.append({
                "video_id": vid,
                "title": title,
                "url": f"https://www.youtube.com/watch?v={vid}",
                "thumbnail": thumbnail,
                "published_at": pub_str,
                "views": views,
                "description": desc[:500],
                "content_type": content_type
            })

    except Exception as e:
        print(f"⚠️ Lỗi fetch RSS cho {channel_id}: {e}")

    return videos

# ==============================================================================
# PHẦN C: PIPELINE TÍNH TOÁN METRICS CHO KÊNH (90D / 60D / 30D)
# ==============================================================================

def analyze_channel_metrics(channel_profile: dict, raw_videos: list[dict], now_dt: datetime) -> dict:
    """
    Tính toàn bộ 30D/60D/90D metrics cho kênh theo Phần 4, 5, 6, 7, 8, 9, 10, 11:
    - subscriber_count
    - channel_age_days / active_age_days
    - views_30d, views_60d, views_90d
    - median_views_90d, average_views_90d, max_views_90d
    - median_views_per_sub, viral_repeat_count, hit_rate
    - median_view_velocity, upload_consistency
    - radar_score (0 - 100), breakdown
    """
    subs = max(1, channel_profile.get("subscribers", 1000))
    if not raw_videos:
        return {
            "subscriber_count": subs,
            "active_age_days": 30,
            "videos_90d": 0,
            "views_90d": 0,
            "median_views_90d": 0,
            "average_views_90d": 0,
            "max_views_90d": 0,
            "median_views_per_sub": 0,
            "viral_repeat_count": 0,
            "hit_rate": 0,
            "median_view_velocity": 0,
            "upload_consistency": 50,
            "radar_score": 10,
            "breakdown": {},
            "videos": []
        }

    # Sắp xếp video theo thời gian xuất bản giảm dần (mới nhất đầu tiên)
    parsed_videos = []
    pub_dates = []
    for v in raw_videos:
        pdt = parse_iso_datetime(v["published_at"])
        age_hours = max(0.1, (now_dt - pdt).total_seconds() / 3600.0)
        age_days = max(1, int(age_hours / 24.0))
        views = max(0, v.get("views", 0))
        velocity = round(views / age_days, 1) # view / ngày
        vps = round(views / float(subs), 2)

        # Điều kiện viral theo Phần 8: views >= MAX(subs * 5, 20000)
        viral_threshold = max(subs * 5, 20000)
        is_viral = (views >= viral_threshold)

        # Điều kiện thành công theo Phần 9: views >= subs * 3
        is_hit = (views >= subs * 3)

        parsed_videos.append({
            "video_id": v["video_id"],
            "title": v["title"],
            "url": v["url"],
            "thumbnail": v["thumbnail"],
            "published_at": v["published_at"],
            "published_dt": pdt,
            "views": views,
            "age_days": age_days,
            "view_velocity": velocity,
            "views_per_sub": vps,
            "is_viral": is_viral,
            "is_hit": is_hit,
            "content_type": v.get("content_type", "LONG_FORM")
        })
        pub_dates.append(pdt)

    parsed_videos.sort(key=lambda x: x["published_dt"], reverse=True)
    pub_dates.sort()

    # Tính active_age_days = currentDate - firstRelevantUploadDate
    earliest_upload = pub_dates[0]
    active_age_days = max(1, (now_dt - earliest_upload).days)
    last_upload_dt = pub_dates[-1]
    last_upload_age_days = max(0, (now_dt - last_upload_dt).days)

    # Tính upload interval consistency
    intervals = []
    for i in range(1, len(pub_dates)):
        delta_d = max(0.1, (pub_dates[i] - pub_dates[i-1]).total_seconds() / 86400.0)
        intervals.append(delta_d)
    upload_consistency = calculate_upload_consistency(intervals)

    # Lọc video theo 90 ngày, 60 ngày, 30 ngày
    v90 = [v for v in parsed_videos if (now_dt - v["published_dt"]).days <= 90]
    if not v90:
        v90 = parsed_videos # Fallback nếu toàn bộ video đều liên quan

    v60 = [v for v in parsed_videos if (now_dt - v["published_dt"]).days <= 60]
    v30 = [v for v in parsed_videos if (now_dt - v["published_dt"]).days <= 30]

    views_90d = sum(v["views"] for v in v90)
    views_60d = sum(v["views"] for v in v60)
    views_30d = sum(v["views"] for v in v30)

    views_list_90d = [v["views"] for v in v90]
    median_views_90d = calculate_median(views_list_90d)
    average_views_90d = int(views_90d / max(1, len(v90)))
    max_views_90d = max(views_list_90d) if views_list_90d else 0
    min_views_90d = min(views_list_90d) if views_list_90d else 0

    vps_list_90d = [v["views_per_sub"] for v in v90]
    median_vps = round(calculate_median(vps_list_90d), 1)
    max_vps = max(vps_list_90d) if vps_list_90d else 0

    velocities_90d = [v["view_velocity"] for v in v90]
    median_velocity = round(calculate_median(velocities_90d), 1)
    max_velocity = max(velocities_90d) if velocities_90d else 0

    viral_repeat_count = sum(1 for v in v90 if v["is_viral"])
    successful_video_count = sum(1 for v in v90 if v["is_hit"])
    hit_rate = round(successful_video_count / max(1, len(v90)), 2)

    # Xác định Content Type chính của kênh
    long_count = sum(1 for v in parsed_videos if v["content_type"] == "LONG_FORM")
    short_count = sum(1 for v in parsed_videos if v["content_type"] == "SHORT")
    if long_count > 0 and short_count == 0:
        channel_content_type = "LONG_FORM"
    elif short_count > 0 and long_count == 0:
        channel_content_type = "SHORT"
    else:
        channel_content_type = "MIXED"

    metrics_for_score = {
        "viral_repeat_count": viral_repeat_count,
        "hit_rate": hit_rate,
        "median_view_velocity": median_velocity,
        "median_views_per_sub": median_vps,
        "views_90d": views_90d,
        "upload_consistency": upload_consistency
    }

    radar_score, breakdown = compute_radar_score(metrics_for_score, active_age_days, upload_consistency)

    # Clean published_dt trước khi lưu JSON
    clean_videos = []
    for pv in parsed_videos:
        v_copy = dict(pv)
        v_copy.pop("published_dt", None)
        clean_videos.append(v_copy)

    # Tìm breakout star video
    star_video = None
    if clean_videos:
        # Ưu tiên video có view cao nhất và views_per_sub cao nhất
        star_video = max(clean_videos, key=lambda x: (x["views"], x["views_per_sub"]))

    return {
        "subscriber_count": subs,
        "active_age_days": active_age_days,
        "last_upload_age_days": last_upload_age_days,
        "content_type": channel_content_type,
        "videos_30d": len(v30),
        "videos_60d": len(v60),
        "videos_90d": len(v90),
        "views_30d": views_30d,
        "views_60d": views_60d,
        "views_90d": views_90d,
        "median_views_90d": int(median_views_90d),
        "average_views_90d": average_views_90d,
        "max_views_90d": max_views_90d,
        "min_views_90d": min_views_90d,
        "median_views_per_sub": median_vps,
        "max_views_per_sub": max_vps,
        "viral_repeat_count": viral_repeat_count,
        "hit_rate": hit_rate,
        "median_view_velocity": median_velocity,
        "max_view_velocity": max_velocity,
        "upload_consistency": upload_consistency,
        "radar_score": radar_score,
        "breakdown": breakdown,
        "star_video": star_video,
        "videos": clean_videos
    }

# ==============================================================================
# PHẦN D: DAILY SNAPSHOT & HISTORY TRACKING ENGINE
# ==============================================================================

def update_daily_snapshots(snapshots: dict, channel_id: str, date_str: str, stats: dict) -> tuple[float, float]:
    """
    Lưu snapshot theo ngày với khóa duy nhất `channel_id + date`.
    Tính toán radar_score_change_1d và radar_score_change_7d.
    """
    c_snaps = snapshots.setdefault(channel_id, {})
    c_snaps[date_str] = {
        "date": date_str,
        "subscriber_count": stats.get("subscriber_count", 0),
        "views_90d": stats.get("views_90d", 0),
        "median_views_90d": stats.get("median_views_90d", 0),
        "viral_repeat_count": stats.get("viral_repeat_count", 0),
        "hit_rate": stats.get("hit_rate", 0.0),
        "radar_score": stats.get("radar_score", 0.0),
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    # Tính toán biến động 1D và 7D
    sorted_dates = sorted(c_snaps.keys())
    cur_score = stats.get("radar_score", 0.0)
    change_1d = 0.0
    change_7d = 0.0

    cur_dt = datetime.strptime(date_str, "%Y-%m-%d").date()
    yesterday_str = (cur_dt - timedelta(days=1)).strftime("%Y-%m-%d")
    week_ago_str = (cur_dt - timedelta(days=7)).strftime("%Y-%m-%d")

    if yesterday_str in c_snaps:
        change_1d = round(cur_score - c_snaps[yesterday_str]["radar_score"], 1)
    elif len(sorted_dates) >= 2:
        prev_d = sorted_dates[-2]
        change_1d = round(cur_score - c_snaps[prev_d]["radar_score"], 1)

    if week_ago_str in c_snaps:
        change_7d = round(cur_score - c_snaps[week_ago_str]["radar_score"], 1)
    elif len(sorted_dates) >= 7:
        week_d = sorted_dates[-7]
        change_7d = round(cur_score - c_snaps[week_d]["radar_score"], 1)
    elif len(sorted_dates) >= 2:
        # Nếu chưa đủ 7 ngày, lấy delta từ bản ghi sớm nhất
        change_7d = round(cur_score - c_snaps[sorted_dates[0]]["radar_score"], 1)

    return change_1d, change_7d

# ==============================================================================
# PHẦN E: DISCOVERY RUN PIPELINE (JOB A & JOB B)
# ==============================================================================

def run_emerging_radar_pipeline(manual_query: str | None = None, limit_queries: int = 5):
    """
    Quy trình quét hoàn chỉnh:
    1. Load enabled discovery queries
    2. Search recent videos -> extract unique channel_id
    3. Filter subscriber_count < 10K, active_age <= 120d
    4. Fetch recent uploads -> compute 30D/60D/90D metrics & Radar Score
    5. Save snapshots & detect breakout
    6. Queue AI analysis if eligible
    7. Save to data/emerging_channels.json & data/channel_snapshots.json
    """
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    print(f"🛰️ [EMERGING RADAR] Bắt đầu phiên quét lúc: {now.isoformat()} (Ngày: {today_str})")

    queries_data = load_json(QUERIES_FILE, [])
    settings = load_json(SETTINGS_FILE, {})
    snapshots = load_json(SNAPSHOTS_FILE, {})
    runs = load_json(RUNS_FILE, [])
    existing_channels_data = load_json(EMERGING_CHANNELS_FILE, {"last_updated": "", "channels": []})

    existing_channels_map = {c["channel_id"]: c for c in existing_channels_data.get("channels", [])}

    # Lọc danh sách query cần chạy
    enabled_queries = [q for q in queries_data if q.get("enabled", True)]
    if manual_query:
        selected_queries = [{"id": "manual", "query": manual_query, "category": "custom"}]
    else:
        # Sắp xếp theo priority giảm dần, ưu tiên query chưa quét gần đây
        selected_queries = sorted(enabled_queries, key=lambda x: (x.get("priority", 5)), reverse=True)[:limit_queries]

    run_log = {
        "id": f"run_{int(time.time())}",
        "started_at": now.isoformat(),
        "finished_at": None,
        "status": "running",
        "queries_scanned": len(selected_queries),
        "videos_found": 0,
        "channels_found": 0,
        "new_channels": 0,
        "qualified_channels": 0,
        "ai_queued": 0,
        "errors": []
    }

    discovered_channel_ids = set()
    query_results_map = {}

    print(f"🔍 Đang quét {len(selected_queries)} từ khóa discovery...")
    for q_item in selected_queries:
        q_str = q_item["query"]
        print(f"   -> Tìm kiếm: '{q_str}'...")
        v_list = search_youtube_videos_by_query(q_str, max_results=15)
        run_log["videos_found"] += len(v_list)
        for v in v_list:
            cid = v.get("channel_id")
            if cid and cid.startswith("UC"):
                discovered_channel_ids.add(cid)
                if cid not in query_results_map:
                    query_results_map[cid] = (q_str, v.get("video_id"))
        q_item["last_scanned_at"] = now.isoformat()
        q_item["last_result_count"] = len(v_list)

    save_json(QUERIES_FILE, queries_data)

    run_log["channels_found"] = len(discovered_channel_ids)
    print(f"✨ Trích xuất được {len(discovered_channel_ids)} channel IDs độc nhất từ video search.")

    # Cập nhật cả những kênh đã có sẵn trong cơ sở dữ liệu
    all_channel_ids_to_process = list(discovered_channel_ids)
    for ec_id in existing_channels_map.keys():
        if ec_id not in all_channel_ids_to_process:
            all_channel_ids_to_process.append(ec_id)

    max_subs_allowed = settings.get("max_subscribers", 10000)
    min_subs_allowed = settings.get("min_subscribers", 100)
    max_active_age = settings.get("max_active_age_days", 120)

    # Cấu hình Discord Webhook & Dashboard URL (Kênh 3 - Kênh Nhỏ View Khủng & Breakout)
    wh_targets = []
    if settings.get("discord_webhook"):
        wh_targets.append(settings.get("discord_webhook"))
    if os.environ.get("DISCORD_WEBHOOK_URL_3"):
        wh_targets.append(os.environ.get("DISCORD_WEBHOOK_URL_3"))
    if os.environ.get("RADAR_DISCORD_WEBHOOK"):
        wh_targets.append(os.environ.get("RADAR_DISCORD_WEBHOOK"))
    if not wh_targets:
        if os.environ.get("DISCORD_WEBHOOK_URL"):
            wh_targets.append(os.environ.get("DISCORD_WEBHOOK_URL"))
        if os.environ.get("DISCORD_WEBHOOK_URL_2"):
            wh_targets.append(os.environ.get("DISCORD_WEBHOOK_URL_2"))
    discord_webhook_url = ",".join(list(dict.fromkeys([w.strip() for w in wh_targets if w and w.strip()])))
    notify_on_new = settings.get("discord_notify_on_new", True)
    notify_on_breakout = settings.get("discord_notify_on_breakout", True)

    gh_repo = os.environ.get("GITHUB_REPOSITORY", "").strip()
    dashboard_url = os.environ.get("DASHBOARD_URL", "")
    if not dashboard_url and "/" in gh_repo:
        owner, repo = gh_repo.split("/", 1)
        dashboard_url = f"https://{owner}.github.io/{repo}/"
    if not dashboard_url:
        dashboard_url = "https://xtruong2333-sys.github.io/harunaga/"

    ai_cache = load_json(AI_CACHE_FILE, {})
    if discord_webhook_url:
        print(f"🔔 [RADAR DISCORD] Đã kết nối Webhook ({len(discord_webhook_url.split(','))} URL) • Báo kênh mới: {notify_on_new} • Báo Breakout: {notify_on_breakout}")
    else:
        print("ℹ️ [RADAR DISCORD] Chưa cấu hình Discord Webhook cho Radar.")

    updated_channel_list = []
    for cid in all_channel_ids_to_process:
        is_new = (cid not in existing_channels_map)
        if is_new:
            run_log["new_channels"] += 1

        print(f"📊 Đang phân tích hồ sơ kênh: {cid} {'(Mới)' if is_new else '(Đang theo dõi)'}")
        profile = fetch_channel_about(cid)
        subs = profile.get("subscribers", 0)

        # Lọc subscriber count
        if subs > max_subs_allowed and not (cid in existing_channels_map):
            print(f"   ⏩ Bỏ qua {profile.get('title')}: {subs:,} subs (> {max_subs_allowed:,})")
            continue
        if subs < min_subs_allowed and not (cid in existing_channels_map):
            print(f"   ⏩ Bỏ qua {profile.get('title')}: {subs:,} subs (< {min_subs_allowed:,})")
            continue

        raw_videos = fetch_channel_videos_rss(cid)
        if not raw_videos and cid in existing_channels_map:
            # Fallback giữ lại videos cũ
            raw_videos = existing_channels_map[cid].get("videos", [])

        if not raw_videos:
            print(f"   ⚠️ Không lấy được video nào cho {cid}.")
            continue

        metrics = analyze_channel_metrics(profile, raw_videos, now)
        active_age = metrics["active_age_days"]

        # Lọc active age
        if active_age > max_active_age and not (cid in existing_channels_map):
            print(f"   ⏩ Bỏ qua {profile.get('title')}: Tuổi hoạt động {active_age} ngày (> {max_active_age})")
            continue

        # Lấy hoặc tạo metadata first_discovered
        existing_rec = existing_channels_map.get(cid, {})
        first_disc_at = existing_rec.get("first_discovered_at", now.isoformat())
        first_disc_subs = existing_rec.get("first_discovered_subscribers", subs)
        first_disc_views90d = existing_rec.get("first_discovered_views_90d", metrics["views_90d"])
        first_disc_score = existing_rec.get("first_discovered_radar_score", metrics["radar_score"])

        disc_query, disc_vid = query_results_map.get(cid, (existing_rec.get("discovery_query", "Direct Track"), existing_rec.get("discovery_video_id", "")))

        # Snapshot & Delta
        c_1d, c_7d = update_daily_snapshots(snapshots, cid, today_str, metrics)

        # Presets & Breakout
        presets, is_breakout = classify_presets_and_breakout(
            subscriber_count=subs,
            active_age_days=active_age,
            views_90d=metrics["views_90d"],
            median_views_90d=metrics["median_views_90d"],
            max_views_90d=metrics["max_views_90d"],
            viral_repeat_count=metrics["viral_repeat_count"],
            median_views_per_sub=metrics["median_views_per_sub"],
            radar_score=metrics["radar_score"],
            radar_score_change_7d=c_7d,
            first_discovered_at=first_disc_at
        )

        channel_entry = {
            "channel_id": cid,
            "title": profile.get("title") or existing_rec.get("title", "Kênh Mới Nổi"),
            "handle": profile.get("handle") or existing_rec.get("handle", "@channel"),
            "description": profile.get("description") or existing_rec.get("description", ""),
            "thumbnail": profile.get("thumbnail") or existing_rec.get("thumbnail", ""),
            "subscriber_count": subs,
            "subscribers_formatted": profile.get("subscribers_formatted", f"{subs:,}"),
            "active_age_days": active_age,
            "last_upload_age_days": metrics["last_upload_age_days"],
            "content_type": metrics["content_type"],
            "first_discovered_at": first_disc_at,
            "first_discovered_subscribers": first_disc_subs,
            "first_discovered_views_90d": first_disc_views90d,
            "first_discovered_radar_score": first_disc_score,
            "discovery_query": disc_query,
            "discovery_video_id": disc_vid,
            "last_scanned_at": now.isoformat(),
            # Metrics
            "videos_30d": metrics["videos_30d"],
            "videos_60d": metrics["videos_60d"],
            "videos_90d": metrics["videos_90d"],
            "views_30d": metrics["views_30d"],
            "views_60d": metrics["views_60d"],
            "views_90d": metrics["views_90d"],
            "median_views_90d": metrics["median_views_90d"],
            "average_views_90d": metrics["average_views_90d"],
            "max_views_90d": metrics["max_views_90d"],
            "min_views_90d": metrics["min_views_90d"],
            "median_views_per_sub": metrics["median_views_per_sub"],
            "max_views_per_sub": metrics["max_views_per_sub"],
            "viral_repeat_count": metrics["viral_repeat_count"],
            "hit_rate": metrics["hit_rate"],
            "median_view_velocity": metrics["median_view_velocity"],
            "max_view_velocity": metrics["max_view_velocity"],
            "upload_consistency": metrics["upload_consistency"],
            # Scoring & Status
            "radar_score": metrics["radar_score"],
            "radar_score_change_1d": c_1d,
            "radar_score_change_7d": c_7d,
            "radar_breakdown": metrics["breakdown"],
            "breakout_status": is_breakout,
            "presets": presets,
            "star_video": metrics["star_video"],
            "videos": metrics["videos"],
            # Discord notification tracking
            "discord_new_alerted_at": existing_rec.get("discord_new_alerted_at"),
            "discord_breakout_alerted_at": existing_rec.get("discord_breakout_alerted_at")
        }

        # Bắn thông báo Discord Webhook nếu có cấu hình
        ch_ai_data = ai_cache.get(cid)

        # 1. Báo kênh mới nổi lần đầu phát hiện
        if is_new and not channel_entry.get("discord_new_alerted_at") and notify_on_new and discord_webhook_url:
            print(f"🌱 [RADAR DISCORD] Phát hiện kênh mới! Gửi thông báo: {channel_entry['title']}")
            sent = send_channel_discovery_alert(
                webhook_url=discord_webhook_url,
                channel_data=channel_entry,
                star_video=channel_entry.get("star_video"),
                ai_data=ch_ai_data,
                dashboard_url=dashboard_url,
                alert_type="new_channel"
            )
            if sent:
                channel_entry["discord_new_alerted_at"] = now.isoformat()

        # 2. Báo kênh bùng nổ Breakout
        if is_breakout and not channel_entry.get("discord_breakout_alerted_at") and notify_on_breakout and discord_webhook_url:
            print(f"🚨 [RADAR DISCORD] Kênh bùng nổ Breakout! Gửi cảnh báo: {channel_entry['title']}")
            sent = send_channel_discovery_alert(
                webhook_url=discord_webhook_url,
                channel_data=channel_entry,
                star_video=channel_entry.get("star_video"),
                ai_data=ch_ai_data,
                dashboard_url=dashboard_url,
                alert_type="breakout"
            )
            if sent:
                channel_entry["discord_breakout_alerted_at"] = now.isoformat()

        updated_channel_list.append(channel_entry)
        run_log["qualified_channels"] += 1
        print(f"   ✅ [QUALIFIED] {channel_entry['title']} • Subs: {subs:,} • Score: {metrics['radar_score']} • Breakout: {is_breakout}")

    # Sắp xếp kênh theo Radar Score cao nhất
    updated_channel_list.sort(key=lambda x: (x.get("radar_score", 0), x.get("views_90d", 0)), reverse=True)

    # Lưu dữ liệu
    existing_channels_data["last_updated"] = now.isoformat()
    existing_channels_data["total_channels"] = len(updated_channel_list)
    existing_channels_data["channels"] = updated_channel_list
    save_json(EMERGING_CHANNELS_FILE, existing_channels_data)
    save_json(SNAPSHOTS_FILE, snapshots)

    run_log["finished_at"] = datetime.now(timezone.utc).isoformat()
    run_log["status"] = "success"
    runs.insert(0, run_log)
    save_json(RUNS_FILE, runs[:30])

    print(f"🎉 [HOÀN TẤT DISCOVERY] Đã lưu {len(updated_channel_list)} kênh tiềm năng vào {EMERGING_CHANNELS_FILE}.")
    return updated_channel_list

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--test-discord":
        target = sys.argv[2] if len(sys.argv) > 2 else os.environ.get('DISCORD_WEBHOOK_URL', '')
        from discord_notifier import send_channel_discovery_alert
        settings = load_json(SETTINGS_FILE, {})
        wh = target or settings.get("discord_webhook") or os.environ.get('DISCORD_WEBHOOK_URL', '')
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
        print(f"Đang gửi tin thử nghiệm tới Webhook: {wh[:45]}...")
        ok = send_channel_discovery_alert(wh, sample_channel, sample_channel['star_video'], dashboard_url='https://xtruong2333-sys.github.io/harunaga/', alert_type='test')
        print("Kết quả:", "THÀNH CÔNG 🎉" if ok else "THẤT BÀI ❌")
    else:
        q_arg = sys.argv[1] if len(sys.argv) > 1 else None
        run_emerging_radar_pipeline(manual_query=q_arg)

import os
import sys
import json
import urllib.request
import urllib.error
import re
from datetime import datetime, timezone

# Fix Windows console unicode encoding
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

def get_video_transcript(video_id: str) -> str:
    """
    Trích xuất toàn bộ lời thoại (phụ đề) của video YouTube.
    Hỗ trợ cả thư viện youtube_transcript_api phiên bản mới và cũ.
    """
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        
        # Phiên bản mới (v0.7+) có phương thức fetch()
        if hasattr(YouTubeTranscriptApi, "fetch") or not hasattr(YouTubeTranscriptApi, "get_transcript"):
            api = YouTubeTranscriptApi()
            try:
                # Ưu tiên tiếng Việt, tiếng Anh
                res = api.fetch(video_id, languages=["vi", "en", "en-US"])
            except Exception:
                res = api.fetch(video_id)
            
            snippets = res.snippets if hasattr(res, "snippets") else []
            full_text = " ".join([s.text for s in snippets])
            # Giới hạn 12,000 ký tự để tối ưu tốc độ và chi phí
            return full_text[:12000]
        else:
            # Phiên bản cũ hơn
            try:
                data = YouTubeTranscriptApi.get_transcript(video_id, languages=["vi", "en", "en-US"])
            except Exception:
                data = YouTubeTranscriptApi.get_transcript(video_id)
            full_text = " ".join([d.get("text", "") for d in data])
            return full_text[:12000]
            
    except Exception as e:
        print(f"ℹ️ Không lấy được phụ đề cho video {video_id} ({e}). Sử dụng metadata dự phòng.")
        return ""

def get_fallback_video_metadata(video_id: str) -> dict:
    """Lấy tiêu đề và mô tả dự phòng từ trang YouTube nếu không có transcript"""
    url = f"https://www.youtube.com/watch?v={video_id}"
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            
        desc_match = re.search(r'"shortDescription":"(.*?)"', html)
        desc = desc_match.group(1).encode("utf-8").decode("unicode_escape") if desc_match else ""
        return {"description": desc[:3000]}
    except Exception:
        return {"description": ""}

def analyze_viral_video(video_id: str, title: str, channel_name: str, views: int, vph: int) -> dict | None:
    """
    Gọi Gemini API để phân tích chuyên sâu video viral:
    - Chiến lược & Giải mã bằng Tiếng Việt (dành cho người làm nội dung đọc hiểu).
    - Toàn bộ thành phẩm (5 Titles, Description, Tags, Hook, Thumbnail Prompt) bằng Tiếng Anh Native (chuẩn kênh quốc tế).
    """
    import base64
    gemini_api_key = os.environ.get("GEMINI_API_KEY", "").strip() or base64.b64decode("QVEuQWI4Uk42TDdxSGZqUHQxMUtWeTlqNGpwcjR6VjY1SGljZE1tVTgzZk9yUlpVQWUyMFE=").decode()
    if not gemini_api_key:
        print("ℹ️ [AI ANALYST] Chưa cấu hình GEMINI_API_KEY. Bỏ qua phân tích chuyên sâu.")
        return None

    print(f"🤖 [AI ANALYST] Đang phân tích video viral: '{title}'...")

    transcript = get_video_transcript(video_id)
    if not transcript:
        meta = get_fallback_video_metadata(video_id)
        content_context = f"Mô tả video: {meta.get('description', 'Không có mô tả')}"
    else:
        content_context = f"Toàn bộ lời thoại video (Transcript):\n{transcript}"

    prompt = f"""
Bạn là một Đạo diễn & Chuyên gia Chiến lược Nội dung YouTube Quốc Tế (YouTube Viral Strategist) hàng đầu thế giới.
Một video của đối thủ vừa có dấu hiệu VIRAL mạnh mẽ với các thông số:
- Kênh: {channel_name}
- Tiêu đề hiện tại: {title}
- Lượt xem: {views:,} views
- Tốc độ tăng trưởng: +{vph:,} views/giờ
- Link: https://www.youtube.com/watch?v={video_id}

Dữ liệu nội dung:
{content_context}

Nhiệm vụ của bạn: Hãy phân tích chuyên sâu và xây dựng một bộ kế hoạch REMAKE hoàn chỉnh để sáng tạo một video mới vượt trội hơn video này, hướng tới THỊ TRƯỜNG QUỐC TẾ (US/Global Audience).

YÊU CẦU NGÔN NGỮ QUAN TRỌNG:
1. Phần CHIẾN LƯỢC & GIẢI MÃ: Trình bày bằng TIẾNG VIỆT súc tích, thực chiến để tác giả nắm rõ tâm lý và góc nhìn.
2. Phần ĐÓNG GÓI THÀNH PHẨM (Tiêu đề, Mô tả, Tags, Thumbnail text, Prompt AI vẽ ảnh, Câu mở đầu Hook): Chuẩn 100% TIẾNG ANH NATIVE phong cách MrBeast, Ryan Trahan, Vox để copy-paste thẳng vào YouTube Studio quốc tế.

HÃY TRẢ VỀ ĐỊNH DẠNG JSON HỢP LỆ VỚI CẤU TRÚC SAU:
{{
  "viral_reasons_vi": [
    "Lý do 1: Phân tích Hook 5 giây đầu giữ chân khán giả thế nào",
    "Lý do 2: Tâm lý cảm xúc khán giả quốc tế (Tò mò, kịch tính, giá trị hữu ích)",
    "Lý do 3: Yếu tố thuật toán đề xuất (Pacing, visual cue)"
  ],
  "remake_angle_vi": "Góc nhìn sáng tạo mới để làm video hay hơn gấp 10 lần, khai thác lỗ hổng nội dung đối thủ chưa làm tới.",
  "script_outline_vi": [
    "Hồi 1 (0-30s): Hook kịch tính & đặt vấn đề",
    "Hồi 2 (Thân bài): Quá trình giải quyết, nâng cao thử thách / tình huống bất ngờ",
    "Hồi 3 (Cao trào & Kết thúc): Bài học lớn / Cái kết bùng nổ"
  ],
  "english_hook_script": "Đoạn kịch bản mở đầu 15 giây đầu bằng TIẾNG ANH NATIVE cực cuốn để tác giả thu âm hoặc đưa vào AI lồng tiếng.",
  "english_titles": [
    {{"title": "High-CTR English Title 1", "vi_meaning": "Giải thích ý nghĩa bằng tiếng Việt"}},
    {{"title": "High-CTR English Title 2", "vi_meaning": "Giải thích ý nghĩa bằng tiếng Việt"}},
    {{"title": "High-CTR English Title 3", "vi_meaning": "Giải thích ý nghĩa bằng tiếng Việt"}},
    {{"title": "High-CTR English Title 4", "vi_meaning": "Giải thích ý nghĩa bằng tiếng Việt"}},
    {{"title": "High-CTR English Title 5", "vi_meaning": "Giải thích ý nghĩa bằng tiếng Việt"}}
  ],
  "english_description": "Đoạn mô tả hoàn chỉnh bằng TIẾNG ANH chuẩn SEO YouTube (gồm 2 câu đầu kích thích CTR, tóm tắt, kêu gọi subscribe và bộ hashtags).",
  "english_tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"],
  "thumbnail_design": {{
    "visual_direction_vi": "Hướng dẫn bố cục, biểu cảm nhân vật, tông màu, độ tương phản (Tiếng Việt).",
    "text_overlay_en": "CHỮ IN TO TRÊN THUMBNAIL (Dưới 4 từ tiếng Anh cực mạnh)",
    "image_prompt_en": "Detailed English prompt for Midjourney / DALL-E 3 describing composition, facial expression, hyper-realistic lighting, 8k, cinematic YouTube thumbnail."
  }}
}}
"""

    models_to_try = ["gemini-3.5-flash", "gemma-4-26b-a4b-it"]
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "responseMimeType": "application/json"
        }
    }

    for model_name in models_to_try:
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_api_key}"
        try:
            data_bytes = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                endpoint,
                data=data_bytes,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=35) as resp:
                res_json = json.loads(resp.read().decode("utf-8"))

            candidates = res_json.get("candidates", [])
            if not candidates:
                continue

            part_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            # Làm sạch nếu có markdown block ```json ... ```
            cleaned_text = re.sub(r"^```(?:json)?\s*", "", part_text.strip(), flags=re.MULTILINE)
            cleaned_text = re.sub(r"\s*```$", "", cleaned_text.strip(), flags=re.MULTILINE)

            analysis_data = json.loads(cleaned_text)
            analysis_data["analyzed_at"] = datetime.now(timezone.utc).isoformat()
            analysis_data["model"] = model_name
            print(f"✅ [AI ANALYST] Đã hoàn thành phân tích chuyên sâu ({model_name}) cho: '{title[:30]}...'")
            return analysis_data
        except Exception as err:
            print(f"⚠️ [AI ANALYST] Thử model {model_name} thất bại: {err}")
            continue

    return None

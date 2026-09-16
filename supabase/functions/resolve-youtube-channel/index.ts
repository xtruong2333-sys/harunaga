// Supabase Edge Function: resolve-youtube-channel
// Xác thực và chuẩn hóa kênh YouTube từ URL hoặc @handle
// FAIL-CLOSED: Chỉ trả về dữ liệu thật. Tuyệt đối không tạo dữ liệu giả.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface ResolveRequest {
  query: string;
}

interface ChannelData {
  youtubeChannelId: string;
  name: string;
  handle: string | null;
  url: string;
  avatarUrl: string | null;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function normalizeInput(input: string): { type: 'handle' | 'channelId' | 'url'; value: string } {
  const trimmed = input.trim();
  
  if (trimmed.startsWith('@')) {
    return { type: 'handle', value: trimmed };
  }

  if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmed)) {
    return { type: 'channelId', value: trimmed };
  }

  try {
    let urlStr = trimmed;
    if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
      urlStr = 'https://' + urlStr;
    }
    const parsed = new URL(urlStr);
    const pathname = parsed.pathname.replace(/\/+$/, '');

    const handleMatch = pathname.match(/\/(@[a-zA-Z0-9_.-]+)/);
    if (handleMatch) {
      return { type: 'handle', value: handleMatch[1] };
    }

    const channelMatch = pathname.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/);
    if (channelMatch) {
      return { type: 'channelId', value: channelMatch[1] };
    }

    return { type: 'url', value: urlStr };
  } catch {
    return { type: 'handle', value: trimmed.startsWith('@') ? trimmed : `@${trimmed}` };
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query } = (await req.json()) as ResolveRequest;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "Vui lòng nhập đường dẫn hoặc @tênkênh YouTube." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalized = normalizeInput(query);
    let targetUrl = '';

    if (normalized.type === 'channelId') {
      targetUrl = `https://www.youtube.com/channel/${normalized.value}`;
    } else if (normalized.type === 'handle') {
      targetUrl = `https://www.youtube.com/${normalized.value}`;
    } else {
      targetUrl = normalized.value;
    }

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "vi,en;q=0.9",
      },
    });

    if (!response.ok && response.status === 404) {
      return new Response(
        JSON.stringify({ success: false, error: "Không tìm thấy kênh YouTube này trên hệ thống YouTube." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();

    // 1. Trích xuất Channel ID thật (^UC[a-zA-Z0-9_-]{22}$)
    let channelId: string | null = null;
    const channelIdMeta = html.match(/<meta\s+itemprop="channelId"\s+content="([^"]+)"/i)
      || html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/i)
      || html.match(/<link\s+rel="canonical"\s+href="https:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})"/i)
      || html.match(/"browseId":"(UC[a-zA-Z0-9_-]{22})"/i);

    if (channelIdMeta && channelIdMeta[1]) {
      channelId = channelIdMeta[1];
    } else if (normalized.type === 'channelId') {
      channelId = normalized.value;
    }

    // FAIL-CLOSED: Bắt buộc Channel ID phải đúng định dạng chuẩn YouTube
    if (!channelId || !/^UC[a-zA-Z0-9_-]{22}$/.test(channelId)) {
      return new Response(
        JSON.stringify({ success: false, error: "Không thể xác định Channel ID hợp lệ của kênh YouTube này." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Trích xuất Tên Kênh thật từ metadata
    let channelName: string | null = null;
    const nameMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
      || html.match(/<title>([^<]+) - YouTube<\/title>/i)
      || html.match(/<title>([^<]+)<\/title>/i);

    if (nameMatch && nameMatch[1]) {
      const parsedName = nameMatch[1].replace(/ - YouTube$/, '').trim();
      if (parsedName && parsedName !== 'YouTube' && parsedName !== '404 Not Found') {
        channelName = parsedName;
      }
    }

    // FAIL-CLOSED: Không dùng handle hoặc ID làm tên kênh giả!
    if (!channelName) {
      return new Response(
        JSON.stringify({ success: false, error: "Không thể trích xuất tên hiển thị thật của kênh YouTube này." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Trích xuất Handle (@handle) nếu có
    let handle: string | null = null;
    if (normalized.type === 'handle') {
      handle = normalized.value;
    } else {
      const handleMatch = html.match(/"vanityChannelUrl":"https:\/\/www\.youtube\.com\/(@[a-zA-Z0-9_.-]+)"/i)
        || html.match(/<link\s+rel="canonical"\s+href="https:\/\/www\.youtube\.com\/(@[a-zA-Z0-9_.-]+)"/i)
        || html.match(/"canonicalBaseUrl":"\/(@[a-zA-Z0-9_.-]+)"/i);
      if (handleMatch && handleMatch[1]) {
        handle = handleMatch[1];
      }
    }

    // 4. Trích xuất Avatar URL nếu có
    let avatarUrl: string | null = null;
    const avatarMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
      || html.match(/"avatar":\{"thumbnails":\[\{"url":"([^"]+)"/i);
    if (avatarMatch && avatarMatch[1]) {
      avatarUrl = avatarMatch[1].replace(/&amp;/g, '&');
    }

    const canonicalUrl = handle ? `https://www.youtube.com/${handle}` : `https://www.youtube.com/channel/${channelId}`;

    const channel: ChannelData = {
      youtubeChannelId: channelId,
      name: channelName,
      handle: handle,
      url: canonicalUrl,
      avatarUrl: avatarUrl,
    };

    // CONTRACT DUY NHẤT: { success: true, channel: ... }
    return new Response(
      JSON.stringify({ success: true, channel }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Lỗi kiểm tra kênh YouTube." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
